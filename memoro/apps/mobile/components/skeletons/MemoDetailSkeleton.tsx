import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { MemoTitleSkeleton } from './sections/MemoTitleSkeleton';
import { MemoMetadataSkeleton } from './sections/MemoMetadataSkeleton';
import { MemoryCardSkeleton } from './sections/MemoryCardSkeleton';
import { AudioPlayerSkeleton } from './sections/AudioPlayerSkeleton';
import { TranscriptSkeleton } from './sections/TranscriptSkeleton';
import { QuestionButtonSkeleton } from './sections/QuestionButtonSkeleton';

interface MemoDetailSkeletonProps {
  showMemories?: boolean;
  showAudioPlayer?: boolean;
  showTranscript?: boolean;
  showQuestionButton?: boolean;
}

export const MemoDetailSkeleton: React.FC<MemoDetailSkeletonProps> = ({
  showMemories = true,
  showAudioPlayer = true,
  showTranscript = true,
  showQuestionButton = true,
}) => {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <MemoTitleSkeleton />
      <MemoMetadataSkeleton />
      
      {showMemories && (
        <MemoryCardSkeleton showMultiple />
      )}
      
      {showAudioPlayer && (
        <AudioPlayerSkeleton />
      )}
      
      {showTranscript && (
        <TranscriptSkeleton />
      )}
      
      {showQuestionButton && (
        <QuestionButtonSkeleton />
      )}
      
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,        // Same as content paddingTop in memo page
    paddingBottom: 32,    // Same as scrollContentContainer paddingBottom
  },
  bottomPadding: {
    height: 120,  // Account for bottom bar
  },
});