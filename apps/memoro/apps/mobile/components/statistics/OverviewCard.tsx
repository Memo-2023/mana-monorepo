import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import GlassCard from './GlassCard';
import StatRow from './StatRow';

interface OverviewCardProps {
  memoCount: number;
  memoryCount: number;
  totalDuration: number;
  totalWords: number;
  currentStreak: number;
  averageWordCount: number;
}

const OverviewCard: React.FC<OverviewCardProps> = ({
  memoCount,
  memoryCount,
  totalDuration,
  totalWords,
  currentStreak,
  averageWordCount,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const highlightColor = isDark ? '#FFD700' : '#FFA500';

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
      <Text style={[styles.title, { color: textColor }]}>
        {t('statistics.filter_overview')}
      </Text>
      <View style={styles.statsContainer}>
        <StatRow
          title={t('statistics.memos')}
          value={memoCount.toString()}
          icon="document-text-outline"
        />
        <StatRow
          title={t('statistics.memories')}
          value={memoryCount.toString()}
          icon="sparkles-outline"
        />
        <StatRow
          title={t('statistics.recording_duration')}
          value={formatDuration(totalDuration)}
          icon="volume-high-outline"
        />
        <StatRow
          title={t('statistics.words')}
          value={totalWords.toLocaleString()}
          icon="text-outline"
        />
        <View style={styles.divider} />
        <StatRow
          title={t('statistics.current_streak')}
          value={`${currentStreak} ${t('statistics.days')}`}
          icon="flame-outline"
        />
        <StatRow
          title={t('statistics.average_word_count') || 'Ø Wörter/Memo'}
          value={averageWordCount.toString()}
          icon="analytics-outline"
        />
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
  },
  statsContainer: {
    gap: 6,
  },
  divider: {
    height: 0,
    marginVertical: 12,
  },
});

export default OverviewCard;
