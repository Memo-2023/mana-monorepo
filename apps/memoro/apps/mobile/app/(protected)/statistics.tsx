import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '~/features/auth';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { useHeader } from '~/features/menus/HeaderContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import colors from '~/tailwind.config.js';
import { StatisticsPageSkeleton } from '~/components/statistics';
import OverviewCard from '~/components/statistics/OverviewCard';
import ProductivityCard from '~/components/statistics/ProductivityCard';
import InsightsCard from '~/components/statistics/InsightsCard';
import EngagementCard from '~/components/statistics/EngagementCard';
import { usePageOnboarding } from '~/features/onboarding/contexts/OnboardingContext';
import { TIME_MS } from '~/utils/sharedConstants';
import { formatDurationWithUnits } from '~/utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_SPACING = 16;

type TimePeriod = 'today' | 'week' | 'month' | 'year' | 'all';

interface WeekData {
	weekNumber: number;
	year: number;
	startDate: Date;
	endDate: Date;
	memos: number;
	memories: number;
	duration: number;
	words: number;
}

interface StatisticsData {
	// Basic counts
	memoCount: number;
	memoryCount: number;
	totalAudioDuration: number;
	totalWordCount: number;
	averageWordCount: number;
	averageAudioDuration: number;

	// Period-specific metrics
	todayStats: { memos: number; memories: number; duration: number; words: number };
	last7DaysStats: { memos: number; memories: number; duration: number; words: number };
	last30DaysStats: { memos: number; memories: number; duration: number; words: number };

	// Activity & Productivity
	longestRecording: number;
	activestWeek: { week: string; count: number };
	activestMonth: { month: string; count: number };
	currentStreak: number;
	longestStreak: number;

	// Memo Engagement
	mostViewedMemo: { id: string; title: string; viewCount: number } | null;
	lastViewedMemo: { id: string; title: string; lastViewed: string } | null;
	unreadMemos: number;

	// Tag Analytics
	totalTags: number;
	mostUsedTags: { name: string; count: number; color: string }[];
	assignedTags: number;
	memosWithoutTags: number;
	averageTagsPerMemo: number;

	// Audio Insights
	recordingsByWeekday: { [key: string]: number };
	averageWordsPerMinute: number;

	// Location Data
	topLocations: { city: string; count: number }[];
}

