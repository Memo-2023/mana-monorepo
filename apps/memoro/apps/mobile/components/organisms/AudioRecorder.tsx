import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';

import { RecordingStatus } from '~/features/audioRecordingV2';

/**
 * Props für die AudioRecorder-Komponente
 */
interface AudioRecorderProps {
  status: RecordingStatus;
  duration: number;
  error: string | null;
  metering: number | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording?: () => void;
  onResumeRecording?: () => void;
  onReset: () => void;
}

/**
 * Komponente für die Aufnahmesteuerung und Timer-Anzeige
 * Web-kompatible Version
 */
export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  status,
  duration,
  error,
  metering,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onReset,
}) => {
  // Formatiere die Dauer als MM:SS
  const formattedDuration = useMemo(() => {
    const totalSeconds = Math.floor(duration / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [duration]);

  // Status für blinkenden Indikator (nur für Aufnahme)
  const [visible, setVisible] = useState(true);
  const isRecording = status === RecordingStatus.RECORDING;
  const isPaused = status === RecordingStatus.PAUSED;
  const isStopped = status === RecordingStatus.STOPPED;
  const hasError = status === RecordingStatus.ERROR;
  const isWeb = Platform.OS === 'web';

  // Prüfen, ob Pause/Resume unterstützt wird
  const supportsPauseResume = !!onPauseRecording && !!onResumeRecording;

  // Für blinkenden Aufnahme-Indikator
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | number;

    if (isRecording) {
      interval = setInterval(() => {
        setVisible((prev) => !prev);
      }, 800);
    } else {
      setVisible(true);
    }

    return () => {
      if (interval) clearInterval(interval as ReturnType<typeof setInterval>);
    };
  }, [isRecording]);

  return (
    <View className="w-full rounded-lg bg-gray-50 p-6 border border-gray-200">
      {/* Timer mit optionalem blinkenden Aufnahme-Indikator */}
      <View className="mb-4 flex items-center justify-center">
        {(isRecording || isPaused) && (
          <View className="mb-2 flex-row items-center justify-center">
            <View style={[
              styles.recordingDot,
              (!visible || isPaused) && styles.recordingDotInvisible
            ]} />
            <Text className={`ml-2 font-medium ${isPaused ? 'text-amber-600' : 'text-red-600'}`}>
              {isPaused ? 'PAUSE' : 'REC'}
            </Text>
          </View>
        )}

        {/* Audio-Pegel Anzeige - nur auf Mobile zeigen */}
        {!isWeb && (isRecording || isPaused) && metering !== null && (
          <View className="mb-2 w-full max-w-xs">
            <View className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, (metering + 60) / 60 * 100))}%`,
                  opacity: isPaused ? 0.5 : 1
                }}
              />
            </View>
          </View>
        )}

        <Text className="text-4xl font-bold text-gray-900">{formattedDuration}</Text>
        <Text className="mt-1 text-sm text-gray-600">
          {isRecording
            ? 'Aufnahme läuft... Tippe auf Stop zum Beenden'
            : isPaused
              ? 'Aufnahme pausiert... Tippe auf Fortsetzen'
              : isStopped
                ? duration > 0
                  ? `Aufnahme beendet (${Math.floor(duration / 1000)}s)`
                  : 'Aufnahme beendet'
                : 'Bereit für Aufnahme'}
        </Text>
      </View>

      {/* Fehlermeldung */}
      {hasError && error && (
        <View className="mb-4 rounded bg-red-50 p-2 border border-red-100">
          <Text className="text-center text-red-600">{error}</Text>
        </View>
      )}

      {/* Steuerungselemente mit Universal-Buttons */}
      <View className="flex-row items-center justify-center space-x-6">
        {/* Zurücksetzen-Button (nur anzeigen, wenn gestoppt oder Fehler) */}
        {(isStopped || hasError) && (
          <Pressable
            onPress={onReset}
            className="h-12 w-12 items-center justify-center rounded-full bg-gray-200 shadow-sm">
            <Text className="text-lg text-gray-700">↺</Text>
          </Pressable>
        )}

        {/* Pause/Resume-Button (nur anzeigen, wenn Aufnahme läuft oder pausiert und unterstützt wird) */}
        {supportsPauseResume && (isRecording || isPaused) && (
          <Pressable
            onPress={isPaused ? onResumeRecording : onPauseRecording}
            className="h-12 w-12 items-center justify-center rounded-full bg-amber-500 shadow-sm">
          <Text className="text-lg text-gray-800">{isPaused ? '▶' : '❚❚'}</Text>
        </Pressable>
      )}

      {/* Aufnahme-Button mit universellen Symbolen */}
      <Pressable
        onPress={isRecording || isPaused ? onStopRecording : onStartRecording}
        className={`h-16 w-16 items-center justify-center rounded-full ${
          isRecording ? 'bg-red-600' : isPaused ? 'bg-amber-600' : 'bg-blue-600'
        }`}>
        <Text className="text-xl font-bold text-gray-100">
            {isRecording || isPaused ? '■' : '●'}
          </Text>
        </Pressable>
      </View>

      {/* Hilfstext */}
      <Text className="mt-4 text-center text-xs text-gray-600">
        {isRecording
          ? supportsPauseResume
            ? 'Tippe auf Pause zum Pausieren oder Stopp zum Beenden'
            : 'Tippe auf Stopp zum Beenden'
          : isPaused
            ? 'Tippe auf Fortsetzen oder Stopp zum Beenden'
            : isStopped
              ? 'Aufnahme gespeichert'
              : 'Tippe auf Start zum Aufnehmen'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#B91C1C', // Even darker red for better contrast on white
  },
  recordingDotInvisible: {
    opacity: 0,
  },
});

export default AudioRecorder;
