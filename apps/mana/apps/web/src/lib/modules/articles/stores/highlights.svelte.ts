/**
 * Highlights store — mutation-only service for `articleHighlights`.
 *
 * Every write routes through encryptRecord so text + note + context
 * snippets ship encrypted. Structural fields (articleId, startOffset,
 * endOffset, color) stay plaintext for the reader's range-scan query.
 */

import { encryptRecord } from '$lib/data/crypto';
import { articleHighlightTable } from '../collections';
import { toHighlight } from '../queries';
import type { Highlight, HighlightColor, LocalHighlight } from '../types';

export interface AddHighlightInput {
	articleId: string;
	text: string;
	color?: HighlightColor;
	note?: string | null;
	startOffset: number;
	endOffset: number;
	contextBefore?: string | null;
	contextAfter?: string | null;
}

export const highlightsStore = {
	async addHighlight(input: AddHighlightInput): Promise<Highlight> {
		const newLocal: LocalHighlight = {
			id: crypto.randomUUID(),
			articleId: input.articleId,
			text: input.text,
			note: input.note ?? null,
			color: input.color ?? 'yellow',
			startOffset: input.startOffset,
			endOffset: input.endOffset,
			contextBefore: input.contextBefore ?? null,
			contextAfter: input.contextAfter ?? null,
		};
		const snapshot = toHighlight(newLocal);
		await encryptRecord('articleHighlights', newLocal);
		await articleHighlightTable.add(newLocal);
		return snapshot;
	},

	async setColor(id: string, color: HighlightColor): Promise<void> {
		await articleHighlightTable.update(id, {
			color,
			updatedAt: new Date().toISOString(),
		});
	},

	async setNote(id: string, note: string | null): Promise<void> {
		const diff: Partial<LocalHighlight> = {
			note,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('articleHighlights', diff as LocalHighlight);
		await articleHighlightTable.update(id, diff);
	},

	async deleteHighlight(id: string): Promise<void> {
		await articleHighlightTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},
};
