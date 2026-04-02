/**
 * Tag Service for memoro-web
 * Uses local-first data layer (tagCollection, memoTagCollection).
 */

import { tagCollection, memoTagCollection, type LocalTag } from '$lib/data/local-store';
import type { Tag } from '$lib/types/memo.types';

// ─── Type mappers ──────────────────────────────────────────────

function localTagToTag(local: LocalTag): Tag {
	return {
		id: local.id,
		name: local.name,
		color: local.color,
		style: local.color ? { color: local.color } : undefined,
		user_id: local.userId || '',
		created_at: local.createdAt!,
		is_pinned: local.isPinned,
		sort_order: local.sortOrder,
	};
}

// ─── Service ───────────────────────────────────────────────────

export class TagService {
	async getTags(_userId: string): Promise<Tag[]> {
		const all = await tagCollection.getAll(undefined, { sortBy: 'name', sortDirection: 'asc' });
		return all.map(localTagToTag);
	}

	async getTagById(tagId: string): Promise<Tag> {
		const local = await tagCollection.get(tagId);
		if (!local) throw new Error(`Tag ${tagId} not found`);
		return localTagToTag(local);
	}

	async createTag(userId: string, name: string, color?: string): Promise<Tag> {
		const tagColor = color || this.generateRandomColor();
		const local = await tagCollection.insert({
			id: crypto.randomUUID(),
			name: name.trim(),
			color: tagColor,
			userId,
		});
		return localTagToTag(local);
	}

	async updateTag(tagId: string, updates: { name?: string; color?: string }): Promise<Tag> {
		const localUpdates: Partial<LocalTag> = {};
		if (updates.name !== undefined) localUpdates.name = updates.name;
		if (updates.color !== undefined) localUpdates.color = updates.color;

		const updated = await tagCollection.update(tagId, localUpdates);
		if (!updated) throw new Error(`Tag ${tagId} not found`);
		return localTagToTag(updated);
	}

	/**
	 * Get tag color from either style.color (new format) or color (old format).
	 */
	getTagColor(tag: Tag): string {
		return tag.style?.color || tag.color || '#3b82f6';
	}

	async deleteTag(tagId: string): Promise<void> {
		// Remove all memo_tag associations first
		const memoTags = await memoTagCollection.getAll({ tagId });
		await Promise.all(memoTags.map((mt) => memoTagCollection.delete(mt.id)));
		await tagCollection.delete(tagId);
	}

	async getTagUsageCount(tagId: string): Promise<number> {
		return memoTagCollection.count({ tagId });
	}

	private generateRandomColor(): string {
		const colors = [
			'#3b82f6', // blue
			'#10b981', // green
			'#f59e0b', // amber
			'#ef4444', // red
			'#8b5cf6', // violet
			'#ec4899', // pink
			'#06b6d4', // cyan
			'#84cc16', // lime
			'#f97316', // orange
			'#6366f1', // indigo
		];
		return colors[Math.floor(Math.random() * colors.length)];
	}
}

export const tagService = new TagService();
