import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import GlassCard from './GlassCard';
import StatRow from './StatRow';

interface ProductivityCardProps {
  todayStats: {
    memos: number;
    memories: number;
    duration: number;
    words: number;
  };
  last30DaysStats: {
    memos: number;
    memories: number;
    duration: number;
    words: number;
  };
  currentStreak: number;
  longestStreak: number;
  activestWeek: { week: string; count: number };
  activestMonth: { month: string; count: number };
}

const ProductivityCard: React.FC<ProductivityCardProps> = ({
  todayStats,
  last30DaysStats,
  currentStreak,
  longestStreak,
  activestWeek,
  activestMonth,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const sectionTitleColor = isDark ? '#CCCCCC' : '#666666';

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <GlassCard>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: textColor }]}>
          Produktivität
        </Text>

        {/* Today Section */}
        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
          {t('statistics.period_today')}
        </Text>
        <View style={styles.statsContainer}>
        <StatRow
          title={t('statistics.memos')}
          value={todayStats.memos.toString()}
          icon="document-text-outline"
        />
        <StatRow
          title={t('statistics.memories')}
          value={todayStats.memories.toString()}
          icon="sparkles-outline"
        />
        <StatRow
          title={t('statistics.recording_duration')}
          value={formatDuration(todayStats.duration)}
          icon="volume-high-outline"
        />
        <StatRow
          title={t('statistics.words')}
          value={todayStats.words.toLocaleString()}
          icon="text-outline"
        />
      </View>

      <View style={styles.divider} />

      {/* Last 30 Days Section */}
      <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
        {t('statistics.period_last_30_days')}
      </Text>
      <View style={styles.statsContainer}>
        <StatRow
          title={t('statistics.memos')}
          value={last30DaysStats.memos.toString()}
          icon="document-text-outline"
        />
        <StatRow
          title={t('statistics.memories')}
          value={last30DaysStats.memories.toString()}
          icon="sparkles-outline"
        />
        <StatRow
          title={t('statistics.recording_duration')}
          value={formatDuration(last30DaysStats.duration)}
          icon="volume-high-outline"
        />
        <StatRow
          title={t('statistics.words')}
          value={last30DaysStats.words.toLocaleString()}
          icon="text-outline"
        />
      </View>

      <View style={styles.divider} />

      {/* Streaks & Activity */}
      <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
        {t('statistics.section_activity')}
      </Text>
      <View style={styles.statsContainer}>
        <StatRow
          title={t('statistics.current_streak')}
          value={`${currentStreak} ${t('statistics.days')}`}
          icon="flame-outline"
        />
        <StatRow
          title={t('statistics.longest_streak')}
          value={`${longestStreak} ${t('statistics.days')}`}
          icon="trophy-outline"
        />
        <StatRow
          title={t('statistics.most_active_week')}
          value={`${activestWeek.count}${t('statistics.memos_suffix')}`}
          icon="calendar-outline"
          subtitle={activestWeek.week}
        />
        <StatRow
          title={t('statistics.most_active_month')}
          value={`${activestMonth.count}${t('statistics.memos_suffix')}`}
          icon="calendar-outline"
          subtitle={activestMonth.month}
        />
      </View>
      </ScrollView>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsContainer: {
    gap: 6,
  },
  divider: {
    height: 0,
    marginVertical: 18,
  },
});

export default ProductivityCard;
