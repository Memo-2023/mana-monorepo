import React from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '~/hooks/useTheme';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon: string;
  label: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function FloatingActionButton({
  onPress,
  icon,
  label,
  disabled = false,
  loading = false,
  style,
}: FloatingActionButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={style}
      className={`flex-row items-center rounded-full px-4 py-3 shadow-lg ${
        disabled || loading ? 'bg-gray-400' : colors.primary
      }`}>
      {loading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <>
          <Text className="mr-2 text-lg text-white">{icon}</Text>
          <Text className="font-medium text-white">{label}</Text>
        </>
      )}
    </Pressable>
  );
}
