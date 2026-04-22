/**
 * Markdown export for the highlights collection view.
 *
 * Groups highlights by article, dumps them in the order
 * `useAllHighlights` returned them (chronological), and wraps the whole
 * thing in a small header with the export date so the user can paste
 * the result into Obsidian, Notion, a Markdown note — whatever.
 *
 * Kept in a standalone file so the export logic can be unit-tested
 * without needing the Svelte render tree.
 */

import type { HighlightWithArticle } from '../queries';

/** Escape the minimum set of Markdown specials that show up in article
 *  titles and highlight text so pasted output doesn't accidentally
 *  format parts of the quote. We don't escape inside the quoted block
 *  itself — the reader's expectation is "see what I highlighted". */
function escapeTitle(text: string): string {
	return text.replace(/([\\*_`[\]<>])/g, '\\$1');
}

function formatDate(iso: string): string {
	try {
		return new Date(iso).toISOString().slice(0, 10);
	} catch {
		return iso.slice(0, 10);
	}
}

export function renderHighlightsMarkdown(
	rows: HighlightWithArticle[],
	now: Date = new Date()
): string {
	const header = `# Mana Highlights — ${now.toISOString().slice(0, 10)}\n`;
	if (rows.length === 0) {
		return `${header}\n_Keine Highlights._\n`;
	}

	// Preserve the incoming chronological order but group consecutive
	// rows for the same article together. Using a manual walk instead of
	// Map-groupBy keeps the per-section header below the most-recent row
	// for that article, matching what the UI shows.
	const blocks: string[] = [header];
	let currentArticleId: string | null = null;

	for (const row of rows) {
		if (row.article.id !== currentArticleId) {
			currentArticleId = row.article.id;
			blocks.push('');
			blocks.push(`## ${escapeTitle(row.article.title)}`);
			const subtitle = [row.article.siteName, row.article.originalUrl]
				.filter((s): s is string => !!s)
				.join(' · ');
			if (subtitle) blocks.push(`_${subtitle}_`);
			blocks.push('');
		}

		const savedAt = row.highlight.createdAt ? ` _(${formatDate(row.highlight.createdAt)})_` : '';
		blocks.push(`- > ${row.highlight.text.replace(/\n+/g, ' ')}${savedAt}`);
		if (row.highlight.note) {
			blocks.push(`  — ${row.highlight.note.replace(/\n+/g, ' ')}`);
		}
	}

	blocks.push('');
	return blocks.join('\n');
}