const Statistics: React.FC = () => {
	const { user } = useAuth();
	const { t } = useTranslation();
	const { updateConfig } = useHeader();
	const { isDark, themeVariant } = useTheme();
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const [statistics, setStatistics] = useState<StatisticsData | null>(null);
	const [weeklyData, setWeeklyData] = useState<WeekData[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Page onboarding
	const { showPageOnboardingToast, cleanupPageToast } = usePageOnboarding();

	// Farben aus der Tailwind-Konfiguration wie auf der Tags-Seite
	const pageBackgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.pageBackground
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.pageBackground;

	const contentBackgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground;

	const textColor = isDark ? '#FFFFFF' : '#000000';
	const textSecondaryColor = isDark ? '#CCCCCC' : '#666666';
	const primaryColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.primary
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.primary;
	const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

	// Helper functions for weekly data
	const getWeekNumber = (date: Date) => {
		const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
		const dayNum = d.getUTCDay() || 7;
		d.setUTCDate(d.getUTCDate() + 4 - dayNum);
		const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
		return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	};

	const getWeekBounds = (date: Date) => {
		const d = new Date(date);
		const day = d.getDay();
		const diff = d.getDate() - day + (day === 0 ? -6 : 1);
		const monday = new Date(d.setDate(diff));
		const sunday = new Date(monday);
		sunday.setDate(monday.getDate() + 6);

		return {
			start: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate()),
			end: new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59),
		};
	};

	const getDateRange = (period: TimePeriod) => {
		const now = new Date();

		switch (period) {
			case 'today':
				const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
				return { start: startOfDay, end: endOfDay };
			case 'week':
				const weekAgo = new Date(now.getTime() - TIME_MS.WEEK);
				return { start: weekAgo, end: now };
			case 'month':
				const monthAgo = new Date(now.getTime() - TIME_MS.MONTH);
				return { start: monthAgo, end: now };
			case 'year':
				const yearAgo = new Date(now.getTime() - TIME_MS.YEAR);
				return { start: yearAgo, end: now };
			default:
				return null;
		}
	};

	const loadStatistics = async () => {
		if (!user) return;

		setIsLoading(true);
		try {
			const supabase = await getAuthenticatedClient();
			// Always load all data for overview
			const dateRange = null;

			// Helper function to fetch all data with pagination if needed
			const fetchAllData = async (tableName: string, selectFields: string, batchSize = 1000) => {
				let allData: any[] = [];
				let from = 0;
				let hasMore = true;

				while (hasMore) {
					const { data, error } = await supabase
						.from(tableName)
						.select(selectFields)
						.range(from, from + batchSize - 1);

					if (error) throw error;

					if (data && data.length > 0) {
						allData = [...allData, ...data];
						hasMore = data.length === batchSize;
						from += batchSize;
					} else {
						hasMore = false;
					}
				}

				return allData;
			};

			// Fetch all data with pagination
			const [memos, memories, tags, memoTags] = await Promise.all([
				fetchAllData('memos', 'id, created_at, source, metadata, title, intro'),
				fetchAllData('memories', 'id, created_at, content'),
				fetchAllData('tags', 'id, name, style'),
				fetchAllData('memo_tags', 'memo_id, tag_id', 2000), // Higher batch size for junction table
			]);

			// Note: Date filtering would be applied here if needed in the future
			// Currently we load all data for comprehensive statistics

			// Calculate basic statistics
			let totalAudioDuration = 0;
			let totalWordCount = 0;
			let validMemoCount = 0;
			let longestRecording = 0;
			const weekdayCounts: { [key: string]: number } = {};
			const locationCounts: { [key: string]: number } = {};
			let totalWordsInRecordings = 0;
			let totalRecordingDuration = 0;

			// Most and last viewed memos tracking
			let mostViewedMemo: { id: string; title: string; viewCount: number } | null = null;
			let lastViewedMemo: { id: string; title: string; lastViewed: string } | null = null;
			let unreadMemos = 0;

			memos.forEach((memo) => {
				// Audio duration
				const duration = memo.metadata?.stats?.audioDuration || 0;
				if (duration > 0) {
					totalAudioDuration += duration;
					totalRecordingDuration += duration;
					longestRecording = Math.max(longestRecording, duration);
				}

				// Word count
				let wordCount = memo.metadata?.stats?.wordCount || 0;
				if (!wordCount) {
					const transcript =
						memo.source?.transcript || memo.source?.content || memo.source?.transcription || '';
					if (transcript) {
						wordCount = transcript.split(/\s+/).filter((word) => word.length > 0).length;
					}
				}

				if (wordCount > 0) {
					totalWordCount += wordCount;
					validMemoCount++;
					if (duration > 0) {
						totalWordsInRecordings += wordCount;
					}
				}

				// Weekday analysis
				const createdDate = new Date(memo.created_at);
				const weekdayNames = [
					t('statistics.weekdays.sunday'),
					t('statistics.weekdays.monday'),
					t('statistics.weekdays.tuesday'),
					t('statistics.weekdays.wednesday'),
					t('statistics.weekdays.thursday'),
					t('statistics.weekdays.friday'),
					t('statistics.weekdays.saturday'),
				];
				const weekday = weekdayNames[createdDate.getDay()];
				weekdayCounts[weekday]++;

				// Location analysis
				const city = memo.metadata?.location?.address?.city;
				if (city) {
					locationCounts[city] = (locationCounts[city] || 0) + 1;
				}

				// View tracking
				const viewCount = memo.metadata?.stats?.viewCount || 0;
				const lastViewed = memo.metadata?.stats?.lastViewed;

				if (viewCount === 0) {
					unreadMemos++;
				}

				if (!mostViewedMemo || viewCount > mostViewedMemo.viewCount) {
					mostViewedMemo = {
						id: memo.id,
						title: memo.title || memo.intro || t('memo.untitled'),
						viewCount,
					};
				}

				if (
					lastViewed &&
					(!lastViewedMemo || new Date(lastViewed) > new Date(lastViewedMemo.lastViewed))
				) {
					lastViewedMemo = {
						id: memo.id,
						title: memo.title || memo.intro || t('memo.untitled'),
						lastViewed,
					};
				}
			});

			// Memory word count
			let memoryWordCount = 0;
			memories.forEach((memory) => {
				const content = memory.content || '';
				const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;
				memoryWordCount += wordCount;
			});

			// Period-specific statistics
			const periodStats = calculatePeriodStats(memos, memories);

			// Activity analysis (streaks, activest periods)
			const { currentStreak, longestStreak, activestWeek, activestMonth } =
				calculateActivityMetrics(memos, t);

			// Tag analytics
			const tagAnalytics = calculateTagAnalytics(memos, memoTags, tags);

			// Top locations
			const topLocations = Object.entries(locationCounts)
				.sort(([, a], [, b]) => b - a)
				.slice(0, 5)
				.map(([city, count]) => ({ city, count }));

			// Calculate weekly data
			const weekMap = new Map<string, WeekData>();

			// Process memos for weekly data
			memos.forEach((memo) => {
				const date = new Date(memo.created_at);
				const weekNumber = getWeekNumber(date);
				const year = date.getFullYear();
				const weekKey = `${year}-W${weekNumber}`;
				const weekBounds = getWeekBounds(date);

				if (!weekMap.has(weekKey)) {
					weekMap.set(weekKey, {
						weekNumber,
						year,
						startDate: weekBounds.start,
						endDate: weekBounds.end,
						memos: 0,
						memories: 0,
						duration: 0,
						words: 0,
					});
				}

				const weekData = weekMap.get(weekKey)!;
				weekData.memos++;

				const duration = memo.metadata?.stats?.audioDuration || 0;
				weekData.duration += duration;

				let wordCount = memo.metadata?.stats?.wordCount || 0;
				if (!wordCount) {
					const transcript =
						memo.source?.transcript || memo.source?.content || memo.source?.transcription || '';
					if (transcript) {
						wordCount = transcript.split(/\s+/).filter((word) => word.length > 0).length;
					}
				}
				weekData.words += wordCount;
			});

			// Process memories for weekly data
			memories.forEach((memory) => {
				const date = new Date(memory.created_at);
				const weekNumber = getWeekNumber(date);
				const year = date.getFullYear();
				const weekKey = `${year}-W${weekNumber}`;
				const weekBounds = getWeekBounds(date);

				if (!weekMap.has(weekKey)) {
					weekMap.set(weekKey, {
						weekNumber,
						year,
						startDate: weekBounds.start,
						endDate: weekBounds.end,
						memos: 0,
						memories: 0,
						duration: 0,
						words: 0,
					});
				}

				const weekData = weekMap.get(weekKey)!;
				weekData.memories++;

				const content = memory.content || '';
				const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;
				weekData.words += wordCount;
			});

			// Convert to array and sort by date (newest first)
			const weeklyArray = Array.from(weekMap.values())
				.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
				.slice(0, 12); // Show last 12 weeks

			setWeeklyData(weeklyArray);

			const memosWithAudio = memos.filter(
				(memo) => (memo.metadata?.stats?.audioDuration || 0) > 0
			).length;

			const stats: StatisticsData = {
				// Basic counts
				memoCount: memos.length,
				memoryCount: memories.length,
				totalAudioDuration,
				totalWordCount: totalWordCount + memoryWordCount,
				averageWordCount: validMemoCount > 0 ? Math.round(totalWordCount / validMemoCount) : 0,
				averageAudioDuration:
					memosWithAudio > 0 ? Math.round(totalAudioDuration / memosWithAudio) : 0,

				// Period-specific metrics
				...periodStats,

				// Activity & Productivity
				longestRecording,
				activestWeek,
				activestMonth,
				currentStreak,
				longestStreak,

				// Memo Engagement
				mostViewedMemo,
				lastViewedMemo,
				unreadMemos,

				// Tag Analytics
				...tagAnalytics,

				// Audio Insights
				recordingsByWeekday: weekdayCounts,
				averageWordsPerMinute:
					totalRecordingDuration > 0
						? Math.round((totalWordsInRecordings / (totalRecordingDuration / 60)) * 10) / 10
						: 0,

				// Location Data
				topLocations,
			};

			setStatistics(stats);
		} catch (error) {
			console.error('Error loading statistics:', error);
		} finally {
			setIsLoading(false);
		}
	};

	// Helper function to calculate period-specific statistics
	const calculatePeriodStats = (memos: any[], memories: any[]) => {
		const now = new Date();

		// Define time periods
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const last7DaysStart = new Date(now.getTime() - TIME_MS.WEEK);
		const last30DaysStart = new Date(now.getTime() - TIME_MS.MONTH);

		const calculateStatsForPeriod = (startDate: Date) => {
			const periodMemos = memos.filter((memo) => new Date(memo.created_at) >= startDate);
			const periodMemories = memories.filter((memory) => new Date(memory.created_at) >= startDate);

			let duration = 0;
			let words = 0;

			periodMemos.forEach((memo) => {
				// Audio duration
				const audioDuration = memo.metadata?.stats?.audioDuration || 0;
				duration += audioDuration;

				// Word count
				let wordCount = memo.metadata?.stats?.wordCount || 0;
				if (!wordCount) {
					const transcript =
						memo.source?.transcript || memo.source?.content || memo.source?.transcription || '';
					if (transcript) {
						wordCount = transcript.split(/\s+/).filter((word) => word.length > 0).length;
					}
				}
				words += wordCount;
			});

			// Add memory words
			periodMemories.forEach((memory) => {
				const content = memory.content || '';
				const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;
				words += wordCount;
			});

			return {
				memos: periodMemos.length,
				memories: periodMemories.length,
				duration,
				words,
			};
		};

		return {
			todayStats: calculateStatsForPeriod(todayStart),
			last7DaysStats: calculateStatsForPeriod(last7DaysStart),
			last30DaysStats: calculateStatsForPeriod(last30DaysStart),
		};
	};

	// Helper function to calculate activity metrics
	const calculateActivityMetrics = (memos: any[], t: any) => {
		if (memos.length === 0) {
			return {
				currentStreak: 0,
				longestStreak: 0,
				activestWeek: { week: t('statistics.no_data_week'), count: 0 },
				activestMonth: { month: t('statistics.no_data_month'), count: 0 },
			};
		}

		// Sort memos by date
		const sortedMemos = memos.sort(
			(a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
		);

		// Calculate streaks
		const dates = [...new Set(sortedMemos.map((memo) => new Date(memo.created_at).toDateString()))];
		let currentStreak = 0;
		let longestStreak = 0;
		let currentStreakCount = 0;

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Check for current streak (working backwards from today)
		for (let i = 0; i >= -365; i--) {
			const checkDate = new Date(today);
			checkDate.setDate(today.getDate() + i);
			const dateString = checkDate.toDateString();

			if (dates.includes(dateString)) {
				currentStreakCount++;
			} else if (i === 0) {
				// Today has no memo, check yesterday
				continue;
			} else {
				break;
			}
		}
		currentStreak = currentStreakCount;

		// Calculate longest streak
		let tempStreak = 0;
		for (let i = 1; i < dates.length; i++) {
			const prevDate = new Date(dates[i - 1]);
			const currDate = new Date(dates[i]);
			const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

			if (dayDiff === 1) {
				tempStreak++;
			} else {
				longestStreak = Math.max(longestStreak, tempStreak + 1);
				tempStreak = 0;
			}
		}
		longestStreak = Math.max(longestStreak, tempStreak + 1);

		// Calculate activest week and month
		const weekCounts: { [key: string]: number } = {};
		const monthCounts: { [key: string]: number } = {};

		sortedMemos.forEach((memo) => {
			const date = new Date(memo.created_at);
			const weekKey = `${t('statistics.week_prefix')} ${getWeekNumber(date)} ${date.getFullYear()}`;
			const monthKey = `${date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}`;

			weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
			monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
		});

		const activestWeek = Object.entries(weekCounts).reduce(
			(max, [week, count]) => (count > max.count ? { week, count } : max),
			{ week: t('statistics.no_data_week'), count: 0 }
		);

		const activestMonth = Object.entries(monthCounts).reduce(
			(max, [month, count]) => (count > max.count ? { month, count } : max),
			{ month: t('statistics.no_data_month'), count: 0 }
		);

		return { currentStreak, longestStreak, activestWeek, activestMonth };
	};

	// Helper function to calculate tag analytics
	const calculateTagAnalytics = (memos: any[], memoTags: any[], tags: any[]) => {
		// Count tag usage
		const tagUsage: { [key: string]: number } = {};
		const tagMap = new Map(tags.map((tag) => [tag.id, tag]));

		memoTags.forEach((memoTag) => {
			tagUsage[memoTag.tag_id] = (tagUsage[memoTag.tag_id] || 0) + 1;
		});

		// Get most used tags
		const mostUsedTags = Object.entries(tagUsage)
			.map(([tagId, count]) => {
				const tag = tagMap.get(tagId);
				return {
					name: tag?.name || 'Unknown',
					count,
					color: tag?.style?.color || '#808080',
				};
			})
			.sort((a, b) => b.count - a.count)
			.slice(0, 5);

		// Calculate memos without tags
		const memosWithTags = new Set(memoTags.map((mt) => mt.memo_id));
		const memosWithoutTags = memos.filter((memo) => !memosWithTags.has(memo.id)).length;

		// Calculate average tags per memo
		const totalTagAssignments = memoTags.length;
		const averageTagsPerMemo =
			memos.length > 0 ? Math.round((totalTagAssignments / memos.length) * 10) / 10 : 0;

		return {
			totalTags: tags.length,
			mostUsedTags,
			assignedTags: totalTagAssignments,
			memosWithoutTags,
			averageTagsPerMemo,
		};
	};

	useEffect(() => {
		loadStatistics();
	}, [user]);

	// Header-Konfiguration aktualisieren, wenn die Seite fokussiert wird
	useFocusEffect(
		useCallback(() => {
			updateConfig({
				title: t('statistics.title'),
				showBackButton: true,
				rightIcons: [],
			});

			// Show onboarding toast for statistics page
			showPageOnboardingToast('statistics');

			// Cleanup when leaving page
			return () => {
				cleanupPageToast('statistics');
			};
		}, [])
	);

	// Using consolidated formatter
	const formatDuration = formatDurationWithUnits;

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
			<Stack.Screen options={{ headerShown: false }} />

			<View style={{ flex: 1, backgroundColor: pageBackgroundColor }}>
				<View style={styles.container}>
					<View style={{ alignItems: 'center', paddingBottom: 0, marginBottom: 24 }}>
						<Text
							style={{
								fontSize: 40,
								lineHeight: 40,
								fontWeight: '700',
								color: textColor,
								alignSelf: 'center',
							}}
							numberOfLines={1}
						>
							{t('statistics.title')}
						</Text>
					</View>
					{isLoading ? (
						<View style={styles.loadingContainer}>
							<StatisticsPageSkeleton selectedView="overview" />
						</View>
					) : statistics ? (
						<ScrollView
							horizontal
							pagingEnabled={false}
							showsHorizontalScrollIndicator={false}
							decelerationRate="fast"
							snapToInterval={CARD_WIDTH + CARD_SPACING}
							snapToAlignment="start"
							contentContainerStyle={styles.cardsContainer}
						>
							<>
								{/* Overview Card */}
								<View style={styles.cardWrapper}>
									<OverviewCard
										memoCount={statistics.memoCount}
										memoryCount={statistics.memoryCount}
										totalDuration={statistics.totalAudioDuration}
										totalWords={statistics.totalWordCount}
										currentStreak={statistics.currentStreak}
										averageWordCount={statistics.averageWordCount}
									/>
								</View>

								{/* Productivity Card */}
								<View style={styles.cardWrapper}>
									<ProductivityCard
										todayStats={statistics.todayStats}
										last30DaysStats={statistics.last30DaysStats}
										currentStreak={statistics.currentStreak}
										longestStreak={statistics.longestStreak}
										activestWeek={statistics.activestWeek}
										activestMonth={statistics.activestMonth}
									/>
								</View>

								{/* Insights Card */}
								<View style={styles.cardWrapper}>
									<InsightsCard
										averageAudioDuration={statistics.averageAudioDuration}
										averageWordsPerMinute={statistics.averageWordsPerMinute}
										longestRecording={statistics.longestRecording}
										recordingsByWeekday={statistics.recordingsByWeekday}
										totalTags={statistics.totalTags}
										assignedTags={statistics.assignedTags}
										memosWithoutTags={statistics.memosWithoutTags}
										averageTagsPerMemo={statistics.averageTagsPerMemo}
										mostUsedTags={statistics.mostUsedTags}
										topLocations={statistics.topLocations}
									/>
								</View>

								{/* Engagement Card */}
								<View style={styles.cardWrapper}>
									<EngagementCard
										mostViewedMemo={statistics.mostViewedMemo}
										lastViewedMemo={statistics.lastViewedMemo}
										unreadMemos={statistics.unreadMemos}
										memoCount={statistics.memoCount}
									/>
								</View>
							</>
						</ScrollView>
					) : null}
				</View>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
	},
	cardsContainer: {
		paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
		paddingVertical: 20,
		paddingBottom: 40,
	},
	cardWrapper: {
		width: CARD_WIDTH,
		marginRight: CARD_SPACING,
		height: '100%',
	},
});

export default Statistics;
