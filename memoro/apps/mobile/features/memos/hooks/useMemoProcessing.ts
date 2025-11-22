import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RecordingStatus } from '~/features/audioRecordingV2';
import { useMemoStore } from '../store/memoStore';
import { hasTranscript } from '../utils/transcriptUtils';

// Constants for default memo titles
export const DEFAULT_MEMO_TITLES = {
  UNNAMED: 'Unbenanntes Memo',
  NEW_RECORDING: 'Neue Aufnahme',
  MEMO: 'Memo',
};

// Processing status enum
export enum MemoProcessingStatus {
  UPLOADING = 'uploading',
  TRANSCRIBING = 'transcribing',
  GENERATING_HEADLINE = 'generating_headline',
  COMPLETED = 'completed',
  ERROR = 'error',
  NO_TRANSCRIPT = 'no_transcript',
}

// Status display text mapping - now using translations
const getProcessingStatusText = (t: any) => ({
  [MemoProcessingStatus.UPLOADING]: t('memo.status.memo_uploading'),
  [MemoProcessingStatus.TRANSCRIBING]: t('memo.status.memo_transcribing'),
  [MemoProcessingStatus.GENERATING_HEADLINE]: t('memo.status.headline_generating'),
  [MemoProcessingStatus.COMPLETED]: '', // Empty string - we'll use the actual title for completed memos
  [MemoProcessingStatus.ERROR]: t('memo.status.error_processing_memo'),
  [MemoProcessingStatus.NO_TRANSCRIPT]: t('memo.status.no_transcript'),
});

interface MemoProcessingProps {
  memo: {
    id: string;
    title?: string;
    source?: {
      audio_path?: string;
      transcript?: string;
    };
    metadata?: {
      processing?: {
        transcription?: {
          status?: string;
          timestamp?: string;
        };
        headline?: {
          status?: string;
          timestamp?: string;
        };
        headline_and_intro?: {
          status?: string;
          updated_at?: string;
        };
      };
      transcriptionStatus?: string;
      recordingStatus?: string; // Added to track recording status
    };
  };
  recordingStatus?: RecordingStatus; // Optional recording status from recording store
}

/**
 * Custom hook to handle memo processing status and display title
 */
