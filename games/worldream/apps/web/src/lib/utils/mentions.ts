/**
 * Extracts @mentions from text
 * @param text - The text to search for mentions
 * @returns Array of slugs mentioned in the text
 */
export function extractMentions(text: string | undefined): string[] {
	if (!text) return [];

	const regex = /@([\w-]+)/g;
	const matches = [...text.matchAll(regex)];
	return [...new Set(matches.map((m) => m[1]))]; // Remove duplicates
}

/**
 * Parses text and converts @mentions to clickable links
 * @param text - The text containing @mentions
 * @param baseUrl - Base URL for links (default: '/')
 * @returns HTML string with clickable mentions
 */
export function parseReferences(text: string | undefined, baseUrl: string = '/'): string {
	if (!text) return '';

	return text.replace(
		/@([\w-]+)/g,
		`<a href="${baseUrl}$1" class="text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300">@$1</a>`
	);
}

/**
 * Checks if a text mentions a specific slug
 * @param text - The text to search in
 * @param slug - The slug to search for
 * @returns true if the slug is mentioned
 */
export function hasMention(text: string | undefined, slug: string): boolean {
	if (!text) return false;
	return extractMentions(text).includes(slug);
}
