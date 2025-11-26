/**
 * Memo Service for memoro-web
 * Uses authenticated Supabase client pattern from memoro_app
 */

import { createAuthClient } from '$lib/supabaseClient';
import type { Memo } from '$lib/types/memo.types';
import { getCachedUrl, setCachedUrl, cleanupExpiredUrls } from '$lib/utils/indexedDBCache';

// In-memory cache for signed URLs (memoId -> { url, expires })
// LRU-style cache with max 50 entries - serves as fast first-level cache
const audioUrlCache = new Map<string, { url: string; expires: number }>();
const AUDIO_CACHE_MAX_SIZE = 50;
const CACHE_EXPIRY_MS = 50 * 60 * 1000; // 50 minutes (before 60 min signed URL expiry)

// Helper to clean up expired and excess cache entries
function cleanupAudioCache() {
	const now = Date.now();

	// Remove expired entries
	for (const [key, value] of audioUrlCache) {
		if (now >= value.expires) {
			audioUrlCache.delete(key);
		}
	}

	// If still over limit, remove oldest entries (LRU)
	while (audioUrlCache.size > AUDIO_CACHE_MAX_SIZE) {
		const firstKey = audioUrlCache.keys().next().value;
		if (firstKey) audioUrlCache.delete(firstKey);
	}

	// Also clean up IndexedDB (async, fire and forget)
	cleanupExpiredUrls().catch(() => {});
}

export class MemoService {
	/**
	 * Get memos for list view - optimized for performance
	 * Only fetches fields needed for the sidebar list, no memories
	 */
	async getMemosForList(userId: string, limit = 30, offset = 0): Promise<{ memos: Memo[]; hasMore: boolean }> {
		const supabase = await createAuthClient();

		// Fetch memos with count for pagination (use * to avoid field name issues)
		const { data, error, count } = await supabase
			.from('memos')
			.select('*', { count: 'exact' })
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) throw error;
		if (!data || data.length === 0) return { memos: [], hasMore: false };

		// Get all memo IDs for tag fetch
		const memoIds = data.map((memo: any) => memo.id);

		// Fetch tags for all memos in a single query (2 queries total, no memories)
		const { data: memoTagsData } = await supabase
			.from('memo_tags')
			.select('memo_id, tags(id, name, color)')
			.in('memo_id', memoIds);

		// Create a map of memo_id to tags
		const tagsMap = new Map<string, any[]>();
		memoTagsData?.forEach((mt: any) => {
			if (!tagsMap.has(mt.memo_id)) {
				tagsMap.set(mt.memo_id, []);
			}
			if (mt.tags) {
				tagsMap.get(mt.memo_id)!.push(mt.tags);
			}
		});

		// Transform the data to include tags (no memories for list)
		const memos = data.map((memo: any) => ({
			...memo,
			tags: tagsMap.get(memo.id) || [],
			memories: []
		}));

		const hasMore = count ? offset + limit < count : data.length === limit;

