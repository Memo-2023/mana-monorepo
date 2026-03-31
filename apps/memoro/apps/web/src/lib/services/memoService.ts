/**
 * Memo Service for memoro-web
 * Uses local-first data layer (memoCollection, memoTagCollection, memoryCollection).
 * Audio URL signing still calls Supabase Storage (audio files are not stored locally).
 */

import { createAuthClient } from '$lib/supabaseClient';
import {
	memoCollection,
	memoTagCollection,
	tagCollection,
	memoryCollection,
	type LocalMemo,
	type LocalTag,
	type LocalMemory,
} from '$lib/data/local-store';
import type { Memo, Tag, Memory } from '$lib/types/memo.types';
import { getCachedUrl, setCachedUrl, cleanupExpiredUrls } from '$lib/utils/indexedDBCache';

// ─── Type mappers ──────────────────────────────────────────────

function localMemoToMemo(local: LocalMemo, tags: Tag[] = [], memories: Memory[] = []): Memo {
	return {
		id: local.id,
		user_id: local.userId || '',
		title: local.title,
		intro: local.intro,
		transcript: local.transcript,
		audio_url: null,
		duration_millis: local.audioDurationMs,
		created_at: local.createdAt!,
		updated_at: local.updatedAt!,
		space_id: null,
		blueprint_id: local.blueprintId,
		language: local.language,
		processing_status: local.processingStatus,
		is_archived: local.isArchived,
		is_pinned: local.isPinned,
		is_public: local.isPublic,
		location: local.location,
		metadata: local.metadata,
		source: local.source
			? {
					audio_path: local.source.audioPath,
					duration: local.source.audioDuration,
					transcript: local.source.transcript,
					utterances: local.source.utterances,
					speakers: local.source.speakers,
				}
			: undefined,
		tags,
		memories,
	};
}

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

function localMemoryToMemory(local: LocalMemory): Memory {
	return {
		id: local.id,
		memo_id: local.memoId,
		title: local.title,
		content: local.content,
		metadata: local.metadata,
		created_at: local.createdAt!,
		updated_at: local.updatedAt!,
	};
}

// ─── Audio URL cache ────────────────────────────────────────────

const audioUrlCache = new Map<string, { url: string; expires: number }>();
const AUDIO_CACHE_MAX_SIZE = 50;
const CACHE_EXPIRY_MS = 50 * 60 * 1000; // 50 minutes (before 60 min signed URL expiry)

function cleanupAudioCache() {
	const now = Date.now();
	for (const [key, value] of audioUrlCache) {
		if (now >= value.expires) audioUrlCache.delete(key);
	}
	while (audioUrlCache.size > AUDIO_CACHE_MAX_SIZE) {
		const firstKey = audioUrlCache.keys().next().value;
		if (firstKey) audioUrlCache.delete(firstKey);
	}
	cleanupExpiredUrls().catch(() => {});
}

// ─── Helper: resolve tags for a set of memo IDs ─────────────────

async function resolveTagsForMemos(memoIds: string[]): Promise<Map<string, Tag[]>> {
	const tagsMap = new Map<string, Tag[]>();
	if (memoIds.length === 0) return tagsMap;

	const allMemoTags = await memoTagCollection.getAll();
	const relevant = allMemoTags.filter((mt) => memoIds.includes(mt.memoId));
	const tagIds = [...new Set(relevant.map((mt) => mt.tagId))];

	const localTags = await Promise.all(tagIds.map((id) => tagCollection.get(id)));
	const tagById = new Map<string, Tag>();
	for (const lt of localTags) {
		if (lt) tagById.set(lt.id, localTagToTag(lt));
	}

	for (const mt of relevant) {
		if (!tagsMap.has(mt.memoId)) tagsMap.set(mt.memoId, []);
		const tag = tagById.get(mt.tagId);
		if (tag) tagsMap.get(mt.memoId)!.push(tag);
	}

	return tagsMap;
}

// ─── Service ───────────────────────────────────────────────────

export class MemoService {
	/**
	 * Get memos for list view — optimized for performance.
	 * Only fetches fields needed for the sidebar list, no memories.
	 */
	async getMemosForList(
		_userId: string,
		limit = 30,
		offset = 0
	): Promise<{ memos: Memo[]; hasMore: boolean }> {
		const all = await memoCollection.getAll(
			{ isArchived: false },
			{ sortBy: 'createdAt', sortDirection: 'desc' }
		);
		const page = all.slice(offset, offset + limit);
		const tagsMap = await resolveTagsForMemos(page.map((m) => m.id));
		const memos = page.map((local) => localMemoToMemo(local, tagsMap.get(local.id)));
		return { memos, hasMore: offset + limit < all.length };
	}

	/**
	 * Get memos for a user with pagination (includes memories).
	 */
	async getMemos(_userId: string, limit = 50, offset = 0): Promise<Memo[]> {
		const all = await memoCollection.getAll(undefined, {
			sortBy: 'createdAt',
			sortDirection: 'desc',
		});
		const page = all.slice(offset, offset + limit);
		const tagsMap = await resolveTagsForMemos(page.map((m) => m.id));
		return page.map((local) => localMemoToMemo(local, tagsMap.get(local.id)));
	}

