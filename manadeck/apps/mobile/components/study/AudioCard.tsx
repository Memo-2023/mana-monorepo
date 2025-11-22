import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Icon } from '../ui/Icon';
import { TTSService } from '../../utils/ttsService';
import { Card as CardType } from '../../store/cardStore';

interface AudioCardProps {
  card: CardType;
  autoPlay?: boolean;
  showControls?: boolean;
}

export const AudioCard: React.FC<AudioCardProps> = ({
  card,
  autoPlay = false,
  showControls = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoPlay) {
      handlePlay();
    }

    return () => {
      // Stop any ongoing speech when component unmounts
      TTSService.stop();
    };
  }, [card.id]);

  const handlePlay = async () => {
    try {
      setError(null);
      setIsPlaying(true);

      await TTSService.speakCard(card);

      setIsPlaying(false);
    } catch (error) {
      console.error('Error playing audio:', error);
      setError('Fehler beim Abspielen');
      setIsPlaying(false);
    }
  };

  const handleStop = async () => {
    try {
      await TTSService.stop();
      setIsPlaying(false);
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  };

  const handlePause = async () => {
    try {
      await TTSService.pause();
      setIsPlaying(false);
    } catch (error) {
      console.error('Error pausing audio:', error);
    }
  };

  const handleResume = async () => {
    try {
      await TTSService.resume();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error resuming audio:', error);
    }
  };

  const adjustRate = (newRate: number) => {
    setRate(newRate);
    // Rate will be applied on next play
  };

  if (!showControls) {
    return null;
  }

  return (
    <View className="flex-row items-center justify-center space-x-2 rounded-lg bg-gray-50 p-3">
      {/* Play/Pause Button */}
      <Pressable
        onPress={isPlaying ? handlePause : handlePlay}
        className="rounded-full bg-blue-500 p-3"
        style={({ pressed }) => pressed && { opacity: 0.7 }}>
        <Icon name={isPlaying ? 'pause' : 'play'} size={24} color="white" library="Ionicons" />
      </Pressable>

      {/* Stop Button */}
      {isPlaying && (
        <Pressable
          onPress={handleStop}
          className="rounded-full bg-gray-400 p-3"
          style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <Icon name="stop" size={24} color="white" library="Ionicons" />
        </Pressable>
      )}

      {/* Speed Controls */}
      <View className="ml-4 flex-row items-center space-x-2">
        <Text className="text-sm text-gray-600">Geschwindigkeit:</Text>

        <Pressable
          onPress={() => adjustRate(0.75)}
          className={`rounded px-2 py-1 ${rate === 0.75 ? 'bg-blue-500' : 'bg-gray-200'}`}
          style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <Text className={`text-xs ${rate === 0.75 ? 'text-white' : 'text-gray-700'}`}>0.75x</Text>
        </Pressable>

        <Pressable
          onPress={() => adjustRate(1.0)}
          className={`rounded px-2 py-1 ${rate === 1.0 ? 'bg-blue-500' : 'bg-gray-200'}`}
          style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <Text className={`text-xs ${rate === 1.0 ? 'text-white' : 'text-gray-700'}`}>1x</Text>
        </Pressable>

        <Pressable
          onPress={() => adjustRate(1.25)}
          className={`rounded px-2 py-1 ${rate === 1.25 ? 'bg-blue-500' : 'bg-gray-200'}`}
          style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <Text className={`text-xs ${rate === 1.25 ? 'text-white' : 'text-gray-700'}`}>1.25x</Text>
        </Pressable>
      </View>

      {/* Error Display */}
      {error && <Text className="ml-2 text-xs text-red-500">{error}</Text>}
    </View>
  );
};
