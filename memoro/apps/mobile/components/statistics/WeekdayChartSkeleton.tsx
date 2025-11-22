import React from 'react';
import { View } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';

/**
 * Skeleton loader for WeekdayChart component
 * Matches exact WeekdayChart structure: just a simple list, not a bar chart
 */
const WeekdayChartSkeleton: React.FC = () => {
  const { isDark, themeVariant } = useTheme();

  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const skeletonColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <View
      style={{
        paddingVertical: 12, // matches WeekdayChart paddingVertical
        paddingHorizontal: 16, // matches WeekdayChart paddingHorizontal
      }}>
      {/* Chart title skeleton - matches WeekdayChart title styling */}
      <View
        style={{
          height: 17, // fontSize 14 * fontWeight '500' ≈ 17
          width: '60%',
          backgroundColor: skeletonColor,
          borderRadius: 4,
          marginBottom: 8, // matches marginBottom: 8 in WeekdayChart
        }}
      />

      {/* Weekday items skeleton - matches WeekdayChart list items */}
      {[1, 2, 3].map((index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4, // matches marginBottom: 4 in WeekdayChart
          }}>
          {/* Day name skeleton - matches WeekdayChart day styling */}
          <View
            style={{
              height: 14, // fontSize 12 ≈ 14
              width: '30%',
              backgroundColor: skeletonColor,
              borderRadius: 4,
              flex: 1, // matches flex: 1 in WeekdayChart
            }}
          />

          {/* Count skeleton - matches WeekdayChart count styling */}
          <View
            style={{
              height: 14, // fontSize 12 ≈ 14
              width: '25%',
              backgroundColor: skeletonColor,
              borderRadius: 4,
            }}
          />
        </View>
      ))}
    </View>
  );
};

export default WeekdayChartSkeleton;
