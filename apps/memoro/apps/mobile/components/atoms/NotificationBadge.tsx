/**
 * NotificationBadge Component
 *
 * A small red badge with a number indicating notification count.
 * Typically used to show unread items, pending actions, etc.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Text from './Text';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  size = 'small',
  style,
}) => {
  // Don't render if count is 0
  if (count <= 0) {
    return null;
  }

  // Determine badge size
  const badgeSize = size === 'small' ? 18 : 22;
  const fontSize = size === 'small' ? 11 : 13;

  // Format count (max 99+)
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View
      style={[
        styles.badge,
        {
          width: badgeSize,
          height: badgeSize,
          borderRadius: badgeSize / 2,
          minWidth: badgeSize,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            fontSize,
            lineHeight: fontSize + 2,
          },
        ]}
      >
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#EF4444', // Red-500
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default NotificationBadge;
