/**
 * Contact Parser for Contacts App
 *
 * Extends the base parser with contact-specific patterns:
 * - Company: @CompanyName or bei CompanyName
 * - Email: Recognizes email addresses
 * - Phone: Recognizes phone numbers
 * - Name: First and last name extraction
 */

import { extractTags, extractAtReference } from '@manacore/shared-utils';

export interface ParsedContact {
	displayName: string;
	firstName?: string;
	lastName?: string;
	company?: string;
	email?: string;
	phone?: string;
	tagNames: string[];
}

interface Tag {
	id: string;
	name: string;
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

// Email pattern
const EMAIL_PATTERN = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/;

// Phone patterns (various formats)
const PHONE_PATTERNS: RegExp[] = [
	// International format: +49 123 456789, +49-123-456789
	/\+\d{1,3}[-\s]?\d{2,4}[-\s]?\d{3,}[-\s]?\d*/,
	// German format: 0123 456789, 0123/456789
	/\b0\d{2,4}[-\s/]?\d{3,}[-\s]?\d*/,
	// Simple format: 123456789 (at least 6 digits)
	/\b\d{6,}\b/,
];

// Company patterns (alternative to @company)
const COMPANY_PATTERNS: RegExp[] = [
	/\bbei\s+([^@#]+?)(?=\s+(?:@|#|\+|[a-zA-Z0-9._%+-]+@)|$)/i,
	/\bvon\s+([^@#]+?)(?=\s+(?:@|#|\+|[a-zA-Z0-9._%+-]+@)|$)/i,
];

/**
 * Extract email from text
 */
function extractEmail(text: string): { email?: string; remaining: string } {
	const match = text.match(EMAIL_PATTERN);
	if (match) {
		return {
			email: match[1],
			remaining: text.replace(EMAIL_PATTERN, '').trim(),
		};
	}
	return { email: undefined, remaining: text };
}

/**
 * Extract phone number from text
 */
function extractPhone(text: string): { phone?: string; remaining: string } {
	for (const pattern of PHONE_PATTERNS) {
		const match = text.match(pattern);
		if (match) {
			return {
				phone: match[0].trim(),
				remaining: text.replace(pattern, '').trim(),
			};
		}
	}
	return { phone: undefined, remaining: text };
}

/**
 * Extract company from text (bei/von patterns)
 */
function extractCompanyPattern(text: string): { company?: string; remaining: string } {
	for (const pattern of COMPANY_PATTERNS) {
		const match = text.match(pattern);
		if (match) {
			return {
				company: match[1].trim(),
				remaining: text.replace(pattern, '').trim(),
			};
		}
	}
	return { company: undefined, remaining: text };
}

/**
 * Extract first and last name from display name
 */
function parseNames(displayName: string): { firstName?: string; lastName?: string } {
	const parts = displayName.trim().split(/\s+/);

	if (parts.length === 0) {
		return {};
	}

	if (parts.length === 1) {
		return { firstName: parts[0] };
	}

	// First part is first name, rest is last name
	return {
		firstName: parts[0],
		lastName: parts.slice(1).join(' '),
	};
}

/**
 * Parse natural language contact input
 *
 * Examples:
 * - "Max Mustermann @ACME Corp max@example.com #kunde #wichtig"
 * - "Anna Schmidt bei Google +49 123 456789"
 * - "Peter Müller peter@mail.de #privat"
 */
export function parseContactInput(input: string): ParsedContact {
	let text = input.trim();

	// Extract tags first (#tag1 #tag2)
	const tagsResult = extractTags(text);
	text = tagsResult.remaining;
	const tagNames = tagsResult.value || [];

	// Extract company via @CompanyName
	const atRefResult = extractAtReference(text);
	text = atRefResult.remaining;
	let company = atRefResult.value;

	// If no @company, try bei/von patterns
	if (!company) {
		const companyPatternResult = extractCompanyPattern(text);
		text = companyPatternResult.remaining;
		company = companyPatternResult.company;
	}

	// Extract email
	const emailResult = extractEmail(text);
	text = emailResult.remaining;
	const email = emailResult.email;

	// Extract phone
	const phoneResult = extractPhone(text);
	text = phoneResult.remaining;
	const phone = phoneResult.phone;

	// Clean up multiple spaces and get display name
	const displayName = text.replace(/\s+/g, ' ').trim();

	// Parse first and last name
	const { firstName, lastName } = parseNames(displayName);

	return {
		displayName,
		firstName,
		lastName,
		company,
		email,
		phone,
		tagNames,
	};
}

/**
 * Resolve tag names to IDs
 */
export function resolveContactIds(parsed: ParsedContact, tags: Tag[]): ParsedContactWithIds {
	const tagIds: string[] = [];

	// Find tags by name (case-insensitive)
	for (const tagName of parsed.tagNames) {
		const tag = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
		if (tag) {
			tagIds.push(tag.id);
		}
	}

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

/**
 * Format parsed contact for preview display
 */
export function formatParsedContactPreview(parsed: ParsedContact): string {
	const parts: string[] = [];

	if (parsed.company) {
		parts.push(`🏢 ${parsed.company}`);
	}

	if (parsed.email) {
		parts.push(`📧 ${parsed.email}`);
	}

	if (parsed.phone) {
		parts.push(`📞 ${parsed.phone}`);
	}

	if (parsed.tagNames.length > 0) {
		parts.push(`🏷️ ${parsed.tagNames.join(', ')}`);
	}

	return parts.join(' · ');
}
