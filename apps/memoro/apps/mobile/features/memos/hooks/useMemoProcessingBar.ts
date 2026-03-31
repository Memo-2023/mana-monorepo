import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMemoStore } from '../store/memoStore';
import { useAllMemoUpdates } from '../contexts/MemoRealtimeContext';
import { useRecordingStore } from '~/features/audioRecordingV2/store/recordingStore';
import { MemoProcessingStatus, DEFAULT_MEMO_TITLES } from './useMemoProcessing';
import { hasTranscript } from '../utils/transcriptUtils';

function computeStatus(memo: any): MemoProcessingStatus {
	if (!memo) return MemoProcessingStatus.UPLOADING;

	if (memo.isPlaceholder) return MemoProcessingStatus.UPLOADING;

	// No transcript
	if (
		memo.metadata?.processing?.transcription?.status === 'completed_no_transcript' ||
		memo.metadata?.processing?.headline_and_intro?.status === 'completed_no_transcript'
	) {
		return MemoProcessingStatus.NO_TRANSCRIPT;
	}

	// Error
	if (memo.metadata?.processing?.transcription?.status === 'error') {
		return MemoProcessingStatus.ERROR;
	}

	// Has real title → completed
	const hasRealTitle =
		memo.title &&
		memo.title !== DEFAULT_MEMO_TITLES.UNNAMED &&
		memo.title !== DEFAULT_MEMO_TITLES.NEW_RECORDING &&
		memo.title !== DEFAULT_MEMO_TITLES.MEMO &&
		memo.title !== 'Titel wird generiert...' &&
		memo.title.trim() !== '';

	if (hasRealTitle) return MemoProcessingStatus.COMPLETED;

	// Transcription states
	if (
		memo.metadata?.transcriptionStatus === 'processing' ||
		memo.metadata?.processing?.transcription?.status === 'processing' ||
		memo.metadata?.processing?.transcription?.status === 'pending'
	) {
		return MemoProcessingStatus.TRANSCRIBING;
	}

	// Headline generation states
	if (
		memo.metadata?.processing?.headline?.status === 'processing' ||
		memo.metadata?.processing?.headline_and_intro?.status === 'processing' ||
		memo.metadata?.processing?.headline_and_intro?.status === 'pending' ||
		memo.metadata?.processing?.headline_and_intro?.status === 'completed'
	) {
		return MemoProcessingStatus.GENERATING_HEADLINE;
	}

	// Transcription completed but no headline yet
	if (memo.metadata?.processing?.transcription?.status === 'completed') {
		return MemoProcessingStatus.GENERATING_HEADLINE;
	}

	// Has transcript but no title
	if (hasTranscript(memo)) {
		return MemoProcessingStatus.GENERATING_HEADLINE;
	}

	// Has audio but no transcript
	if (memo.source?.audio_path && !memo.source?.transcript) {
		return MemoProcessingStatus.TRANSCRIBING;
	}

	// Has audio path but no processing metadata
	if (memo.source?.audio_path && !memo.metadata?.processing) {
		return MemoProcessingStatus.UPLOADING;
	}

	return MemoProcessingStatus.UPLOADING;
}

export function useMemoProcessingBar() {
	const { t } = useTranslation();
	const isRecording = useRecordingStore((s) => s.isRecording);
	const latestMemo = useMemoStore((s) => s.latestMemo);

	const [isVisible, setIsVisible] = useState(false);
	const [processingStatus, setProcessingStatus] = useState<MemoProcessingStatus>(
		MemoProcessingStatus.UPLOADING
	);
	const [displayTitle, setDisplayTitle] = useState('');
	const [memoId, setMemoId] = useState<string | null>(null);

	const trackedMemoIdRef = useRef<string | null>(null);
	const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const statusTexts = useCallback(
		() => ({
			[MemoProcessingStatus.UPLOADING]: t('memo.status.memo_uploading'),
			[MemoProcessingStatus.TRANSCRIBING]: t('memo.status.memo_transcribing'),
			[MemoProcessingStatus.GENERATING_HEADLINE]: t('memo.status.headline_generating'),
			[MemoProcessingStatus.COMPLETED]: '',
			[MemoProcessingStatus.ERROR]: t('memo.status.error_processing_memo'),
			[MemoProcessingStatus.NO_TRANSCRIPT]: t('memo.status.no_transcript'),
		}),
		[t]
	);

	const updateState = useCallback(
		(memo: any) => {
			if (!memo) return;

			const status = computeStatus(memo);
			const texts = statusTexts();

			setProcessingStatus(status);
			setMemoId(memo.id);

			if (status === MemoProcessingStatus.COMPLETED) {
				setDisplayTitle(memo.title || texts[status]);
			} else {
				setDisplayTitle(texts[status]);
			}

			// Auto-dismiss after completion
			if (dismissTimerRef.current) {
				clearTimeout(dismissTimerRef.current);
				dismissTimerRef.current = null;
			}

			if (status === MemoProcessingStatus.COMPLETED) {
				dismissTimerRef.current = setTimeout(() => {
					setIsVisible(false);
					trackedMemoIdRef.current = null;
				}, 5000);
			}
		},
		[statusTexts]
	);

	// Track new latestMemo from store (placeholder created after recording stops)
	useEffect(() => {
		if (!latestMemo) return;

		// New memo to track (placeholder or a new memo ID)
		if (latestMemo.id !== trackedMemoIdRef.current && latestMemo.isPlaceholder) {
			trackedMemoIdRef.current = latestMemo.id;
			setIsVisible(true);
			updateState(latestMemo);
		} else if (latestMemo.id === trackedMemoIdRef.current) {
			// Same memo, update status from store changes
			updateState(latestMemo);
		}
	}, [latestMemo, updateState]);

	// Listen for realtime updates (INSERT replaces placeholder, UPDATE changes status)
	useAllMemoUpdates(
		useCallback(
			(payload: any) => {
				if (!trackedMemoIdRef.current) return;

				if (payload.event === 'INSERT' && payload.new) {
					// A new real memo was inserted — check if it replaces our placeholder
					// The MemoStoreUpdater already updates the store, so we just need to track the new ID
					// if the latestMemo in store gets updated to this new memo
					return;
				}

				if (payload.event === 'UPDATE' && payload.new) {
					const updatedId = payload.new.id;
					if (updatedId === trackedMemoIdRef.current) {
						updateState(payload.new);
					}
				}
			},
			[updateState]
		)
	);

	// Hide when recording starts
	useEffect(() => {
		if (isRecording) {
			setIsVisible(false);
			if (dismissTimerRef.current) {
				clearTimeout(dismissTimerRef.current);
				dismissTimerRef.current = null;
			}
		}
	}, [isRecording]);

	// Cleanup
	useEffect(() => {
		return () => {
			if (dismissTimerRef.current) {
				clearTimeout(dismissTimerRef.current);
			}
		};
	}, []);

	return {
		isVisible: isVisible && !isRecording,
		processingStatus,
		displayTitle,
		memoId,
	};
}
