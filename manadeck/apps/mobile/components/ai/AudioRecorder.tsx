import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, Animated } from 'react-native';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { Audio } from 'expo-av';
import { useAIStore } from '../../store/aiStore';
import { Card } from '../ui/Card';

interface AudioRecorderProps {
  onRecordingComplete?: (audioUri: string) => void;
  onTranscriptionComplete?: (text: string) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  onTranscriptionComplete,
}) => {
  const { audioRecording, startRecording, stopRecording, generateCardsFromAudio } = useAIStore();
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (audioRecording.isRecording) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start duration counter
      durationInterval.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      // Stop animations and reset
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);

      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [audioRecording.isRecording, pulseAnim]);

  const handleStartRecording = async () => {
    try {
      setRecordingDuration(0);
      await startRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsProcessing(true);
      const uri = await stopRecording();
      setRecordingDuration(0);

      if (onRecordingComplete) {
        onRecordingComplete(uri);
      }

      // Generate cards from audio
      if (onTranscriptionComplete) {
        try {
          const cards = await generateCardsFromAudio(uri);
          // Extract text from first card for transcription callback
          const transcribedText = cards.length > 0 ? JSON.stringify(cards[0].content) : '';
          onTranscriptionComplete(transcribedText);
        } catch (error) {
          console.error('Error transcribing audio:', error);
        }
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card padding="lg" variant="elevated">
      <View className="items-center">
        {/* Recording Status */}
        <View className="mb-4 items-center">
          {audioRecording.isRecording ? (
            <>
              <Text variant="h4" className="mb-2 font-semibold text-red-600">
                Aufnahme läuft
              </Text>
              <Text variant="h3" className="font-bold text-gray-900">
                {formatDuration(recordingDuration)}
              </Text>
            </>
          ) : isProcessing ? (
            <>
              <Text variant="h4" className="mb-2 font-semibold text-blue-600">
                Verarbeite Audio...
              </Text>
              <View className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </>
          ) : (
            <Text variant="h4" className="font-semibold text-gray-700">
              Drücke zum Aufnehmen
            </Text>
          )}
        </View>

        {/* Recording Button */}
        <Pressable
          onPress={audioRecording.isRecording ? handleStopRecording : handleStartRecording}
          disabled={isProcessing}
          className="relative">
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
            }}
            className={`h-20 w-20 items-center justify-center rounded-full ${
              audioRecording.isRecording ? 'bg-red-500' : 'bg-blue-500'
            } ${isProcessing ? 'opacity-50' : ''}`}>
            <Icon
              name={audioRecording.isRecording ? 'stop' : 'mic'}
              size={32}
              color="white"
              library="Ionicons"
            />
          </Animated.View>

          {/* Pulse Effect Ring */}
          {audioRecording.isRecording && (
            <Animated.View
              style={{
                position: 'absolute',
                top: -10,
                left: -10,
                right: -10,
                bottom: -10,
                borderRadius: 50,
                borderWidth: 2,
                borderColor: '#EF4444',
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [0.3, 0],
                }),
                transform: [{ scale: pulseAnim }],
              }}
            />
          )}
        </Pressable>

        {/* Instructions */}
        <Text variant="caption" className="mt-4 text-center text-gray-500">
          {audioRecording.isRecording
            ? 'Spreche deutlich und drücke Stopp wenn fertig'
            : isProcessing
              ? 'Audio wird mit KI verarbeitet...'
              : 'Halte das Mikrofon gedrückt und spreche deinen Lerninhalt'}
        </Text>

        {/* Audio Waveform Visualization (simplified) */}
        {audioRecording.isRecording && (
          <View className="mt-4 flex-row items-center justify-center space-x-1">
            {[...Array(7)].map((_, i) => (
              <Animated.View
                key={i}
                className="w-1 bg-red-500"
                style={{
                  height: 20 + Math.random() * 20,
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.2],
                    outputRange: [0.5, 1],
                  }),
                }}
              />
            ))}
          </View>
        )}
      </View>
    </Card>
  );
};
