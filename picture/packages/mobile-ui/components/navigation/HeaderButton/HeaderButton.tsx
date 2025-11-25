import React from 'react';
import { Pressable, ViewStyle, PressableProps } from 'react-native';
import { Icon } from '../../ui/Icon';

export type HeaderButtonProps = {
  /** Icon name */
  icon: string;
  /** Press handler */
  onPress: () => void;
  /** Icon size */
  size?: number;
  /** Icon color */
  iconColor?: string;
  /** Button is disabled */
  disabled?: boolean;
  /** Additional styles */
  style?: ViewStyle;
  /** Hit slop for better touch target */
  hitSlop?: PressableProps['hitSlop'];
};

export function HeaderButton({
  icon,
  onPress,
  size = 24,
  iconColor = '#6B7280',
  disabled = false,
  style,
  hitSlop = { top: 10, bottom: 10, left: 10, right: 10 },
}: HeaderButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        {
          padding: 8,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Icon name={icon} size={size} color={iconColor} />
    </Pressable>
  );
}
