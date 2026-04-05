/**
 * Contact Parser — Natural language contact input parsing.
 *
 * Ported from apps/contacts/apps/web/src/lib/utils/contact-parser.ts
 *
 * Examples:
 * - "Max Mustermann @ACME Corp max@example.com #kunde"
 * - "Anna Schmidt bei Google +49 123 456789"
 */

import { extractTags, extractAtReference } from '@mana/shared-utils';

export interface ParsedContact {
	displayName: string;
	firstName?: string;
	lastName?: string;
	company?: string;
	email?: string;
	phone?: string;
	tagNames: string[];
}

export interface ParsedContactWithIds {
	displayName: string;
	firstName?: string;
	lastName?: string;
	company?: string;
	email?: string;
	phone?: string;
	tagIds: string[];
}

const EMAIL_PATTERN = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/;

const PHONE_PATTERNS: RegExp[] = [
	/\+\d{1,3}[-\s]?\d{2,4}[-\s]?\d{3,}[-\s]?\d*/,
	/\b0\d{2,4}[-\s/]?\d{3,}[-\s]?\d*/,
	/\b\d{6,}\b/,
];

const COMPANY_PATTERNS: RegExp[] = [
	/\bbei\s+([^@#]+?)(?=\s+(?:@|#|\+|[a-zA-Z0-9._%+-]+@)|$)/i,
	/\bvon\s+([^@#]+?)(?=\s+(?:@|#|\+|[a-zA-Z0-9._%+-]+@)|$)/i,
];

function extractEmail(text: string): { email?: string; remaining: string } {
	const match = text.match(EMAIL_PATTERN);
	if (match) {
		return { email: match[1], remaining: text.replace(EMAIL_PATTERN, '').trim() };
	}
	return { email: undefined, remaining: text };
}

function extractPhone(text: string): { phone?: string; remaining: string } {
	for (const pattern of PHONE_PATTERNS) {
		const match = text.match(pattern);
		if (match) {
			return { phone: match[0].trim(), remaining: text.replace(pattern, '').trim() };
		}
	}
	return { phone: undefined, remaining: text };
}

function extractCompanyPattern(text: string): { company?: string; remaining: string } {
	for (const pattern of COMPANY_PATTERNS) {
		const match = text.match(pattern);
		if (match) {
			return { company: match[1].trim(), remaining: text.replace(pattern, '').trim() };
		}
	}
	return { company: undefined, remaining: text };
}

function parseNames(displayName: string): { firstName?: string; lastName?: string } {
	const parts = displayName.trim().split(/\s+/);
	if (parts.length === 0) return {};
	if (parts.length === 1) return { firstName: parts[0] };
	return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function parseContactInput(input: string): ParsedContact {
	let text = input.trim();

	const tagsResult = extractTags(text);
	text = tagsResult.remaining;
	const tagNames = tagsResult.value || [];

	const atRefResult = extractAtReference(text);
	text = atRefResult.remaining;
	let company = atRefResult.value;

	if (!company) {
		const companyPatternResult = extractCompanyPattern(text);
		text = companyPatternResult.remaining;
		company = companyPatternResult.company;
	}

	const emailResult = extractEmail(text);
	text = emailResult.remaining;

	const phoneResult = extractPhone(text);
	text = phoneResult.remaining;

	const displayName = text.replace(/\s+/g, ' ').trim();
	const { firstName, lastName } = parseNames(displayName);

	return {
		displayName,
		firstName,
		lastName,
		company,
		email: emailResult.email,
		phone: phoneResult.phone,
		tagNames,
	};
}

export function resolveContactIds(
	parsed: ParsedContact,
	tags: { id: string; name: string }[]
): ParsedContactWithIds {
	const tagIds = parsed.tagNames
		.map((name) => tags.find((t) => t.name.toLowerCase() === name.toLowerCase())?.id)
		.filter((id): id is string => !!id);

	return {
		displayName: parsed.displayName,
		firstName: parsed.firstName,
		lastName: parsed.lastName,
		company: parsed.company,
		email: parsed.email,
		phone: parsed.phone,
		tagIds,
	};
}

export function formatParsedContactPreview(parsed: ParsedContact): string {
	const parts: string[] = [];
	if (parsed.company) parts.push(parsed.company);
	if (parsed.email) parts.push(parsed.email);
	if (parsed.phone) parts.push(parsed.phone);
	if (parsed.tagNames.length > 0) parts.push(parsed.tagNames.map((t) => `#${t}`).join(' '));
	return parts.join(' · ');
}
