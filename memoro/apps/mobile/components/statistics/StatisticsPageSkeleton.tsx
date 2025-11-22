import React from 'react';
import { View } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';
import StatisticsSectionSkeleton from './StatisticsSectionSkeleton';
import PeriodStatsCardSkeleton from './PeriodStatsCardSkeleton';
import StatRowSkeleton from './StatRowSkeleton';
import TagAnalyticsCardSkeleton from './TagAnalyticsCardSkeleton';
import WeekdayChartSkeleton from './WeekdayChartSkeleton';

interface StatisticsPageSkeletonProps {
  selectedView: string;
}

/**
 * Complete skeleton loader for the Statistics page
 */
const StatisticsPageSkeleton: React.FC<StatisticsPageSkeletonProps> = ({ selectedView }) => {
  const { isDark, themeVariant } = useTheme();

  const contentBackgroundColor = isDark
    ? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground
    : (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground;
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  if (selectedView === 'weeks') {
    return (
      <>
        {/* Weekly Chart Overview Skeleton */}
        <StatisticsSectionSkeleton>
          <View
            style={{
              backgroundColor: contentBackgroundColor,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: borderColor,
              padding: 16,
              marginBottom: 12,
              height: 200,
            }}>
            {/* Weekly chart content would go here */}
          </View>
        </StatisticsSectionSkeleton>

        {/* Individual Week Cards Skeleton */}
        <StatisticsSectionSkeleton>
          {[1, 2, 3, 4, 5].map((index) => (
            <View
              key={index}
              style={{
                backgroundColor: contentBackgroundColor,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: borderColor,
                padding: 16,
                marginBottom: 12,
                height: 120,
              }}
            />
          ))}
        </StatisticsSectionSkeleton>
      </>
    );
  }

  return (
    <>
      {/* Overview Section Skeleton - no title for first section */}
      <StatisticsSectionSkeleton showTitle={false}>
        <PeriodStatsCardSkeleton showTitle={false} />
        <PeriodStatsCardSkeleton />
        <PeriodStatsCardSkeleton />
        <PeriodStatsCardSkeleton />
      </StatisticsSectionSkeleton>

      {/* Activity & Productivity Skeleton */}
      <StatisticsSectionSkeleton>
        <View
          style={{
            backgroundColor: contentBackgroundColor,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: borderColor,
            overflow: 'hidden',
          }}>
          <StatRowSkeleton showSubtitle />
          <StatRowSkeleton showSubtitle />
          <StatRowSkeleton showSubtitle isLast />
        </View>
      </StatisticsSectionSkeleton>

      {/* Memo Engagement Skeleton */}
      <StatisticsSectionSkeleton>
        <View
          style={{
            backgroundColor: contentBackgroundColor,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: borderColor,
            overflow: 'hidden',
          }}>
          <StatRowSkeleton showSubtitle />
          <StatRowSkeleton showSubtitle />
          <StatRowSkeleton isLast />
        </View>
      </StatisticsSectionSkeleton>

      {/* Tag Analytics Skeleton */}
      <StatisticsSectionSkeleton>
        <TagAnalyticsCardSkeleton />
      </StatisticsSectionSkeleton>

      {/* Audio Insights Skeleton */}
      <StatisticsSectionSkeleton>
        <View
          style={{
            backgroundColor: contentBackgroundColor,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: borderColor,
            overflow: 'hidden',
          }}>
          <StatRowSkeleton showSubtitle />
          <StatRowSkeleton showSubtitle />
          <WeekdayChartSkeleton />
        </View>
      </StatisticsSectionSkeleton>

      {/* Location Data Skeleton */}
      <StatisticsSectionSkeleton>
        <View
          style={{
            backgroundColor: contentBackgroundColor,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: borderColor,
            overflow: 'hidden',
          }}>
          <StatRowSkeleton />
          <StatRowSkeleton />
          <StatRowSkeleton isLast />
        </View>
      </StatisticsSectionSkeleton>
    </>
  );
};

export default StatisticsPageSkeleton;
