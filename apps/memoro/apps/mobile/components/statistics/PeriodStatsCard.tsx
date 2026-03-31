import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';
import StatRow from './StatRow';
import { useTranslation } from 'react-i18next';

interface PeriodStats {
	memos: number;
	memories: number;
	duration: number;
	words: number;
}

interface StreakData {
	current: number;
	longest: number;
}

interface PeriodStatsCardProps {
	title?: string;
	stats: PeriodStats;
	showStreaks?: boolean;
	streakData?: StreakData;
	marginBottom?: number;
}

/**
 * Reusable card component for displaying period-specific statistics
 */
const PeriodStatsCard: React.FC<PeriodStatsCardProps> = ({
	title,
	stats,
	showStreaks = false,
	streakData,
	marginBottom = 12,
}) => {
	const { isDark, themeVariant } = useTheme();
	const { t } = useTranslation();

	const textColor = isDark ? '#FFFFFF' : '#000000';
	const contentBackgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground;
	const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

	const formatTotalDuration = (seconds: number): string => {
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
		<>
			{title && (
				<Text
					style={{
						fontSize: 16,
						fontWeight: '600',
						color: textColor,
						marginBottom: 8,
					}}
				>
					{title}
				</Text>
			)}
			<View
				style={{
					backgroundColor: contentBackgroundColor,
					borderRadius: 16,
					borderWidth: 1.5,
					borderColor: borderColor,
					overflow: 'hidden',
					marginBottom,
				}}
			>
				<StatRow
					title={t('statistics.memos')}
					value={stats.memos.toString()}
					icon="document-text-outline"
				/>
				<StatRow
					title={t('statistics.memories')}
					value={stats.memories.toString()}
					icon="sparkles-outline"
				/>
				<StatRow
					title={t('statistics.recording_duration')}
					value={formatTotalDuration(stats.duration)}
					icon="volume-high-outline"
				/>
				<StatRow
					title={t('statistics.words')}
					value={stats.words.toLocaleString()}
					icon="text-outline"
				/>
				{showStreaks && streakData && (
					<>
						<StatRow
							title={t('statistics.current_streak')}
							value={`${streakData.current} ${t('statistics.days')}`}
							icon="flame-outline"
						/>
						<StatRow
							title={t('statistics.longest_streak')}
							value={`${streakData.longest} ${t('statistics.days')}`}
							icon="trophy-outline"
						/>
					</>
				)}
			</View>
		</>
	);
};

export default PeriodStatsCard;
