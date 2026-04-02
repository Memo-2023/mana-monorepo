/**
 * Counts words in a text string
 */
export function countWords(text: string): number {
	if (!text) return 0;
	return text
		.trim()
		.split(/\s+/)
		.filter((w) => w.length > 0).length;
}

/**
 * Estimates token count (1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
	if (!text) return 0;
	return Math.ceil(text.length / 4);
}

/**
 * Formats a date string for display
 */
export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMin = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMs / 3600000);
	const diffDays = Math.floor(diffMs / 86400000);

	if (diffMin < 1) return 'Gerade eben';
	if (diffMin < 60) return `vor ${diffMin} Min.`;
	if (diffHours < 24) return `vor ${diffHours} Std.`;
	if (diffDays < 7) return `vor ${diffDays} Tagen`;

	return date.toLocaleDateString('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

/**
 * Truncates text to a given length
 */
export function truncateText(text: string, maxLength: number): string {
	if (!text || text.length <= maxLength) return text || '';
	return text.substring(0, maxLength - 3) + '...';
}
