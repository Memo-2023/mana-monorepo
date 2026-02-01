/**
 * Convert Markdown text to HTML for Matrix messages
 *
 * Supports:
 * - **bold** -> <strong>bold</strong>
 * - *italic* -> <em>italic</em>
 * - ~~strikethrough~~ -> <del>strikethrough</del>
 * - `code` -> <code>code</code>
 * - Newlines -> <br>
 *
 * @example
 * ```typescript
 * const html = markdownToHtml('**Hello** *world*');
 * // Returns: '<strong>Hello</strong> <em>world</em>'
 * ```
 */
export function markdownToHtml(text: string): string {
	return text
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.+?)\*/g, '<em>$1</em>')
		.replace(/~~(.+?)~~/g, '<del>$1</del>')
		.replace(/`(.+?)`/g, '<code>$1</code>')
		.replace(/\n/g, '<br>');
}

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

/**
 * Format a list of items as numbered markdown list
 */
export function formatNumberedList<T>(
	items: T[],
	formatter: (item: T, index: number) => string
): string {
	return items.map((item, i) => `${i + 1}. ${formatter(item, i)}`).join('\n');
}

/**
 * Format a list of items as bullet markdown list
 */
export function formatBulletList<T>(items: T[], formatter: (item: T) => string): string {
	return items.map((item) => `• ${formatter(item)}`).join('\n');
}