export function useMemoProcessing({ memo, recordingStatus }: MemoProcessingProps) {
  const { t } = useTranslation();
  // Get the latest memo ID reactively from the store
  const latestMemoId = useMemoStore((state) => state.latestMemo?.id);

  // Only apply recording status to the latest memo (the one being recorded)
  // This prevents all memos from showing "Recording in progress..."
  const isLatestMemo = useMemo(() => {
    // Check if this is the latest memo by comparing IDs
    return latestMemoId === memo.id;
  }, [memo.id, latestMemoId]);

  // Only use recording status for the latest memo AND when recordingStatus is provided
  const effectiveRecordingStatus = isLatestMemo && recordingStatus ? recordingStatus : undefined;
  // Determine the processing status of the memo
  const processingStatus = useMemo((): MemoProcessingStatus => {
    // Priority 1: Active recording status (only for latest memo)
    // Note: RecordingStatus.UPLOADING doesn't exist in the enum, removed invalid check
    if (
      effectiveRecordingStatus === RecordingStatus.RECORDING ||
      effectiveRecordingStatus === RecordingStatus.PAUSED
    ) {
      return MemoProcessingStatus.UPLOADING;
    }

    // Priority 2: Check memo metadata recording status if recording status was provided
    // Skip checking for UPLOADING since it doesn't exist in RecordingStatus enum
    if (recordingStatus !== undefined && !effectiveRecordingStatus) {
      if (
        memo.metadata?.recordingStatus === RecordingStatus.RECORDING ||
        memo.metadata?.recordingStatus === RecordingStatus.PAUSED
      ) {
        return MemoProcessingStatus.UPLOADING;
      }
    }

    // Priority 3: Check for no transcript state
    if (
      memo.metadata?.processing?.transcription?.status === 'completed_no_transcript' ||
      memo.metadata?.processing?.headline_and_intro?.status === 'completed_no_transcript'
    ) {
      return MemoProcessingStatus.NO_TRANSCRIPT;
    }

    // Priority 4: Check if we have a real, meaningful title - if so, we're done
    const hasRealTitle =
      memo.title &&
      memo.title !== DEFAULT_MEMO_TITLES.UNNAMED &&
      memo.title !== DEFAULT_MEMO_TITLES.NEW_RECORDING &&
      memo.title !== DEFAULT_MEMO_TITLES.MEMO &&
      memo.title !== 'Titel wird generiert...' &&
      memo.title.trim() !== '';

    if (hasRealTitle) {
      return MemoProcessingStatus.COMPLETED;
    }

    // Priority 5: Check for completed headline generation
    if (memo.metadata?.processing?.headline_and_intro?.status === 'completed') {
      // If headline is completed but no real title exists, this is the edge case
      // where headline generation produced fallback values
      // Keep showing generating status to avoid confusing "ready" message
      return MemoProcessingStatus.GENERATING_HEADLINE;
    }

    // Priority 5: Check for errors
    if (memo.metadata?.processing?.transcription?.status === 'error') {
      return MemoProcessingStatus.ERROR;
    }

    // Priority 6: Check for processing states
    // Check for ongoing transcription (both old and new metadata structure)
    if (
      memo.metadata?.transcriptionStatus === 'processing' ||
      memo.metadata?.processing?.transcription?.status === 'processing' ||
      memo.metadata?.processing?.transcription?.status === 'pending'
    ) {
      return MemoProcessingStatus.TRANSCRIBING;
    }

    // Check for ongoing headline generation
    if (
      memo.metadata?.processing?.headline?.status === 'processing' ||
      memo.metadata?.processing?.headline_and_intro?.status === 'processing' ||
      memo.metadata?.processing?.headline_and_intro?.status === 'pending'
    ) {
      return MemoProcessingStatus.GENERATING_HEADLINE;
    }

    // Priority 7: Check for completed transcription but no headline yet
    if (memo.metadata?.processing?.transcription?.status === 'completed') {
      // If transcription is done but no headline status or it's not started, we're generating headline
      if (
        !memo.metadata?.processing?.headline_and_intro?.status ||
        memo.metadata?.processing?.headline_and_intro?.status === 'pending'
      ) {
        return MemoProcessingStatus.GENERATING_HEADLINE;
      }
    }

    // Priority 8: Check for transcript without title (should generate headline)
    if (hasTranscript(memo) && !hasRealTitle) {
      return MemoProcessingStatus.GENERATING_HEADLINE;
    }

    // Priority 9: Check for audio_path without transcript (still transcribing)
    if (memo.source?.audio_path && !memo.transcript && !memo.source?.transcript) {
      return MemoProcessingStatus.TRANSCRIBING;
    }

    // Priority 10: Check if we have an audio_path but no processing metadata (still uploading)
    if (memo.source?.audio_path && !memo.metadata?.processing) {
      return MemoProcessingStatus.UPLOADING;
    }

    // Priority 11: Check if we have no title at all
    if (!memo.title || memo.title.trim() === '') {
      // If we have any source data, we're at least transcribing
      if (memo.source?.audio_path || memo.source?.duration) {
        return MemoProcessingStatus.TRANSCRIBING;
      }
      // If we have processing metadata, check the status
      if (
        memo.metadata?.processing?.transcription?.status === 'pending' ||
        memo.metadata?.processing?.headline_and_intro?.status === 'pending'
      ) {
        return MemoProcessingStatus.TRANSCRIBING;
      }
      // Otherwise, we're in a generic processing state
      return MemoProcessingStatus.UPLOADING;
    }

    // Default: If nothing else applies, consider it completed
    return MemoProcessingStatus.COMPLETED;
  }, [memo, effectiveRecordingStatus, recordingStatus]);

  // Determine the display title based on the processing status
  // We use a more stable dependency array to prevent unnecessary recalculations
  const displayTitle = useMemo((): string => {
    // For recording in progress, only show the recording status for the latest memo
    // Only show recording status if there's an active effectiveRecordingStatus (not IDLE)
    if (
      effectiveRecordingStatus === RecordingStatus.RECORDING ||
      effectiveRecordingStatus === RecordingStatus.PAUSED
    ) {
      console.debug('Showing "Recording in progress..." for memo:', memo.id);
      return t('memo.status.recording_in_progress');
    }

    // Note: Removed check for RecordingStatus.UPLOADING as it doesn't exist in the enum
    // The uploading state is now handled by the processingStatus logic below

    // Priority 1: Show processing status during transcription and headline generation
    // This ensures users see "Transcribing..." and "Generating title..." even if memo has a title
    const statusText = getProcessingStatusText(t);
    if (
      processingStatus === MemoProcessingStatus.TRANSCRIBING ||
      processingStatus === MemoProcessingStatus.GENERATING_HEADLINE ||
      processingStatus === MemoProcessingStatus.UPLOADING
    ) {
      return statusText[processingStatus];
    }

    // Priority 2: If a real title exists (not default/placeholder), show it
    // This prevents flickering during processing state changes
    if (
      memo.title &&
      memo.title !== DEFAULT_MEMO_TITLES.UNNAMED &&
      memo.title !== DEFAULT_MEMO_TITLES.NEW_RECORDING &&
      memo.title !== DEFAULT_MEMO_TITLES.MEMO &&
      memo.title !== 'Titel wird generiert...' &&
      memo.title.trim() !== ''
    ) {
      return memo.title;
    }

    // Priority 3: Show error status if applicable
    if (processingStatus === MemoProcessingStatus.ERROR) {
      return statusText[processingStatus];
    }

    // Priority 4: Show no transcript status if applicable
    if (processingStatus === MemoProcessingStatus.NO_TRANSCRIPT) {
      return statusText[processingStatus];
    }

    // Default fallback: show processing message
    if (!memo.title || memo.title.trim() === '') {
      // No title at all, show appropriate processing status
      if (memo.source?.audio_path) {
        return t('memo.status.memo_transcribing');
      }
      return t('memo.status.memo_processing', 'Processing memo...');
    }

    return memo.title &&
      memo.title !== DEFAULT_MEMO_TITLES.UNNAMED &&
      memo.title !== DEFAULT_MEMO_TITLES.NEW_RECORDING &&
      memo.title !== DEFAULT_MEMO_TITLES.MEMO
      ? memo.title
      : t('memo.status.memo_processing', 'Processing memo...');
  }, [memo.title, processingStatus, effectiveRecordingStatus, isLatestMemo, t]);

  return {
    processingStatus,
    displayTitle,
  };
}
