/**
 * Utility functions for working with markdown content
 */

/**
 * Extracts a title from markdown content
 * First tries to find an H1 heading, then falls back to the first line
 * Trims the content to a reasonable length for display
 *
 * @param content The markdown content
 * @param maxLength Maximum length for the extracted title
 * @returns The extracted title or a default title if none found
 */
export const extractTitleFromMarkdown = (
	content: string | null | undefined,
	maxLength: number = 50
): string => {
	if (!content) return 'Unbenanntes Dokument';

	// Try to find an H1 heading (# Title)
	const h1Match = content.match(/^#\s+(.+)$/m);
	if (h1Match && h1Match[1]) {
		return truncateTitle(h1Match[1], maxLength);
	}

	// Fall back to first line
	const firstLine = content.split('\n')[0].trim();
	if (firstLine) {
		// Remove markdown formatting from the first line
		const cleanLine = firstLine
			.replace(/^[#*_~`>]+\s*/, '') // Remove heading markers, list markers, etc.
			.replace(/[*_~`]+/g, ''); // Remove bold, italic, etc.

		return truncateTitle(cleanLine, maxLength);
	}

	return 'Unbenanntes Dokument';
};

/**
 * Truncates a title to a specified maximum length
 *
 * @param title The title to truncate
 * @param maxLength Maximum length for the title
 * @returns The truncated title
 */
const truncateTitle = (title: string, maxLength: number): string => {
	if (title.length <= maxLength) return title;
	return title.substring(0, maxLength - 3) + '...';
};
