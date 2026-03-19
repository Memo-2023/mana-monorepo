/**
 * Extracts a title from markdown content (first H1 heading)
 */
export function extractTitleFromMarkdown(content: string): string {
	if (!content) return 'Neues Dokument';

	const lines = content.split('\n');
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.startsWith('# ')) {
			return trimmed.substring(2).trim();
		}
	}

	// Fallback: use first non-empty line truncated
	const firstLine = lines.find((l) => l.trim().length > 0);
	if (firstLine) {
		const clean = firstLine.replace(/^#+\s*/, '').trim();
		return clean.length > 60 ? clean.substring(0, 57) + '...' : clean;
	}

	return 'Neues Dokument';
}

/**
 * Simple markdown to HTML converter for preview
 */
export function markdownToHtml(content: string): string {
	if (!content) return '';

	let html = content
		// Code blocks
		.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
		// Inline code
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		// Headers
		.replace(/^### (.+)$/gm, '<h3>$1</h3>')
		.replace(/^## (.+)$/gm, '<h2>$1</h2>')
		.replace(/^# (.+)$/gm, '<h1>$1</h1>')
		// Bold & italic
		.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
		.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.+?)\*/g, '<em>$1</em>')
		// Blockquotes
		.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
		// Unordered lists
		.replace(/^[-*] (.+)$/gm, '<li>$1</li>')
		// Links
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
		// Horizontal rules
		.replace(/^---$/gm, '<hr>')
		// Line breaks
		.replace(/\n\n/g, '</p><p>')
		.replace(/\n/g, '<br>');

	// Wrap in paragraph if not already wrapped
	if (!html.startsWith('<')) {
		html = '<p>' + html + '</p>';
	}

	return html;
}
