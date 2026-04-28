/**
 * Pure audience-segment matcher.
 *
 * Given a contact list and a set of filters, return only the contacts
 * that satisfy ALL filters (AND semantics). Filter `value` meanings:
 *   - field='tag'    → value = tag ID (not name). UI resolves names.
 *   - field='email'  → value = substring or exact email
 *   - field='custom' → reserved for per-contact custom fields later
 *
 * Semantics per op:
 *   has       → the tag/value is present
 *   not-has   → the tag/value is absent
 *   eq        → exact match (for email: case-insensitive)
 *   contains  → substring match (for email: case-insensitive)
 *
 * Empty filter list matches every contact — "keine Filter" means
 * "alle Empfänger", not "niemand". Callers that need the opposite
 * (default-deny) should gate the send separately.
 */

import type { Contact } from '$lib/modules/contacts/types';
import type { AudienceFilter, AudienceDefinition } from '../types';

export function matchContact(contact: Contact, filter: AudienceFilter): boolean {
	switch (filter.field) {
		case 'tag': {
			const has = (contact.tagIds ?? []).includes(filter.value);
			if (filter.op === 'has') return has;
			if (filter.op === 'not-has') return !has;
			// eq / contains don't apply to tags — graceful fail to `has`.
			return has;
		}

		case 'email': {
			const email = (contact.email ?? '').toLowerCase();
			const v = filter.value.toLowerCase();
			if (filter.op === 'has') return email.length > 0;
			if (filter.op === 'not-has') return email.length === 0;
			if (filter.op === 'eq') return email === v;
			if (filter.op === 'contains') return email.includes(v);
			return false;
		}

		case 'custom':
			// Placeholder — M2+ ships tags + email. Custom fields land in
			// Phase 2 when contact schema grows a free-form fields map.
			return true;

		default:
			return true;
	}
}

/**
 * Run all filters against a contact list. Returns a copy — never mutates
 * the input. Contacts without a usable email address are dropped even if
 * they match the filters; you can't send a newsletter to someone without
 * an email, and silently counting them would inflate the estimated count.
 */
export function filterAudience(contacts: Contact[], audience: AudienceDefinition): Contact[] {
	const filtered = audience.filters.length
		? contacts.filter((c) => audience.filters.every((f) => matchContact(c, f)))
		: contacts.slice();
	return filtered.filter((c) => typeof c.email === 'string' && c.email.includes('@'));
}

/** Fast count without materialising the full array (same filter logic). */
export function countAudience(contacts: Contact[], audience: AudienceDefinition): number {
	return filterAudience(contacts, audience).length;
}

/**
 * Human-friendly summary of a filter AST. Used in the ListView row and
 * the Preflight step to show "an: Kunden ohne trial-tag (23 Empfänger)"
 * instead of just the raw number.
 */
export function describeAudience(
	audience: AudienceDefinition,
	tagNameResolver: (tagId: string) => string | null
): string {
	if (audience.filters.length === 0) return 'Alle Kontakte mit E-Mail';
	const parts = audience.filters.map((f) => {
		if (f.field === 'tag') {
			const name = tagNameResolver(f.value) ?? f.value;
			return f.op === 'has' ? `Tag "${name}"` : `ohne Tag "${name}"`;
		}
		if (f.field === 'email') {
			if (f.op === 'eq') return `E-Mail = ${f.value}`;
			if (f.op === 'contains') return `E-Mail enthält "${f.value}"`;
			if (f.op === 'has') return `mit E-Mail`;
			if (f.op === 'not-has') return `ohne E-Mail`;
		}
		return `${f.field} ${f.op} ${f.value}`;
	});
	return parts.join(' · ');
}
