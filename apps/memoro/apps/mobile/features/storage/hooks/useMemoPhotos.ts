import { useState, useCallback } from 'react';
import { photoStorageOptimizedService } from '../photoStorageOptimized.service';

interface UseMemoPhotosReturn {
	hasPhotos: (memoId: string) => boolean;
	loading: boolean;
	checkPhotoStatus: (memoIds: string[]) => Promise<void>;
}

/**
 * Hook to efficiently check photo status for multiple memos
 */
export function useMemoPhotos(): UseMemoPhotosReturn {
	const [photoStatus, setPhotoStatus] = useState<{ [memoId: string]: boolean }>({});
	const [loading, setLoading] = useState(false);

	/**
	 * Check if a memo has photos
	 */
	const hasPhotos = useCallback(
		(memoId: string): boolean => {
			const result = photoStatus[memoId] || false;
			return result;
		},
		[photoStatus]
	);

	/**
	 * Check photo status for multiple memos using optimized batch query
	 */
	const checkPhotoStatus = useCallback(async (memoIds: string[]) => {
		if (memoIds.length === 0) return;

		try {
			setLoading(true);

			console.debug(`checkPhotoStatus: Batch checking ${memoIds.length} memos`);

			// Use optimized batch check - ONE database call instead of N
			const photoStatusMap = await photoStorageOptimizedService.batchCheckPhotosForMemos(memoIds);

			// Update state with batch results
			setPhotoStatus((prevStatus) => {
				const newStatus = { ...prevStatus };
				photoStatusMap.forEach((hasPhotos, memoId) => {
					newStatus[memoId] = hasPhotos;
				});
				return newStatus;
			});
		} catch (error) {
			console.debug('Error checking photo status:', error);
		} finally {
			setLoading(false);
		}
	}, []);

	return {
		hasPhotos,
		loading,
		checkPhotoStatus,
	};
}
