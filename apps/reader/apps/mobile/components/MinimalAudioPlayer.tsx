import React, { useState, useEffect } from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Icon } from '~/components/Icon';
import { useAudio } from '~/hooks/useAudio';
import { Text as TextType } from '~/types/database';
import { useStore } from '~/store/store';
import { useTheme } from '~/hooks/useTheme';
import { getCurrentAudioVersion, migrateAudioData } from '~/utils/audioMigration';

interface MinimalAudioPlayerProps {
  text: TextType;
}

export const MinimalAudioPlayer: React.FC<MinimalAudioPlayerProps> = ({ text }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { currentTextId } = useStore();
  const { colors } = useTheme();

  const { audioState, generateAudio, playAudio, pauseAudio, resumeAudio, stopAudio } = useAudio();

  // Check if this text is currently playing
  const isCurrentText = currentTextId === text.id;
  const isPlaying = isCurrentText && audioState.isPlaying;
  const isLoading = isCurrentText && audioState.isLoading;

  // Get audio version
  const migratedData = migrateAudioData(text.data);
  const currentVersion = getCurrentAudioVersion(migratedData);
  const hasAudio = currentVersion && currentVersion.chunks.length > 0;

  // Stop audio when component unmounts or text changes
  useEffect(() => {
    return () => {
      if (isCurrentText) {
        stopAudio();
      }
    };
  }, [isCurrentText, stopAudio]);

  const handlePlayPause = async () => {
    if (!hasAudio) {
      // Generate audio if not available
      try {
        setIsGenerating(true);
        const { settings } = useStore.getState();
        await generateAudio(text.id, text.content, settings.voice, settings.speed, text);
      } catch (error) {
        console.error('Error generating audio:', error);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    try {
      if (isPlaying) {
        await pauseAudio();
      } else if (isCurrentText && audioState.sound) {
        await resumeAudio();
      } else {
        // Stop any other playing audio and start this one
        if (currentTextId && currentTextId !== text.id) {
          await stopAudio();
        }
        await playAudio(text.id, currentVersion.chunks, 0);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  return (
    <Pressable
      onPress={handlePlayPause}
      disabled={isLoading || isGenerating}
      className={`rounded-full p-2 ${
        hasAudio ? colors.surfaceSecondary : colors.surface
      } active:opacity-70`}>
      {isLoading || isGenerating ? (
        <ActivityIndicator size="small" color={colors.tabBarInactive} />
      ) : (
        <Icon
          name={hasAudio ? (isPlaying ? 'pause-circle' : 'play-circle') : 'mic-circle'}
          size={28}
          color={hasAudio ? colors.tabBarActive : colors.tabBarInactive}
        />
      )}
    </Pressable>
  );
};
