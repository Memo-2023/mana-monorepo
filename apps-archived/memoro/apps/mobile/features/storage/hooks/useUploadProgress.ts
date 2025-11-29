import { useUploadStatusStore } from '../store/uploadStatusStore';
import { UploadStatus } from '../uploadStatus.types';

interface UploadProgressState {
	status: UploadStatus;
	error?: string;
	attemptCount: number;
	memoId?: string;
	isUploading: boolean;
	isPending: boolean;
	isFailed: boolean;
	isSuccess: boolean;
}

/**
 * Hook to track upload status for a specific audio file using Zustand subscriptions.
 * No polling - updates automatically when upload status changes.
 * Safe from memory leaks as Zustand handles subscription cleanup.
 *
 * @param audioFileId - The ID of the audio file being uploaded
 * @returns Upload state with status, error, and boolean helpers
 */
export function useUploadProgress(audioFileId: string | undefined): UploadProgressState {
	// Subscribe directly to Zustand store - no manual cleanup needed
	const status = useUploadStatusStore((state) =>
		audioFileId ? state.getStatus(audioFileId) : UploadStatus.SUCCESS
	);

	const metadata = useUploadStatusStore((state) =>
		audioFileId ? state.getMetadata(audioFileId) : undefined
	);

	return {
		status,
		error: metadata?.lastError,
		attemptCount: metadata?.attemptCount || 0,
		memoId: metadata?.memoId,
		isUploading: status === UploadStatus.UPLOADING,
		isPending: status === UploadStatus.PENDING,
		isFailed: status === UploadStatus.FAILED,
		isSuccess: status === UploadStatus.SUCCESS,
	};
}
