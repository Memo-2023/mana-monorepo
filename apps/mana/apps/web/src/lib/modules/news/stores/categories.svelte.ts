/**
 * Categories store — user-defined folders for the saved reading list.
 *
 * Categories live in `newsCategories`. The link from an article to its
 * category is `LocalArticle.categoryId` (a plaintext FK index), set
 * via `articlesStore.setCategory`.
 *
 * Default seeds (Lese später / Recherche) are NOT created here — the
 * user starts with zero categories and adds them on demand. Empty is
 * a valid state and the saved-list view falls back to "Alle Artikel"
 * when no category is selected.
 */

import { encryptRecord } from '$lib/data/crypto';
import { categoryTable } from '../collections';
import type { LocalCategory } from '../types';

const DEFAULT_COLORS = [
	'#3b82f6',
	'#22c55e',
	'#f59e0b',
	'#ec4899',
	'#8b5cf6',
	'#06b6d4',
	'#f43f5e',
	'#84cc16',
];

function pickColor(existingCount: number): string {
	return DEFAULT_COLORS[existingCount % DEFAULT_COLORS.length];
}

export const categoriesStore = {
	async create(input: { name: string; color?: string; icon?: string }): Promise<LocalCategory> {
		const count = await categoryTable.count();
		const newLocal: LocalCategory = {
			id: crypto.randomUUID(),
			name: input.name.trim() || 'Ohne Namen',
			color: input.color ?? pickColor(count),
			icon: input.icon ?? '📁',
			sortOrder: count,
		};
		await encryptRecord('newsCategories', newLocal);
		await categoryTable.add(newLocal);
		return newLocal;
	},

	async rename(id: string, name: string): Promise<void> {
		const trimmed = name.trim();
		if (!trimmed) return;
		const diff: Partial<LocalCategory> = {
			name: trimmed,
		};
		await encryptRecord('newsCategories', diff);
		await categoryTable.update(id, diff);
	},

	async setColor(id: string, color: string): Promise<void> {
		await categoryTable.update(id, {
			color,
		});
	},

	async setIcon(id: string, icon: string): Promise<void> {
		await categoryTable.update(id, {
			icon,
		});
	},

	async reorder(ids: string[]): Promise<void> {
		// Bulk update via individual writes — Dexie has no native bulkUpdate
		// for partial diffs and the per-call cost is negligible at folder
		// counts (typically <20).
		const now = new Date().toISOString();
		for (let i = 0; i < ids.length; i++) {
			await categoryTable.update(ids[i], { sortOrder: i });
		}
	},

	async delete(id: string): Promise<void> {
		// Soft-delete the category itself. Articles that referenced it
		// keep `categoryId` pointing at the tombstoned row — the saved
		// view treats unknown categoryIds as "uncategorized" so they
		// don't disappear. A subsequent re-categorize cleans them up.
		await categoryTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
	},
};
