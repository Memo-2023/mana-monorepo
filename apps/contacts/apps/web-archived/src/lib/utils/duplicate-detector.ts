/**
 * Live Duplicate Detector for Contacts
 *
 * Checks typed name/email against existing contacts in IndexedDB.
 * Uses fuzzy name matching (Levenshtein) and exact email matching.
 * Runs fully offline — no server calls needed.
 */

export interface DuplicateMatch {
	id: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	company?: string;
	matchField: 'name' | 'email';
	displayName: string;
}

interface ContactRecord {
	id: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	company?: string;
}

/**
 * Levenshtein distance between two strings (case-insensitive).
 */
function levenshtein(a: string, b: string): number {
	const la = a.toLowerCase();
	const lb = b.toLowerCase();
	const m = la.length;
	const n = lb.length;

	if (m === 0) return n;
	if (n === 0) return m;

	const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

	for (let i = 0; i <= m; i++) dp[i][0] = i;
	for (let j = 0; j <= n; j++) dp[0][j] = j;

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			const cost = la[i - 1] === lb[j - 1] ? 0 : 1;
			dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
		}
	}

	return dp[m][n];
}

/**
 * Check if two names are similar (max 2 edits for names > 4 chars, 1 for shorter).
 */
function namesSimilar(a: string, b: string): boolean {
	if (!a || !b) return false;
	const al = a.toLowerCase().trim();
	const bl = b.toLowerCase().trim();
	if (al === bl) return true;
	// Starts-with match (for typing in progress)
	if (al.length >= 3 && (bl.startsWith(al) || al.startsWith(bl))) return true;
	const maxDist = Math.max(al.length, bl.length) > 4 ? 2 : 1;
	return levenshtein(al, bl) <= maxDist;
}

function buildDisplayName(contact: ContactRecord): string {
	const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
	if (name && contact.company) return `${name} (${contact.company})`;
	return name || contact.email || 'Unbekannt';
}

/**
 * Find potential duplicates for a contact being created/edited.
 *
 * @param input - The contact data being entered (partial)
 * @param existingContacts - All contacts in IndexedDB
 * @param excludeId - Exclude this contact (for edit mode)
 * @returns Array of matching contacts, sorted by relevance
 */
export function findDuplicates(
	input: { firstName?: string; lastName?: string; email?: string },
	existingContacts: ContactRecord[],
	excludeId?: string
): DuplicateMatch[] {
	const matches: DuplicateMatch[] = [];
	const seen = new Set<string>();

	for (const contact of existingContacts) {
		if (contact.id === excludeId) continue;

		// Exact email match (strongest signal)
		if (input.email && contact.email && input.email.toLowerCase() === contact.email.toLowerCase()) {
			if (!seen.has(contact.id)) {
				matches.push({
					...contact,
					matchField: 'email',
					displayName: buildDisplayName(contact),
				});
				seen.add(contact.id);
			}
			continue;
		}

		// Fuzzy name match (both first + last must match)
		const hasFirst = input.firstName && input.firstName.length >= 2;
		const hasLast = input.lastName && input.lastName.length >= 2;

		if (hasFirst && hasLast) {
			// Both names provided — both must be similar
			if (
				namesSimilar(input.firstName!, contact.firstName || '') &&
				namesSimilar(input.lastName!, contact.lastName || '')
			) {
				if (!seen.has(contact.id)) {
					matches.push({
						...contact,
						matchField: 'name',
						displayName: buildDisplayName(contact),
					});
					seen.add(contact.id);
				}
			}
		} else if (hasFirst && !hasLast) {
			// Only first name — exact match on first + any existing last name
			if (namesSimilar(input.firstName!, contact.firstName || '') && contact.lastName) {
				if (!seen.has(contact.id)) {
					matches.push({
						...contact,
						matchField: 'name',
						displayName: buildDisplayName(contact),
					});
					seen.add(contact.id);
				}
			}
		}
	}

	// Email matches first, then name matches
	return matches.sort((a, b) => {
		if (a.matchField === 'email' && b.matchField !== 'email') return -1;
		if (a.matchField !== 'email' && b.matchField === 'email') return 1;
		return 0;
	});
}
