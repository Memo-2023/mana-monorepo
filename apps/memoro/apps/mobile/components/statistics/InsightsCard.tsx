import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import GlassCard from './GlassCard';
import StatRow from './StatRow';
import WeekdayChart from './WeekdayChart';
import { formatDurationWithUnits } from '~/utils/formatters';

interface InsightsCardProps {
	averageAudioDuration: number;
	averageWordsPerMinute: number;
	longestRecording: number;
	recordingsByWeekday: { [key: string]: number };
	totalTags: number;
	assignedTags: number;
	memosWithoutTags: number;
	averageTagsPerMemo: number;
	mostUsedTags: { name: string; count: number; color: string }[];
	topLocations: { city: string; count: number }[];
}

const InsightsCard: React.FC<InsightsCardProps> = ({
	averageAudioDuration,
	averageWordsPerMinute,
	longestRecording,
	recordingsByWeekday,
	totalTags,
	assignedTags,
	memosWithoutTags,
	averageTagsPerMemo,
	mostUsedTags,
	topLocations,
}) => {
	const { isDark } = useTheme();
	const { t } = useTranslation();

	const textColor = isDark ? '#FFFFFF' : '#000000';
	const sectionTitleColor = isDark ? '#CCCCCC' : '#666666';

	return (
		<GlassCard>
			<ScrollView showsVerticalScrollIndicator={false}>
				<Text style={[styles.title, { color: textColor }]}>Insights</Text>

				{/* Audio Insights */}
				<Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
					{t('statistics.section_audio')}
				</Text>
				<View style={styles.statsContainer}>
					<StatRow
						title={t('statistics.average_recording_duration')}
						value={formatDurationWithUnits(averageAudioDuration)}
						icon="time-outline"
						subtitle={t('statistics.per_memo')}
					/>
					<StatRow
						title={t('statistics.average_words_per_minute')}
						value={averageWordsPerMinute.toString()}
						icon="speedometer-outline"
						subtitle={t('statistics.speaking_speed')}
					/>
					<StatRow
						title={t('statistics.longest_recording')}
						value={formatDurationWithUnits(longestRecording)}
						icon="timer-outline"
					/>
					<WeekdayChart data={recordingsByWeekday} />
				</View>

				<View style={styles.divider} />

				{/* Tag Analytics */}
				<Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
					{t('statistics.section_tags')}
				</Text>
				<View style={styles.statsContainer}>
					<StatRow
						title={t('statistics.total_tags') || 'Gesamt Tags'}
						value={totalTags.toString()}
						icon="pricetag-outline"
					/>
					<StatRow
						title={t('statistics.assigned_tags') || 'Zugewiesene Tags'}
						value={assignedTags.toString()}
						icon="checkmark-circle-outline"
					/>
					<StatRow
						title={t('statistics.memos_without_tags') || 'Memos ohne Tags'}
						value={memosWithoutTags.toString()}
						icon="alert-circle-outline"
					/>
					<StatRow
						title={t('statistics.average_tags_per_memo') || 'Ø Tags/Memo'}
						value={averageTagsPerMemo.toString()}
						icon="analytics-outline"
					/>
					{mostUsedTags.length > 0 && (
						<>
							<View style={styles.tagDivider} />
							<Text style={[styles.subSectionTitle, { color: sectionTitleColor }]}>
								{t('statistics.most_used_tags') || 'Meistgenutzte Tags'}
							</Text>
							{mostUsedTags.slice(0, 5).map((tag) => (
								<StatRow
									key={tag.name}
									title={tag.name}
									value={tag.count.toString()}
									icon="pricetag"
								/>
							))}
						</>
					)}
				</View>

				{/* Location Data */}
				{topLocations.length > 0 && (
					<>
						<View style={styles.divider} />
						<Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
							{t('statistics.section_locations')}
						</Text>
						<View style={styles.statsContainer}>
							{topLocations.map((location) => (
								<StatRow
									key={location.city}
									title={location.city}
									value={`${location.count}${t('statistics.memos_suffix')}`}
									icon="location-outline"
								/>
							))}
						</View>
					</>
				)}
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
	subSectionTitle: {
		fontSize: 13,
		fontWeight: '600',
		marginTop: 8,
		marginBottom: 8,
		opacity: 0.8,
	},
	statsContainer: {
		gap: 6,
	},
	divider: {
		height: 0,
		marginVertical: 18,
	},
	tagDivider: {
		height: 0,
		marginVertical: 12,
	},
});

export default InsightsCard;
