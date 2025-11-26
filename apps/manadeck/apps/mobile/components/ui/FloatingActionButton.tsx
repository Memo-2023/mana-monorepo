import React from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { Icon } from './Icon';
import { useThemeColors } from '~/utils/themeUtils';

interface FloatingActionButtonProps {
  icon: string;
  iconLibrary?: 'Ionicons' | 'FontAwesome' | 'MaterialIcons' | 'Feather';
  onPress: () => void;
  size?: number;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  iconLibrary = 'Ionicons',
  onPress,
  size = 56,
}) => {
  const colors = useThemeColors();
  const iconSize = size === 56 ? 24 : size === 48 ? 20 : 28;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary,
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}>
      <Icon name={icon} size={iconSize} color={colors.primaryForeground} library={iconLibrary} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
});
