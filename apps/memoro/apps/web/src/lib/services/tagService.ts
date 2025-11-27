/**
 * Tag Service for memoro-web
 * Uses authenticated Supabase client pattern from memoro_app
 */

import { createAuthClient } from '$lib/supabaseClient';
import type { Tag } from '$lib/types/memo.types';

export class TagService {
	async getTags(userId: string) {
		const supabase = await createAuthClient();
		const { data, error } = await supabase
			.from('tags')
			.select('*')
			.eq('user_id', userId)
			.order('name', { ascending: true });

		if (error) throw error;
		return data as Tag[];
	}

	async getTagById(tagId: string) {
		const supabase = await createAuthClient();
		const { data, error } = await supabase.from('tags').select('*').eq('id', tagId).single();

		if (error) throw error;
		return data as Tag;
	}

	async createTag(userId: string, name: string, color?: string) {
		const supabase = await createAuthClient();
		const tagColor = color || this.generateRandomColor();
		const { data, error } = await supabase
			.from('tags')
			.insert({
				user_id: userId,
				name: name.trim(),
				style: { color: tagColor },
			})
			.select()
			.single();

		if (error) throw error;
		return data as Tag;
	}

	async updateTag(tagId: string, updates: { name?: string; color?: string }) {
		const supabase = await createAuthClient();

		// Get existing tag to preserve other style properties
		const existingTag = await this.getTagById(tagId);

		const updateData: any = {};
		if (updates.name !== undefined) {
			updateData.name = updates.name;
		}
		if (updates.color !== undefined) {
			updateData.style = { ...existingTag.style, color: updates.color };
		}

		const { data, error } = await supabase
			.from('tags')
			.update(updateData)
			.eq('id', tagId)
			.select()
			.single();

		if (error) throw error;
		return data as Tag;
	}

	/**
	 * Get tag color from either style.color (new format) or color (old format)
	 */
	getTagColor(tag: Tag): string {
		return tag.style?.color || tag.color || '#3b82f6';
	}

	async deleteTag(tagId: string) {
		const supabase = await createAuthClient();

		// First, remove all memo_tags associations
		await supabase.from('memo_tags').delete().eq('tag_id', tagId);

		// Then delete the tag
		const { error } = await supabase.from('tags').delete().eq('id', tagId);

		if (error) throw error;
	}

	async getTagUsageCount(tagId: string): Promise<number> {
		const supabase = await createAuthClient();
		const { count, error } = await supabase
			.from('memo_tags')
			.select('*', { count: 'exact', head: true })
			.eq('tag_id', tagId);

		if (error) throw error;
		return count || 0;
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

// Export a singleton instance
export const tagService = new TagService();
