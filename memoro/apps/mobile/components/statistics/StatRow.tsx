import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Icon from '~/components/atoms/Icon';
import colors from '~/tailwind.config.js';

interface StatRowProps {
  title: string;
  value: string;
  icon: string;
  subtitle?: string;
}

/**
 * Reusable row component for displaying a statistic with icon, title and value
 */
const StatRow: React.FC<StatRowProps> = ({ title, value, icon, subtitle }) => {
  const { isDark, themeVariant } = useTheme();

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const textSecondaryColor = isDark ? '#CCCCCC' : '#666666';
  const primaryColor = isDark
    ? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.primary
    : (colors as any).theme?.extend?.colors?.[themeVariant]?.primary;
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
        borderRadius: 12,
      }}>
      <Icon name={icon} size={22} color={primaryColor} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: textColor,
          }}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 12,
              color: textSecondaryColor,
              marginTop: 2,
            }}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text
        style={{
          fontSize: 17,
          fontWeight: '700',
          color: textColor,
          textAlign: 'right',
        }}>
        {value}
      </Text>
    </View>
  );
};

export default StatRow;
