<script lang="ts">
	import { onMount } from 'svelte';
	import { createAuthClient } from '$lib/supabaseClient';
	import OverviewCard from '$lib/components/statistics/OverviewCard.svelte';
	import ProductivityCard from '$lib/components/statistics/ProductivityCard.svelte';
	import InsightsCard from '$lib/components/statistics/InsightsCard.svelte';
	import EngagementCard from '$lib/components/statistics/EngagementCard.svelte';
	import { StatisticsPageSkeleton } from '$lib/components/skeletons';

	interface StatisticsData {
		memoCount: number;
		memoryCount: number;
		totalAudioDuration: number;
		totalWordCount: number;
		averageWordCount: number;
		averageAudioDuration: number;
		todayStats: { memos: number; memories: number; duration: number; words: number };
		last30DaysStats: { memos: number; memories: number; duration: number; words: number };
		longestRecording: number;
		activestWeek: { week: string; count: number };
		activestMonth: { month: string; count: number };
		currentStreak: number;
		longestStreak: number;
		mostViewedMemo: { id: string; title: string; viewCount: number } | null;
		lastViewedMemo: { id: string; title: string; lastViewed: string } | null;
		unreadMemos: number;
		totalTags: number;
		mostUsedTags: { name: string; count: number; color: string }[];
		assignedTags: number;
		memosWithoutTags: number;
		averageTagsPerMemo: number;
		averageWordsPerMinute: number;
		topLocations: { city: string; count: number }[];
	}

	let statistics = $state<StatisticsData | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(() => {
		loadStatistics();
	});

	async function loadStatistics() {
		try {
			loading = true;
			error = null;

			const supabase = await createAuthClient();

			// Fetch all data with pagination
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

			const [memos, memories, tags, memoTags] = await Promise.all([
				fetchAllData('memos', 'id, created_at, source, metadata, title, intro'),
				fetchAllData('memories', 'id, created_at, content'),
				fetchAllData('tags', 'id, name, style'),
				fetchAllData('memo_tags', 'memo_id, tag_id', 2000),
			]);

			// Calculate statistics
			let totalAudioDuration = 0;
			let totalWordCount = 0;
			let validMemoCount = 0;
			let longestRecording = 0;
			const locationCounts: { [key: string]: number } = {};
			let totalWordsInRecordings = 0;
			let totalRecordingDuration = 0;

			let mostViewedMemo: { id: string; title: string; viewCount: number } | null = null;
			let lastViewedMemo: { id: string; title: string; lastViewed: string } | null = null;
			let unreadMemos = 0;

			memos.forEach((memo) => {
				const duration = memo.metadata?.stats?.audioDuration || 0;
				if (duration > 0) {
					totalAudioDuration += duration;
					totalRecordingDuration += duration;
					longestRecording = Math.max(longestRecording, duration);
				}

				let wordCount = memo.metadata?.stats?.wordCount || 0;
				if (!wordCount) {
					const transcript =
						memo.source?.transcript || memo.source?.content || memo.source?.transcription || '';
					if (transcript) {
						wordCount = transcript.split(/\s+/).filter((word: string) => word.length > 0).length;
					}
				}

				if (wordCount > 0) {
					totalWordCount += wordCount;
					validMemoCount++;
					if (duration > 0) {
						totalWordsInRecordings += wordCount;
					}
				}

				const city = memo.metadata?.location?.address?.city;
				if (city) {
					locationCounts[city] = (locationCounts[city] || 0) + 1;
				}

				const viewCount = memo.metadata?.stats?.viewCount || 0;
				const lastViewed = memo.metadata?.stats?.lastViewed;

				if (viewCount === 0) {
					unreadMemos++;
				}

				if (!mostViewedMemo || viewCount > mostViewedMemo.viewCount) {
					mostViewedMemo = {
						id: memo.id,
						title: memo.title || memo.intro || 'Unbenanntes Memo',
						viewCount,
					};
				}

				if (
					lastViewed &&
					(!lastViewedMemo || new Date(lastViewed) > new Date(lastViewedMemo.lastViewed))
				) {
					lastViewedMemo = {
						id: memo.id,
						title: memo.title || memo.intro || 'Unbenanntes Memo',
						lastViewed,
					};
				}
			});

			let memoryWordCount = 0;
			memories.forEach((memory) => {
				const content = memory.content || '';
				const wordCount = content.split(/\s+/).filter((word: string) => word.length > 0).length;
				memoryWordCount += wordCount;
			});

			const periodStats = calculatePeriodStats(memos, memories);
			const activityMetrics = calculateActivityMetrics(memos);
			const tagAnalytics = calculateTagAnalytics(memos, memoTags, tags);

			const topLocations = Object.entries(locationCounts)
				.sort(([, a], [, b]) => b - a)
				.slice(0, 5)
				.map(([city, count]) => ({ city, count }));

			const memosWithAudio = memos.filter(
				(memo) => (memo.metadata?.stats?.audioDuration || 0) > 0
			).length;

			statistics = {
				memoCount: memos.length,
				memoryCount: memories.length,
				totalAudioDuration,
				totalWordCount: totalWordCount + memoryWordCount,
				averageWordCount: validMemoCount > 0 ? Math.round(totalWordCount / validMemoCount) : 0,
				averageAudioDuration:
					memosWithAudio > 0 ? Math.round(totalAudioDuration / memosWithAudio) : 0,
				...periodStats,
				longestRecording,
				...activityMetrics,
				mostViewedMemo,
				lastViewedMemo,
				unreadMemos,
				...tagAnalytics,
				averageWordsPerMinute:
					totalRecordingDuration > 0
						? Math.round((totalWordsInRecordings / (totalRecordingDuration / 60)) * 10) / 10
						: 0,
				topLocations,
			};
		} catch (err) {
			console.error('Error loading statistics:', err);
			error = 'Fehler beim Laden der Statistiken';
		} finally {
			loading = false;
		}
	}

	function calculatePeriodStats(memos: any[], memories: any[]) {
		const now = new Date();
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const last30DaysStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

		const calculateStatsForPeriod = (startDate: Date) => {
			const periodMemos = memos.filter((memo) => new Date(memo.created_at) >= startDate);
			const periodMemories = memories.filter((memory) => new Date(memory.created_at) >= startDate);

			let duration = 0;
			let words = 0;

			periodMemos.forEach((memo) => {
				const audioDuration = memo.metadata?.stats?.audioDuration || 0;
				duration += audioDuration;

				let wordCount = memo.metadata?.stats?.wordCount || 0;
				if (!wordCount) {
					const transcript =
						memo.source?.transcript || memo.source?.content || memo.source?.transcription || '';
					if (transcript) {
						wordCount = transcript.split(/\s+/).filter((word: string) => word.length > 0).length;
					}
				}
				words += wordCount;
			});

			periodMemories.forEach((memory) => {
				const content = memory.content || '';
				const wordCount = content.split(/\s+/).filter((word: string) => word.length > 0).length;
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
			last30DaysStats: calculateStatsForPeriod(last30DaysStart),
		};
	}

	function calculateActivityMetrics(memos: any[]) {
		if (memos.length === 0) {
			return {
				currentStreak: 0,
				longestStreak: 0,
				activestWeek: { week: 'Keine Daten', count: 0 },
				activestMonth: { month: 'Keine Daten', count: 0 },
			};
		}

		const sortedMemos = memos.sort(
			(a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
		);

		const dates = [...new Set(sortedMemos.map((memo) => new Date(memo.created_at).toDateString()))];
		let currentStreak = 0;
		let longestStreak = 0;
		let currentStreakCount = 0;

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (let i = 0; i >= -365; i--) {
			const checkDate = new Date(today);
			checkDate.setDate(today.getDate() + i);
			const dateString = checkDate.toDateString();

			if (dates.includes(dateString)) {
				currentStreakCount++;
			} else if (i === 0) {
				continue;
			} else {
				break;
			}
		}
		currentStreak = currentStreakCount;

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

		const weekCounts: { [key: string]: number } = {};
		const monthCounts: { [key: string]: number } = {};

		sortedMemos.forEach((memo) => {
			const date = new Date(memo.created_at);
			const weekKey = `KW ${getWeekNumber(date)} ${date.getFullYear()}`;
			const monthKey = date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

			weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
			monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
		});

		const activestWeek = Object.entries(weekCounts).reduce(
			(max, [week, count]) => (count > max.count ? { week, count } : max),
			{ week: 'Keine Daten', count: 0 }
		);

		const activestMonth = Object.entries(monthCounts).reduce(
			(max, [month, count]) => (count > max.count ? { month, count } : max),
			{ month: 'Keine Daten', count: 0 }
		);

		return { currentStreak, longestStreak, activestWeek, activestMonth };
	}

	function getWeekNumber(date: Date) {
		const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
		const dayNum = d.getUTCDay() || 7;
		d.setUTCDate(d.getUTCDate() + 4 - dayNum);
		const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
		return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	}

	function calculateTagAnalytics(memos: any[], memoTags: any[], tags: any[]) {
		const tagUsage: { [key: string]: number } = {};
		const tagMap = new Map(tags.map((tag) => [tag.id, tag]));

		memoTags.forEach((memoTag) => {
			tagUsage[memoTag.tag_id] = (tagUsage[memoTag.tag_id] || 0) + 1;
		});

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

		const memosWithTags = new Set(memoTags.map((mt) => mt.memo_id));
		const memosWithoutTags = memos.filter((memo) => !memosWithTags.has(memo.id)).length;

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
	}
</script>

<svelte:head>
	<title>Statistiken - Memoro</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Content Area -->
	<div class="flex-1 overflow-y-auto">
		<div class="mx-auto max-w-5xl">
			<h1 class="mb-6 text-3xl font-bold">Statistiken</h1>
			{#if loading}
				<StatisticsPageSkeleton />
			{:else if error}
				<!-- Error State -->
				<div class="flex flex-col items-center justify-center py-20">
					<p class="text-center text-theme-secondary">{error}</p>
				</div>
			{:else if statistics}
				<!-- Statistics Cards -->
				<div class="space-y-4 pb-8">
					<!-- Hero Card: Overview (Full Width) -->
					<div class="w-full">
						<OverviewCard
							memoCount={statistics.memoCount}
							memoryCount={statistics.memoryCount}
							totalDuration={statistics.totalAudioDuration}
							totalWords={statistics.totalWordCount}
							currentStreak={statistics.currentStreak}
							averageWordCount={statistics.averageWordCount}
						/>
					</div>

					<!-- Grid: 3 Cards -->
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						<ProductivityCard
							todayStats={statistics.todayStats}
							last30DaysStats={statistics.last30DaysStats}
							currentStreak={statistics.currentStreak}
							longestStreak={statistics.longestStreak}
							activestWeek={statistics.activestWeek}
							activestMonth={statistics.activestMonth}
						/>

						<InsightsCard
							averageAudioDuration={statistics.averageAudioDuration}
							averageWordsPerMinute={statistics.averageWordsPerMinute}
							longestRecording={statistics.longestRecording}
							totalTags={statistics.totalTags}
							assignedTags={statistics.assignedTags}
							memosWithoutTags={statistics.memosWithoutTags}
							averageTagsPerMemo={statistics.averageTagsPerMemo}
							mostUsedTags={statistics.mostUsedTags}
							topLocations={statistics.topLocations}
						/>

						<EngagementCard
							mostViewedMemo={statistics.mostViewedMemo}
							lastViewedMemo={statistics.lastViewedMemo}
							unreadMemos={statistics.unreadMemos}
							memoCount={statistics.memoCount}
						/>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
