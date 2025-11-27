import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { memoRealtimeService } from '../services/memoRealtimeService';
import { useRecordingStore } from '~/features/audioRecordingV2/store/recordingStore';
import { RecordingStatus } from '~/features/audioRecordingV2/types';

interface UseDirectMemoTitleOptions {
	memoId: string;
	initialTitle?: string;
	reactToGlobalRecordingStatus?: boolean;
	onTitleChange?: (title: string, isInitial?: boolean) => void;
}

interface UseDirectMemoTitleReturn {
	title: string;
	isLoading: boolean;
}

/**
 * Hook that replicates DirectMemoTitle functionality using the centralized MemoRealtimeService
 * This provides the same API and behavior as the original DirectMemoTitle component
 */
export function useDirectMemoTitle(options: UseDirectMemoTitleOptions): UseDirectMemoTitleReturn {
	const {
		memoId,
		initialTitle = 'New Recording',
		reactToGlobalRecordingStatus = false,
		onTitleChange,
	} = options;
	const { t } = useTranslation();

	// Local state for the title
	const [title, setTitle] = useState(initialTitle);
	const [isLoading, setIsLoading] = useState(true);
	const [hasFetchedFreshData, setHasFetchedFreshData] = useState(false);

	// Get recording status from the store only if we should react to it
	const recordingStatus = useRecordingStore((state) =>
		reactToGlobalRecordingStatus ? state.status : undefined
	);

	// Ref to track if component is mounted
	const isMountedRef = useRef(true);

	// Handle recording status changes (mimics DirectMemoTitle behavior)
	useEffect(() => {
		if (reactToGlobalRecordingStatus && recordingStatus !== undefined) {
			console.log(`useDirectMemoTitle ${memoId}: Handling recording status:`, recordingStatus);

			// Show recording/uploading status based on the global recording state
			if (
				recordingStatus === RecordingStatus.RECORDING ||
				recordingStatus === RecordingStatus.PAUSED
			) {
				const newTitle = t('memo.status.recording_in_progress');
				setTitle(newTitle);
				onTitleChange?.(newTitle, false);
			} else if (recordingStatus === RecordingStatus.UPLOADING) {
				const newTitle = t('memo.status.uploading_recording');
				setTitle(newTitle);
				onTitleChange?.(newTitle, false);
			}
		}
	}, [recordingStatus, reactToGlobalRecordingStatus, t, memoId, onTitleChange]);

	// Setup centralized subscription
	useEffect(() => {
		let unsubscribe: (() => void) | null = null;

		// Skip subscription for non-latest memos (mimics DirectMemoTitle behavior)
		if (!reactToGlobalRecordingStatus) {
			console.log(
				`useDirectMemoTitle ${memoId}: Skipping subscription (not latest memo), using initial title`
			);

			// For non-latest memos, just use the initialTitle
			if (initialTitle !== title && initialTitle !== 'Loading...') {
				setTitle(initialTitle);
				onTitleChange?.(initialTitle, true);
			}
			setIsLoading(false);
			return;
		}

		console.log(`useDirectMemoTitle ${memoId}: Setting up centralized subscription`);

		// Use the centralized service for memo title subscription
		unsubscribe = memoRealtimeService.subscribeToMemoTitle(memoId, {
			onTitleChange: (newTitle, isInitial) => {
				if (!isMountedRef.current) return;

				console.log(
					`useDirectMemoTitle ${memoId}: Title update - "${newTitle}" (initial: ${isInitial})`
				);

				setTitle(newTitle);
				onTitleChange?.(newTitle, isInitial);

				if (isInitial && !hasFetchedFreshData) {
					setHasFetchedFreshData(true);
					setIsLoading(false);
				} else if (!isInitial) {
					setIsLoading(false);
				}
			},
			initialTitle,
			reactToRecordingStatus: reactToGlobalRecordingStatus,
			translateFunction: t,
		});

		// Cleanup subscription on unmount
		return () => {
			if (unsubscribe) {
				console.log(`useDirectMemoTitle ${memoId}: Cleaning up subscription`);
				unsubscribe();
			}
		};
	}, [
		memoId,
		initialTitle,
		reactToGlobalRecordingStatus,
		t,
		onTitleChange,
		title,
		hasFetchedFreshData,
	]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	return {
		title,
		isLoading,
	};
}

export default useDirectMemoTitle;
