import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';

interface StatisticsSectionProps {
  title?: string;
  children: React.ReactNode;
  marginBottom?: number;
}

/**
 * Reusable section container for statistics with consistent styling
 */
const StatisticsSection: React.FC<StatisticsSectionProps> = ({
  title,
  children,
  marginBottom = 24,
}) => {
  const { isDark } = useTheme();
  const textColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <>
      {title && (
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: textColor,
            marginBottom: 12,
          }}>
          {title}
        </Text>
      )}
      <View style={{ marginBottom }}>{children}</View>
    </>
  );
};

export default StatisticsSection;
