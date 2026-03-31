import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import GlassCard from './GlassCard';
import StatRow from './StatRow';
import ClickableStatRow from './ClickableStatRow';

interface EngagementCardProps {
	mostViewedMemo: { id: string; title: string; viewCount: number } | null;
	lastViewedMemo: { id: string; title: string; lastViewed: string } | null;
	unreadMemos: number;
	memoCount: number;
}

const EngagementCard: React.FC<EngagementCardProps> = ({
	mostViewedMemo,
	lastViewedMemo,
	unreadMemos,
	memoCount,
}) => {
	const { isDark } = useTheme();
	const { t } = useTranslation();
	const router = useRouter();

	const textColor = isDark ? '#FFFFFF' : '#000000';
	const sectionTitleColor = isDark ? '#CCCCCC' : '#666666';

	// Calculate read percentage
	const readMemos = memoCount - unreadMemos;
	const readPercentage = memoCount > 0 ? Math.round((readMemos / memoCount) * 100) : 0;

	return (
		<GlassCard>
			<ScrollView showsVerticalScrollIndicator={false}>
				<Text style={[styles.title, { color: textColor }]}>Engagement</Text>

				{/* View Statistics */}
				<Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
					{t('statistics.section_engagement') || 'Aufrufe'}
				</Text>
				<View style={styles.statsContainer}>
					{mostViewedMemo && (
						<ClickableStatRow
							title={t('statistics.most_viewed_memo')}
							value={`${mostViewedMemo.viewCount}x`}
							icon="eye-outline"
							subtitle={mostViewedMemo.title}
							onPress={() => router.push(`/(protected)/(memo)/${mostViewedMemo.id}`)}
						/>
					)}
					{lastViewedMemo && (
						<ClickableStatRow
							title={t('statistics.last_viewed_memo')}
							value={new Date(lastViewedMemo.lastViewed).toLocaleDateString()}
							icon="time-outline"
							subtitle={lastViewedMemo.title}
							onPress={() => router.push(`/(protected)/(memo)/${lastViewedMemo.id}`)}
						/>
					)}
				</View>

				<View style={styles.divider} />

				{/* Reading Statistics */}
				<Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Lesestatus</Text>
				<View style={styles.statsContainer}>
					<StatRow
						title={t('statistics.unread_memos') || 'Ungelesene Memos'}
						value={unreadMemos.toString()}
						icon="mail-unread-outline"
					/>
					<StatRow
						title="Gelesene Memos"
						value={readMemos.toString()}
						icon="checkmark-done-outline"
					/>
					<StatRow
						title="Gelesen"
						value={`${readPercentage}%`}
						icon="stats-chart-outline"
						subtitle={`${readMemos} von ${memoCount} Memos`}
					/>
				</View>

				{unreadMemos > 0 && (
					<>
						<View style={styles.divider} />
						<View style={styles.hintContainer}>
							<Text style={[styles.hintText, { color: sectionTitleColor }]}>
								💡 Du hast noch {unreadMemos} ungelesene {unreadMemos === 1 ? 'Memo' : 'Memos'}
							</Text>
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
	statsContainer: {
		gap: 6,
	},
	divider: {
		height: 0,
		marginVertical: 18,
	},
	hintContainer: {
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
		borderRadius: 12,
		padding: 14,
	},
	hintText: {
		fontSize: 13,
		lineHeight: 18,
	},
});

export default EngagementCard;
