/**
 * Hook to track the count of unuploaded audio files
 *
 * This hook subscribes to the upload status store and returns the count
 * of audio files that have NOT_UPLOADED or FAILED status.
 * These are recordings that need user attention to upload/retry.
 */

import { useEffect, useState } from 'react';
import { useUploadStatusStore } from '../store/uploadStatusStore';
import { UploadStatus } from '../uploadStatus.types';

export function useUnuploadedCount() {
	const [count, setCount] = useState(0);
	const statusMap = useUploadStatusStore((state) => state.statusMap);
	const isInitialized = useUploadStatusStore((state) => state.isInitialized);

	useEffect(() => {
		if (!isInitialized) {
			return;
		}

		// Count records with NOT_UPLOADED or FAILED status
		// Both represent recordings that need user action to upload
		const pendingCount = Array.from(statusMap.values()).filter(
			(record) =>
				record.status === UploadStatus.NOT_UPLOADED || record.status === UploadStatus.FAILED
		).length;

		console.debug(`[useUnuploadedCount] Pending uploads: ${pendingCount}`);
		setCount(pendingCount);
	}, [statusMap, isInitialized]);

	return count;
}