		return { memos: memos as Memo[], hasMore };
	}

	/**
	 * Get memos for a user with pagination (legacy - includes memories)
	 * Use getMemosForList for better performance in list views
	 */
	async getMemos(userId: string, limit = 50, offset = 0) {
		const supabase = await createAuthClient();

		// First, get the base memo data (like mobile app does)
		const { data, error } = await supabase
			.from('memos')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) throw error;
		if (!data || data.length === 0) return [];

		// Get all memo IDs
		const memoIds = data.map((memo: any) => memo.id);

		// Fetch tags for all memos in a single query
		const { data: memoTagsData, error: memoTagsError } = await supabase
			.from('memo_tags')
			.select('memo_id, tag_id, tags(*)')
			.in('memo_id', memoIds);

		if (memoTagsError) {
			console.error('Error fetching memo tags:', memoTagsError);
		}

		// Create a map of memo_id to tags
		const tagsMap = new Map<string, any[]>();
		memoTagsData?.forEach((mt: any) => {
			if (!tagsMap.has(mt.memo_id)) {
				tagsMap.set(mt.memo_id, []);
			}
			if (mt.tags) {
				tagsMap.get(mt.memo_id)!.push(mt.tags);
			}
		});

		// Transform the data to include tags (no memories for list)
		const memos = data.map((memo: any) => ({
			...memo,
			tags: tagsMap.get(memo.id) || [],
			memories: []
		}));

		return memos as Memo[];
	}

	/**
	 * Get cached audio URL or generate new one
	 * Uses two-level cache: Memory (fast) -> IndexedDB (persistent) -> API
	 */
	async getAudioUrl(memoId: string, audioPath: string): Promise<string | null> {
		// Clean up cache periodically
		cleanupAudioCache();

		// Level 1: Check memory cache first (fastest)
		const memoryCached = audioUrlCache.get(memoId);
		if (memoryCached && Date.now() < memoryCached.expires) {
			// Move to end for LRU behavior (delete and re-add)
			audioUrlCache.delete(memoId);
			audioUrlCache.set(memoId, memoryCached);
			return memoryCached.url;
		}

		// Level 2: Check IndexedDB cache (persistent across page reloads)
		const indexedDBCached = await getCachedUrl(memoId);
		if (indexedDBCached) {
			// Promote to memory cache for faster subsequent access
			audioUrlCache.set(memoId, {
				url: indexedDBCached,
				expires: Date.now() + CACHE_EXPIRY_MS
			});
			return indexedDBCached;
		}

		// Level 3: Generate new signed URL from API
		const authClient = await createAuthClient();
		const { data } = await authClient.storage
			.from('user-uploads')
			.createSignedUrl(audioPath, 3600); // 1 hour

		if (data?.signedUrl) {
			// Store in both caches
			const expires = Date.now() + CACHE_EXPIRY_MS;

			// Memory cache
			audioUrlCache.set(memoId, {
				url: data.signedUrl,
				expires
			});

			// IndexedDB cache (async, non-blocking)
			setCachedUrl(memoId, data.signedUrl, CACHE_EXPIRY_MS).catch(() => {});

			return data.signedUrl;
		}

		return null;
	}

	async getMemoById(memoId: string) {
		const supabase = await createAuthClient();

		// Fetch memo, tags, and memories in parallel (3 queries but concurrent)
		const [memoResult, tagsResult, memoriesResult] = await Promise.all([
			// Get memo data
			supabase
				.from('memos')
				.select('*')
				.eq('id', memoId)
				.single(),
			// Get tags
			supabase
				.from('memo_tags')
				.select('tags(id, name, color)')
				.eq('memo_id', memoId),
			// Get memories
			supabase
				.from('memories')
				.select('*')
				.eq('memo_id', memoId)
				.order('created_at', { ascending: false })
		]);

		if (memoResult.error) throw memoResult.error;

		// Transform the data
		const memo = {
			...memoResult.data,
			tags: tagsResult.data?.map((mt: any) => mt.tags).filter(Boolean) || [],
			memories: memoriesResult.data || []
		};

		return memo as Memo;
	}

	async searchMemos(userId: string, query: string) {
		const supabase = await createAuthClient();

		// First, get the base memo data
		const { data, error } = await supabase
			.from('memos')
			.select('*')
			.eq('user_id', userId)
			.or(`title.ilike.%${query}%,transcript.ilike.%${query}%`)
			.order('created_at', { ascending: false });

		if (error) throw error;
		if (!data || data.length === 0) return [];

		// Get all memo IDs
		const memoIds = data.map((memo: any) => memo.id);

		// Fetch tags for all memos in a single query
		const { data: memoTagsData, error: memoTagsError } = await supabase
			.from('memo_tags')
			.select('memo_id, tag_id, tags(*)')
			.in('memo_id', memoIds);

		if (memoTagsError) {
			console.error('Error fetching memo tags:', memoTagsError);
		}

		// Fetch memories for all memos in a single query
		const { data: memoriesData, error: memoriesError } = await supabase
			.from('memories')
			.select('*')
			.in('memo_id', memoIds)
			.order('created_at', { ascending: false });

		if (memoriesError) {
			console.error('Error fetching memories:', memoriesError);
		}

		// Create a map of memo_id to tags
		const tagsMap = new Map<string, any[]>();
		memoTagsData?.forEach((mt: any) => {
			if (!tagsMap.has(mt.memo_id)) {
				tagsMap.set(mt.memo_id, []);
			}
			if (mt.tags) {
				tagsMap.get(mt.memo_id)!.push(mt.tags);
			}
		});

		// Create a map of memo_id to memories
		const memoriesMap = new Map<string, any[]>();
		memoriesData?.forEach((memory: any) => {
			if (!memoriesMap.has(memory.memo_id)) {
				memoriesMap.set(memory.memo_id, []);
			}
			memoriesMap.get(memory.memo_id)!.push(memory);
		});

		// Transform the data to include tags and memories
		const memos = data.map((memo: any) => ({
			...memo,
			tags: tagsMap.get(memo.id) || [],
			memories: memoriesMap.get(memo.id) || []
		}));

		return memos as Memo[];
	}

	async updateMemoTitle(memoId: string, title: string) {
		const supabase = await createAuthClient();
		const { error } = await supabase.from('memos').update({ title }).eq('id', memoId);

		if (error) throw error;
	}

	/**
	 * Update memo with partial data
	 */
	async updateMemo(memoId: string, updates: Partial<Memo>) {
		const supabase = await createAuthClient();
		const { error } = await supabase.from('memos').update(updates).eq('id', memoId);

		if (error) throw error;
	}

	/**
	 * Toggle pin status
	 */
	async togglePin(memoId: string, isPinned: boolean) {
		const supabase = await createAuthClient();
		const { error } = await supabase
			.from('memos')
			.update({ is_pinned: !isPinned })
			.eq('id', memoId);

		if (error) throw error;
		return !isPinned;
	}

	/**
	 * Increment view count - optimized single query
	 * Uses PostgreSQL JSONB operations for atomic increment
	 */
	async incrementViewCount(memoId: string) {
		const supabase = await createAuthClient();

		// Use RPC to atomically increment the view count
		// This avoids race conditions and reduces to a single DB call
		const { error } = await supabase.rpc('increment_memo_view_count', {
			memo_id: memoId
		});

		// Fallback to read-then-write if RPC doesn't exist
		if (error && error.code === 'PGRST202') {
			// RPC not found, use fallback
			const { data: memo } = await supabase
				.from('memos')
				.select('metadata')
				.eq('id', memoId)
				.single();

			const currentMetadata = (memo?.metadata as Record<string, unknown>) || {};
			const currentStats = (currentMetadata.stats as Record<string, unknown>) || {};
			const newViewCount = ((currentStats.viewCount as number) || 0) + 1;

			const { error: updateError } = await supabase
				.from('memos')
				.update({
					metadata: {
						...currentMetadata,
						stats: {
							...currentStats,
							viewCount: newViewCount
						}
					}
				})
				.eq('id', memoId);

			if (updateError) throw updateError;
		} else if (error) {
			throw error;
		}
	}

	async deleteMemo(memoId: string) {
		const supabase = await createAuthClient();
		const { error } = await supabase.from('memos').delete().eq('id', memoId);

		if (error) throw error;
	}

	async addTagToMemo(memoId: string, tagId: string) {
		const supabase = await createAuthClient();
		const { error } = await supabase
			.from('memo_tags')
			.insert({ memo_id: memoId, tag_id: tagId });

		if (error) throw error;
	}

	async removeTagFromMemo(memoId: string, tagId: string) {
		const supabase = await createAuthClient();
		const { error } = await supabase
			.from('memo_tags')
			.delete()
			.eq('memo_id', memoId)
			.eq('tag_id', tagId);

		if (error) throw error;
	}
}

// Export a singleton instance
export const memoService = new MemoService();