	/**
	 * Get cached audio URL or generate new one.
	 * Uses two-level cache: Memory (fast) → IndexedDB (persistent) → Supabase Storage.
	 */
	async getAudioUrl(memoId: string, audioPath: string): Promise<string | null> {
		cleanupAudioCache();

		const memoryCached = audioUrlCache.get(memoId);
		if (memoryCached && Date.now() < memoryCached.expires) {
			audioUrlCache.delete(memoId);
			audioUrlCache.set(memoId, memoryCached);
			return memoryCached.url;
		}

		const indexedDBCached = await getCachedUrl(memoId);
		if (indexedDBCached) {
			audioUrlCache.set(memoId, { url: indexedDBCached, expires: Date.now() + CACHE_EXPIRY_MS });
			return indexedDBCached;
		}

		const authClient = await createAuthClient();
		const { data } = await authClient.storage.from('user-uploads').createSignedUrl(audioPath, 3600);

		if (data?.signedUrl) {
			const expires = Date.now() + CACHE_EXPIRY_MS;
			audioUrlCache.set(memoId, { url: data.signedUrl, expires });
			setCachedUrl(memoId, data.signedUrl, CACHE_EXPIRY_MS).catch(() => {});
			return data.signedUrl;
		}

		return null;
	}

	async getMemoById(memoId: string): Promise<Memo> {
		const [local, memoTags, localMemories] = await Promise.all([
			memoCollection.get(memoId),
			memoTagCollection.getAll({ memoId }),
			memoryCollection.getAll({ memoId }, { sortBy: 'createdAt', sortDirection: 'desc' }),
		]);

		if (!local) throw new Error(`Memo ${memoId} not found`);

		const localTags = await Promise.all(memoTags.map((mt) => tagCollection.get(mt.tagId)));
		const tags = localTags.filter(Boolean).map((t) => localTagToTag(t!));

		return localMemoToMemo(local, tags, localMemories.map(localMemoryToMemory));
	}

	async searchMemos(_userId: string, query: string): Promise<Memo[]> {
		const all = await memoCollection.getAll(undefined, {
			sortBy: 'createdAt',
			sortDirection: 'desc',
		});
		const q = query.toLowerCase();
		const filtered = all.filter(
			(m) =>
				(m.title || '').toLowerCase().includes(q) || (m.transcript || '').toLowerCase().includes(q)
		);

		const memoIds = filtered.map((m) => m.id);
		const tagsMap = await resolveTagsForMemos(memoIds);

		const memoriesByMemo = new Map<string, Memory[]>();
		await Promise.all(
			memoIds.map(async (id) => {
				const mems = await memoryCollection.getAll({ memoId: id });
				memoriesByMemo.set(id, mems.map(localMemoryToMemory));
			})
		);

		return filtered.map((local) =>
			localMemoToMemo(local, tagsMap.get(local.id), memoriesByMemo.get(local.id))
		);
	}

	async updateMemoTitle(memoId: string, title: string): Promise<void> {
		await memoCollection.update(memoId, { title });
	}

	async updateMemo(memoId: string, updates: Partial<Memo>): Promise<void> {
		const localUpdates: Partial<LocalMemo> = {};
		if (updates.title !== undefined) localUpdates.title = updates.title;
		if (updates.intro !== undefined) localUpdates.intro = updates.intro;
		if (updates.transcript !== undefined) localUpdates.transcript = updates.transcript;
		if (updates.is_pinned !== undefined) localUpdates.isPinned = updates.is_pinned;
		if (updates.is_archived !== undefined) localUpdates.isArchived = updates.is_archived;
		if (updates.is_public !== undefined) localUpdates.isPublic = updates.is_public;
		if (updates.language !== undefined) localUpdates.language = updates.language;
		if (updates.blueprint_id !== undefined) localUpdates.blueprintId = updates.blueprint_id;
		if (updates.metadata !== undefined) localUpdates.metadata = updates.metadata ?? undefined;
		await memoCollection.update(memoId, localUpdates);
	}

	async togglePin(memoId: string, isPinned: boolean): Promise<boolean> {
		await memoCollection.update(memoId, { isPinned: !isPinned });
		return !isPinned;
	}

	async incrementViewCount(memoId: string): Promise<void> {
		const memo = await memoCollection.get(memoId);
		if (!memo) return;

		const currentStats = (memo.metadata?.stats as Record<string, number>) || {};
		await memoCollection.update(memoId, {
			metadata: {
				...memo.metadata,
				stats: { ...currentStats, viewCount: (currentStats.viewCount || 0) + 1 },
			},
		});
	}

	async deleteMemo(memoId: string): Promise<void> {
		await memoCollection.delete(memoId);
	}

	async addTagToMemo(memoId: string, tagId: string): Promise<void> {
		const existing = await memoTagCollection.getAll({ memoId, tagId });
		if (existing.length > 0) return;

		await memoTagCollection.insert({
			id: crypto.randomUUID(),
			memoId,
			tagId,
		});
	}

	async removeTagFromMemo(memoId: string, tagId: string): Promise<void> {
		const existing = await memoTagCollection.getAll({ memoId, tagId });
		await Promise.all(existing.map((mt) => memoTagCollection.delete(mt.id)));
	}
}

export const memoService = new MemoService();
