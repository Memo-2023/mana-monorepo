import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';

class PhotoStorageOptimizedService {
	private photoStatusCache = new Map<string, { hasPhotos: boolean; timestamp: number }>();
	private CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

	/**
	 * Batch check if multiple memos have photos - ONE database call instead of N
	 */
	async batchCheckPhotosForMemos(memoIds: string[]): Promise<Map<string, boolean>> {
		const results = new Map<string, boolean>();
		const uncachedIds: string[] = [];
		const now = Date.now();

		// Check cache first
		for (const memoId of memoIds) {
			const cached = this.photoStatusCache.get(memoId);
			if (cached && now - cached.timestamp < this.CACHE_TTL) {
				results.set(memoId, cached.hasPhotos);
			} else {
				uncachedIds.push(memoId);
			}
		}

		// If all are cached, return immediately
		if (uncachedIds.length === 0) {
			return results;
		}

		try {
			const supabase = await getAuthenticatedClient();

			// Fetch ALL memos in ONE query
			const { data: memos, error } = await supabase
				.from('memos')
				.select('id, source')
				.in('id', uncachedIds);

			if (error) {
				console.debug('Error loading memos for photo check:', error);
				// Return false for all uncached
				uncachedIds.forEach((id) => results.set(id, false));
				return results;
			}

			// Process results
			for (const memo of memos || []) {
				const photos = memo.source?.photos || [];
				const hasPhotos = Array.isArray(photos) && photos.length > 0;

				// Update cache
				this.photoStatusCache.set(memo.id, { hasPhotos, timestamp: now });
				results.set(memo.id, hasPhotos);
			}

			// Set false for any memos not returned (doesn't exist)
			uncachedIds.forEach((id) => {
				if (!results.has(id)) {
					this.photoStatusCache.set(id, { hasPhotos: false, timestamp: now });
					results.set(id, false);
				}
			});

			return results;
		} catch (error) {
			console.debug('Error in batchCheckPhotosForMemos:', error);
			// Return false for all on error
			uncachedIds.forEach((id) => results.set(id, false));
			return results;
		}
	}

	/**
	 * Clear cache for a specific memo (e.g., after adding/removing photos)
	 */
	clearCacheForMemo(memoId: string) {
		this.photoStatusCache.delete(memoId);
	}

	/**
	 * Clear entire cache
	 */
	clearCache() {
		this.photoStatusCache.clear();
	}
}

export const photoStorageOptimizedService = new PhotoStorageOptimizedService();
