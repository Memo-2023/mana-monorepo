import React from 'react';
import { View } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';

interface StatisticsSectionSkeletonProps {
  children: React.ReactNode;
  showTitle?: boolean;
}

/**
 * Skeleton wrapper for StatisticsSection
 * Matches exact StatisticsSection structure: Title + marginBottom: 24
 */
const StatisticsSectionSkeleton: React.FC<StatisticsSectionSkeletonProps> = ({ children, showTitle = true }) => {
  const { isDark } = useTheme();

  const skeletonColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <>
      {/* Section title skeleton - matches StatisticsSection title styling */}
      {showTitle && (
        <View
          style={{
            height: 22, // fontSize 18 * fontWeight 'bold' ≈ 22
            width: '40%',
            backgroundColor: skeletonColor,
            borderRadius: 4,
            marginBottom: 12, // matches marginBottom: 12 in StatisticsSection
          }}
        />
      )}

      {/* Section content container - matches StatisticsSection structure */}
      <View style={{ marginBottom: 24 }}>{children}</View>
    </>
  );
};

export default StatisticsSectionSkeleton;
