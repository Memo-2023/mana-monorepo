import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, withSpring, interpolateColor, Easing, cancelAnimation } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '~/features/theme/ThemeProvider';
import { RecordingStatus } from '~/features/audioRecordingV2/types';
import { useRecordingStore } from '~/features/audioRecordingV2/store/recordingStore';
import { useToastActions } from '~/features/toast';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import Alert from '~/components/atoms/Alert';
import { useTranslation } from 'react-i18next';

interface RecordingBarProps {
  onRecordingComplete?: (result: string, title?: string, spaceId?: string | null, blueprintId?: string | null, memoId?: string | null) => void;
}

/**
 * RecordingBar-Komponente
 * 
 * Eine Leiste, die während einer aktiven Aufnahme am unteren Bildschirmrand angezeigt wird.
 * Ermöglicht das Pausieren, Fortsetzen und Beenden der Aufnahme.
 */
function RecordingBar({
  onRecordingComplete,
}: RecordingBarProps) {
  const { isDark } = useTheme();
  const { showInfo } = useToastActions();
  const { t } = useTranslation();
  
  // Verwende den globalen Recording-Store
  const {
    status,
    savedFile,
    stopRecording,
    pauseRecording,
    resumeRecording,
    isRecording,
    isPaused,
    duration,
    resetRecording
  } = useRecordingStore();

  // Long-press state for stop button
  const [isStopPressed, setIsStopPressed] = useState(false);
  const stopPressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStopPressedRef = useRef(false);
  const STOP_PRESS_DURATION = 1000; // 1 second hold

  // Animation values for stop button
  const stopScaleAnim = useSharedValue(1);
  const stopRotationAnim = useSharedValue(0);
  const headerColorAnim = useSharedValue(0); // 0 = normal color, 1 = red color

  // Formatiere die Aufnahmedauer als MM:SS
  const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handler für das Pausieren der Aufnahme
  const handlePauseRecording = () => {
    if (status === RecordingStatus.RECORDING) {
      pauseRecording();
    }
  };

  // Handler für das Fortsetzen der Aufnahme
  const handleResumeRecording = () => {
    if (status === RecordingStatus.PAUSED) {
      resumeRecording();
    }
  };

  // Haptic feedback functions
  const triggerStopHaptic = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.debug('Haptic feedback error:', error);
    }
  }, []);

  const triggerPressHaptic = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.debug('Haptic feedback error:', error);
    }
  }, []);

  // Handler für das Beenden der Aufnahme
  const handleCompleteRecording = useCallback(() => {
    triggerStopHaptic();
    stopRecording();
  }, [triggerStopHaptic, stopRecording]);

  // Long-press handlers for stop button
  const handleStopPressIn = useCallback(() => {
    setIsStopPressed(true);
    isStopPressedRef.current = true;
    
    // Haptic feedback on press start
    triggerPressHaptic();
    
    // Visual feedback: scale down and start rotation
    stopScaleAnim.value = withSpring(0.9, { damping: 15, stiffness: 200 });
    stopRotationAnim.value = withTiming(360, { 
      duration: STOP_PRESS_DURATION, 
      easing: Easing.linear 
    });
    headerColorAnim.value = withTiming(1, { 
      duration: 300, 
      easing: Easing.out(Easing.ease) 
    });
    
    // Timer for completing the stop action
    stopPressTimeout.current = setTimeout(() => {
      if (isStopPressedRef.current) {
        handleCompleteRecording();
      }
    }, STOP_PRESS_DURATION);
  }, [triggerPressHaptic, stopScaleAnim, stopRotationAnim, handleCompleteRecording]);

  const handleStopPressOut = useCallback(() => {
    const wasInProgress = stopPressTimeout.current !== null && isStopPressedRef.current;
    
    setIsStopPressed(false);
    isStopPressedRef.current = false;
    
    // Clear timeout if stop hasn't completed yet
    if (stopPressTimeout.current) {
      clearTimeout(stopPressTimeout.current);
      stopPressTimeout.current = null;
    }
    
    // Visual feedback: return to normal scale and reset rotation
    stopScaleAnim.value = withSpring(1, { damping: 15, stiffness: 200 });
    stopRotationAnim.value = withTiming(0, { 
      duration: 300, 
      easing: Easing.out(Easing.ease) 
    });
    headerColorAnim.value = withTiming(0, { 
      duration: 300, 
      easing: Easing.out(Easing.ease) 
    });
    
    // Show toast if user released the button before completing the action
    if (wasInProgress) {
      showInfo('Lange drücken um Aufnahme zu beenden');
    }
  }, [stopScaleAnim, stopRotationAnim, headerColorAnim, showInfo]);
  
  // Handler für das Abbrechen und Zurücksetzen der Aufnahme
  const handleCancelRecording = () => {
    // Native Alert statt Modal
    Alert.alert(
      t('recording.cancel_recording_title'),
      t('recording.cancel_recording_message'),
      [
        {
          text: t('recording.no_continue'),
          style: 'cancel'
        },
        {
          text: t('recording.yes_cancel'),
          style: 'destructive',
          onPress: async () => {
            try {
              await resetRecording();
               
              console.debug('Recording canceled and reset successfully');
            } catch (error) {
               
              console.debug('Error resetting recording:', error);
            }
          }
        }
      ]
    );
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clear any active timeout
      if (stopPressTimeout.current) {
        clearTimeout(stopPressTimeout.current);
        stopPressTimeout.current = null;
      }
      
      // Cancel all animations to prevent memory leaks
      cancelAnimation(stopScaleAnim);
      cancelAnimation(stopRotationAnim);
      cancelAnimation(headerColorAnim);
      
      // Reset animation values
      stopScaleAnim.value = 1;
      stopRotationAnim.value = 0;
      headerColorAnim.value = 0;
      
      // Reset state refs
      isStopPressedRef.current = false;
    };
  }, []);

  // Effekt für die Benachrichtigung über abgeschlossene Aufnahmen
  useEffect(() => {
    // Wenn die Aufnahme beendet ist und wir eine gespeicherte Datei haben, rufe den Callback auf
    if (status === RecordingStatus.STOPPED && savedFile) {
      // Hole alle relevanten Informationen aus dem Recording-Store
      const { title, spaceId, blueprintId, memoId } = useRecordingStore.getState();
      onRecordingComplete?.(savedFile.uri, title, spaceId, blueprintId, memoId);
    }
  }, [status, savedFile, onRecordingComplete]);

  // Animated styles for stop button
  const stopButtonScaleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: stopScaleAnim.value }],
    };
  });

  const stopButtonRotationStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${stopRotationAnim.value}deg` }],
    };
  });

  const headerBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      headerColorAnim.value,
      [0, 1],
      [isDark ? '#1E1E1E' : '#FFFFFF', '#dc2626'] // Normal color to darker red
    ),
  }));

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
      width: '100%',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 1000,
    },
    recordingInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    recordingDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#FF3B30',
      marginRight: 8,
    },
    recordingText: {
      fontSize: 14,
      fontWeight: '500',
    },
    duration: {
      fontSize: 14,
      marginLeft: 8,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    controlButton: {
      padding: 8,
      marginLeft: 8,
    }
  });

  if (!isRecording) return null;

  return (
    <Animated.View style={[styles.container, headerBackgroundStyle]}>
      <View style={styles.recordingInfo}>
        <View style={styles.recordingDot} />
        <Text style={styles.recordingText}>Aufnahme</Text>
        <Text style={styles.duration}>{formatDuration(duration)}</Text>
      </View>
      <View style={styles.controls}>
        {isPaused ? (
          <Pressable style={styles.controlButton} onPress={handleResumeRecording}>
            <Icon name="play" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        ) : (
          <Pressable style={styles.controlButton} onPress={handlePauseRecording}>
            <Icon name="pause" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        )}
        <Pressable 
          style={styles.controlButton} 
          onPressIn={handleStopPressIn}
          onPressOut={handleStopPressOut}
        >
          <Animated.View style={stopButtonScaleStyle}>
            <Animated.View style={stopButtonRotationStyle}>
              <Icon name="stop" size={24} color="#FF3B30" />
            </Animated.View>
          </Animated.View>
        </Pressable>
        <Pressable style={styles.controlButton} onPress={handleCancelRecording}>
          <Icon name="close-outline" size={24} color="#FF3B30" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default RecordingBar;
