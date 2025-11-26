import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import TranscriptDisplay from '~/components/organisms/TranscriptDisplay';
import TranslationLinks from '~/components/molecules/TranslationLinks';
import AudioPlayer from '~/components/organisms/AudioPlayer';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { useToast } from '~/features/toast/contexts/ToastContext';
import { hasTranscript } from '~/features/memos/utils/transcriptUtils';

interface MemoTranscriptProps {
  memo: any; // TODO: Add proper Memo type
  memoId: string;
  transcriptData: any; // TODO: Add proper ProcessedTranscriptData type
  isEditMode: boolean;
  editTranscript: string;
  editUtterances: any[]; // TODO: Add proper Utterance[] type
  searchQuery: string;
  searchResults: any[]; // TODO: Add proper SearchResult[] type
  currentSearchIndex: number;
  isSearchMode: boolean;
  onTranscriptChange: (text: string) => void;
  onUtteranceChange: (index: number, text: string) => void;
  onUpdateSpeakerLabels: (speakerIds: string[], labels: Record<string, string>) => void;
  onNameSpeakersPress: () => void;
  transcriptRef?: React.RefObject<View>;
  audioUrl?: string | null;
  formatDateTimeForAudio?: (dateString: string, durationSeconds?: number) => string;
}

export default function MemoTranscript({
  memo,
  memoId,
  transcriptData,
  isEditMode,
  editTranscript,
  editUtterances,
  searchQuery,
  searchResults,
  currentSearchIndex,
  isSearchMode,
  onTranscriptChange,
  onUtteranceChange,
  onUpdateSpeakerLabels,
  onNameSpeakersPress,
  transcriptRef,
  audioUrl,
  formatDateTimeForAudio,
}: MemoTranscriptProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { showSuccess } = useToast();

  // Check if transcript should be shown
  const shouldShowTranscript = hasTranscript(memo) || memo?.source?.type === 'audio';
  
  // Memoized recording date calculation
  const recordingDate = useMemo(() => {
    if (!memo || !formatDateTimeForAudio) return '';
    
    try {
      // Try to get recording started date first
      const recordingStarted = memo.metadata?.recordingStartedAt || memo.created_at;
      const duration = memo.metadata?.duration || memo.metadata?.stats?.duration || 0;
      
      // Ensure recordingStarted is a valid string before passing to formatDateTimeForAudio
      if (!recordingStarted || typeof recordingStarted !== 'string') {
        return '';
      }
      
      return formatDateTimeForAudio(recordingStarted, duration);
    } catch (error) {
      debug('Error calculating recording date:', error);
      return '';
    }
  }, [memo, formatDateTimeForAudio]);

  if (!shouldShowTranscript || !transcriptData) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      marginBottom: 20,
      maxWidth: 760, // 720px content + 40px margins
      alignSelf: 'center',
      width: '100%',
    },
    audioPlayerContainer: {
      marginBottom: 20,
      marginHorizontal: 20,
      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.5)' : 'rgba(245, 245, 245, 0.5)',
      borderRadius: 12,
      overflow: 'hidden',
    },
  });

  // Debug logging
  const debug = __DEV__ ? console.debug : () => {};

  const handleTranscriptChange = (newTranscript: string) => {
    if (isEditMode) {
      onTranscriptChange(newTranscript);
    }
  };

  const handleUtteranceChange = (index: number, newText: string) => {
    if (isEditMode) {
      debug('onUtteranceChange called:', { index, newText });
      onUtteranceChange(index, newText);
      
      // Also update main transcript if single utterance
      if (editUtterances?.length === 1 && index === 0) {
        debug('Updating main transcript for single utterance:', newText);
        onTranscriptChange(newText);
      }
    }
  };

  const handleCopySuccess = () => {
    showSuccess(t('memo.transcript_copied_success', 'Transkript erfolgreich kopiert!'));
  };

  return (
    <View style={styles.container} ref={transcriptRef}>
      {/* Main Audio Player - show if audio URL is available */}
      {audioUrl && (
        <View style={styles.audioPlayerContainer}>
          <AudioPlayer
            audioUri={audioUrl}
            headlineText={t('memo.audio_recording', 'Audioaufnahme')}
            dateText={recordingDate || ''}
            durationText={
              memo?.metadata?.stats?.speakerCount
                ? `${memo.metadata.stats.speakerCount} ${t('memo.speakers', 'Speakers')}`
                : undefined
            }
            onDelete={undefined}
            onPlayStatusChange={undefined}
            showCopyButton={false}
          />
        </View>
      )}

      {/* Translation Links - show links to original/translations */}
      {memoId && <TranslationLinks memoId={memoId} memoMetadata={memo?.metadata} />}

      <TranscriptDisplay
        data={transcriptData}
        title={t('memo.transcript_title', 'Transkript')}
        speakerLabels={memo?.metadata?.speakerLabels || { default: '' }}
        onUpdateSpeakerLabels={onUpdateSpeakerLabels}
        onNameSpeakersPress={onNameSpeakersPress}
        onCopySuccess={handleCopySuccess}
        searchQuery={searchQuery}
        isSearchMode={isSearchMode}
        currentResultIndex={currentSearchIndex}
        searchResults={searchResults}
        isEditing={isEditMode}
        onTranscriptChange={isEditMode ? handleTranscriptChange : undefined}
        onUtteranceChange={isEditMode ? handleUtteranceChange : undefined}
      />
    </View>
  );
}