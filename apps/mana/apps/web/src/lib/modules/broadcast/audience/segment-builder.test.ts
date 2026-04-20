import { describe, it, expect } from 'vitest';
import type { Contact } from '$lib/modules/contacts/types';
import { matchContact, filterAudience, countAudience, describeAudience } from './segment-builder';
import type { AudienceDefinition, AudienceFilter } from '../types';

function makeContact(overrides: Partial<Contact> = {}): Contact {
	return {
		id: 'c1',
		firstName: 'Test',
		lastName: 'Kontakt',
		displayName: 'Test Kontakt',
		email: 'test@example.com',
		phone: null,
		mobile: null,
		company: null,
		jobTitle: null,
		street: null,
		city: null,
		postalCode: null,
		country: null,
		latitude: null,
		longitude: null,
		notes: null,
		photoUrl: null,
		birthday: null,
		website: null,
		linkedin: null,
		twitter: null,
		instagram: null,
		github: null,
		isFavorite: false,
		isArchived: false,
		tags: [],
		tagIds: [],
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
		...overrides,
	} as Contact;
}

const f = (
	field: AudienceFilter['field'],
	op: AudienceFilter['op'],
	value: string
): AudienceFilter => ({
	field,
	op,
	value,
});

const audience = (filters: AudienceFilter[]): AudienceDefinition => ({
	filters,
	estimatedCount: 0,
});

describe('matchContact', () => {
	it('tag has: returns true when the contact has the tag', () => {
		expect(matchContact(makeContact({ tagIds: ['t1'] }), f('tag', 'has', 't1'))).toBe(true);
	});

	it('tag has: returns false when the contact lacks the tag', () => {
		expect(matchContact(makeContact({ tagIds: [] }), f('tag', 'has', 't1'))).toBe(false);
	});

	it('tag not-has: returns true when absent', () => {
		expect(matchContact(makeContact({ tagIds: [] }), f('tag', 'not-has', 't1'))).toBe(true);
	});

	it('tag not-has: returns false when present', () => {
		expect(matchContact(makeContact({ tagIds: ['t1'] }), f('tag', 'not-has', 't1'))).toBe(false);
	});

	it('email contains: case-insensitive', () => {
		expect(matchContact(makeContact({ email: 'foo@BAR.CH' }), f('email', 'contains', 'bar'))).toBe(
			true
		);
	});

	it('email eq: exact match required (after lowercasing both)', () => {
		expect(matchContact(makeContact({ email: 'a@b.ch' }), f('email', 'eq', 'A@B.CH'))).toBe(true);
		expect(matchContact(makeContact({ email: 'a@b.ch' }), f('email', 'eq', 'x@b.ch'))).toBe(false);
	});

	it('email has: returns true when a usable email exists', () => {
		expect(matchContact(makeContact({ email: 'x@y.z' }), f('email', 'has', ''))).toBe(true);
		expect(matchContact(makeContact({ email: null }), f('email', 'has', ''))).toBe(false);
	});
});

describe('filterAudience', () => {
	const contacts = [
		makeContact({ id: '1', email: 'a@x.ch', tagIds: ['kunde'] }),
		makeContact({ id: '2', email: 'b@x.ch', tagIds: ['kunde', 'trial'] }),
		makeContact({ id: '3', email: 'c@x.ch', tagIds: [] }),
		makeContact({ id: '4', email: null, tagIds: ['kunde'] }), // no email → excluded
	];

	it('no filters: returns all contacts with valid email', () => {
		const result = filterAudience(contacts, audience([]));
		expect(result.map((c) => c.id)).toEqual(['1', '2', '3']);
	});

	it('single tag filter: matches only contacts with the tag', () => {
		const result = filterAudience(contacts, audience([f('tag', 'has', 'kunde')]));
		expect(result.map((c) => c.id)).toEqual(['1', '2']);
	});

	it('AND semantics: all filters must match', () => {
		// Kunden OHNE trial-tag = nur Contact 1
		const result = filterAudience(
			contacts,
			audience([f('tag', 'has', 'kunde'), f('tag', 'not-has', 'trial')])
		);
		expect(result.map((c) => c.id)).toEqual(['1']);
	});

	it('drops contacts without usable email even if filters match', () => {
		// Contact 4 has 'kunde' tag but no email → excluded from result
		const result = filterAudience(contacts, audience([f('tag', 'has', 'kunde')]));
		expect(result.find((c) => c.id === '4')).toBeUndefined();
	});

	it('returns a new array (no input mutation)', () => {
		const before = contacts.slice();
		filterAudience(contacts, audience([f('tag', 'has', 'kunde')]));
		expect(contacts).toEqual(before);
	});
});

describe('countAudience', () => {
	it('matches filterAudience().length', () => {
		const contacts = [
			makeContact({ id: '1', email: 'a@x.ch', tagIds: ['kunde'] }),
			makeContact({ id: '2', email: 'b@x.ch', tagIds: [] }),
		];
		const def = audience([f('tag', 'has', 'kunde')]);
		expect(countAudience(contacts, def)).toBe(filterAudience(contacts, def).length);
	});
});

describe('describeAudience', () => {
	const resolver = (id: string) => {
		const names: Record<string, string> = { t1: 'Kunden', t2: 'Newsletter' };
		return names[id] ?? null;
	};

	it('no filters → "Alle Kontakte mit E-Mail"', () => {
		expect(describeAudience(audience([]), resolver)).toBe('Alle Kontakte mit E-Mail');
	});

	it('resolves tag names via the resolver', () => {
		const result = describeAudience(audience([f('tag', 'has', 't1')]), resolver);
		expect(result).toContain('Kunden');
	});

	it('falls back to the raw value when resolver returns null', () => {
		const result = describeAudience(audience([f('tag', 'has', 'unknown')]), resolver);
		expect(result).toContain('unknown');
	});

	it('joins multiple filters with · separator', () => {
		const result = describeAudience(
			audience([f('tag', 'has', 't1'), f('tag', 'not-has', 't2')]),
			resolver
		);
		expect(result).toContain('·');
		expect(result).toContain('Kunden');
		expect(result).toContain('Newsletter');
	});
});
