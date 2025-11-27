import { create } from 'zustand';
import { apiClient } from '../services/apiClient';

export interface DailyProgress {
	date: string; // YYYY-MM-DD
	cards_studied: number;
	correct_answers: number;
	total_time_minutes: number;
	sessions_count: number;
	new_cards: number;
	reviewed_cards: number;
}

export interface StreakInfo {
	current_streak: number;
	longest_streak: number;
	last_study_date: string;
	total_study_days: number;
}

export interface DeckProgress {
	deck_id: string;
	deck_name: string;
	total_cards: number;
	mastered_cards: number; // ease_factor >= 2.5 && interval >= 21
	learning_cards: number;
	new_cards: number;
	average_ease_factor: number;
	completion_percentage: number;
}

export interface Statistics {
	total_cards_studied: number;
	total_study_time_minutes: number;
	average_accuracy: number;
	best_accuracy_day: string;
	most_studied_day: string;
	favorite_time_of_day: string;
}

// Map backend session format to local format
function mapSessionFromApi(apiSession: any) {
	return {
		id: apiSession.id,
		user_id: apiSession.userId,
		deck_id: apiSession.deckId,
		started_at: apiSession.startedAt,
		ended_at: apiSession.endedAt,
		total_cards: apiSession.totalCards || 0,
		completed_cards: apiSession.completedCards || 0,
		correct_answers: apiSession.correctCards || 0,
		time_spent_seconds: apiSession.timeSpentSeconds || 0,
		mode: 'all',
	};
}

interface ProgressState {
	// Data
	dailyProgress: Map<string, DailyProgress>; // date -> progress
	streakInfo: StreakInfo | null;
	deckProgress: DeckProgress[];
	statistics: Statistics | null;

	// UI State
	isLoading: boolean;
	error: string | null;
	selectedPeriod: 'week' | 'month' | 'year';

	// Actions
	fetchDailyProgress: (userId: string, startDate: Date, endDate: Date) => Promise<void>;
	fetchStreakInfo: (userId: string) => Promise<void>;
	fetchDeckProgress: (userId: string) => Promise<void>;
	fetchStatistics: (userId: string) => Promise<void>;
	calculateStreak: (sessions: any[]) => StreakInfo;
	updateTodayProgress: (sessionData: any) => void;

	// Utilities
	getHeatmapData: () => { date: string; count: number }[];
	getChartData: (type: 'accuracy' | 'cards' | 'time') => any[];
	setSelectedPeriod: (period: 'week' | 'month' | 'year') => void;
	clearError: () => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
	// Initial state
	dailyProgress: new Map(),
	streakInfo: null,
	deckProgress: [],
	statistics: null,
	isLoading: false,
	error: null,
	selectedPeriod: 'week',

	fetchDailyProgress: async (_userId: string, startDate: Date, endDate: Date) => {
		try {
			set({ isLoading: true, error: null });

			// Fetch study sessions in date range via API
			const response = await apiClient.getStudySessionsByDateRange(
				startDate.toISOString(),
				endDate.toISOString()
			);

			if (response.error) throw new Error(response.error);

			const sessions = (response.data?.sessions || []).map(mapSessionFromApi);

			// Group sessions by date
			const progressMap = new Map<string, DailyProgress>();

			sessions.forEach((session: any) => {
				const date = new Date(session.started_at).toISOString().split('T')[0];
				const existing = progressMap.get(date) || {
					date,
					cards_studied: 0,
					correct_answers: 0,
					total_time_minutes: 0,
					sessions_count: 0,
					new_cards: 0,
					reviewed_cards: 0,
				};

				const sessionDuration = session.ended_at
					? (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000
					: (session.time_spent_seconds || 0) / 60;

				progressMap.set(date, {
					...existing,
					cards_studied: existing.cards_studied + (session.completed_cards || 0),
					correct_answers: existing.correct_answers + (session.correct_answers || 0),
					total_time_minutes: existing.total_time_minutes + Math.round(sessionDuration),
					sessions_count: existing.sessions_count + 1,
					new_cards:
						existing.new_cards + (session.mode === 'new' ? session.completed_cards || 0 : 0),
					reviewed_cards:
						existing.reviewed_cards +
						(session.mode === 'review' ? session.completed_cards || 0 : 0),
				});
			});

			set({ dailyProgress: progressMap });

			// Also calculate streak from sessions
			if (sessions && sessions.length > 0) {
				const streakInfo = get().calculateStreak(sessions);
				set({ streakInfo });
			}
		} catch (error: any) {
			set({ error: error.message });
			console.error('Error fetching daily progress:', error);
		} finally {
			set({ isLoading: false });
		}
	},

	calculateStreak: (sessions: any[]) => {
		if (!sessions || sessions.length === 0) {
			return {
				current_streak: 0,
				longest_streak: 0,
				last_study_date: '',
				total_study_days: 0,
			};
		}

		// Get unique study dates
		const studyDates = new Set(
			sessions.map((s) => new Date(s.started_at).toISOString().split('T')[0])
		);
		const sortedDates = Array.from(studyDates).sort();

		// Calculate streaks
		let currentStreak = 0;
		let longestStreak = 0;
		let tempStreak = 1;

		const today = new Date().toISOString().split('T')[0];
		const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

		// Check if studied today or yesterday for current streak
		const lastStudyDate = sortedDates[sortedDates.length - 1];
		if (lastStudyDate === today || lastStudyDate === yesterday) {
			currentStreak = 1;

			// Count backwards from last study date
			for (let i = sortedDates.length - 2; i >= 0; i--) {
				const prevDate = new Date(sortedDates[i]);
				const currDate = new Date(sortedDates[i + 1]);
				const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / 86400000);

				if (diffDays === 1) {
					currentStreak++;
				} else {
					break;
				}
			}
		}

		// Calculate longest streak
		for (let i = 1; i < sortedDates.length; i++) {
			const prevDate = new Date(sortedDates[i - 1]);
			const currDate = new Date(sortedDates[i]);
			const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / 86400000);

			if (diffDays === 1) {
				tempStreak++;
			} else {
				longestStreak = Math.max(longestStreak, tempStreak);
				tempStreak = 1;
			}
		}
		longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

		return {
			current_streak: currentStreak,
			longest_streak: longestStreak,
			last_study_date: lastStudyDate,
			total_study_days: studyDates.size,
		};
	},

	fetchStreakInfo: async (_userId: string) => {
		try {
			// Fetch all study sessions for streak calculation
			const response = await apiClient.getStudySessions();

			if (response.error) throw new Error(response.error);

			const sessions = (response.data?.sessions || []).map(mapSessionFromApi);
			const streakInfo = get().calculateStreak(sessions);
			set({ streakInfo });
		} catch (error: any) {
			console.error('Error fetching streak info:', error);
		}
	},

	fetchDeckProgress: async (_userId: string) => {
		try {
			set({ isLoading: true });

			// Fetch all decks
			const decksResponse = await apiClient.getDecks();
			if (decksResponse.error) throw new Error(decksResponse.error);

			// Fetch all card progress
			const progressResponse = await apiClient.getCardProgress();
			if (progressResponse.error) throw new Error(progressResponse.error);

			const decks = decksResponse.data?.decks || [];
			const cardProgressList = progressResponse.data?.progress || [];

			// Calculate progress per deck
			const deckProgressList: DeckProgress[] = [];

			for (const deck of decks) {
				// Get cards count for this deck
				const cardsResponse = await apiClient.getDeckCards(deck.id);
				const totalCards = cardsResponse.data?.count || 0;

				// Filter progress for this deck's cards
				const deckCards = cardsResponse.data?.cards || [];
				const deckCardIds = new Set(deckCards.map((c: any) => c.id));
				const deckCardProgress = cardProgressList.filter((cp: any) => deckCardIds.has(cp.cardId));

				const mastered = deckCardProgress.filter(
					(cp: any) => cp.easeFactor >= 2.5 && cp.interval >= 21
				).length;

				const learning = deckCardProgress.filter((cp: any) => cp.status === 'learning').length;

				const newCards = deckCardProgress.filter((cp: any) => cp.status === 'new').length;

				const avgEaseFactor =
					deckCardProgress.length > 0
						? deckCardProgress.reduce((sum: number, cp: any) => sum + (cp.easeFactor || 2.5), 0) /
							deckCardProgress.length
						: 2.5;

				const studiedCards = deckCardProgress.length;

				deckProgressList.push({
					deck_id: deck.id,
					deck_name: deck.title,
					total_cards: totalCards,
					mastered_cards: mastered,
					learning_cards: learning,
					new_cards: totalCards - studiedCards,
					average_ease_factor: Math.round(avgEaseFactor * 100) / 100,
					completion_percentage: totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0,
				});
			}

			set({ deckProgress: deckProgressList });
		} catch (error: any) {
			console.error('Error fetching deck progress:', error);
		} finally {
			set({ isLoading: false });
		}
	},

	fetchStatistics: async (_userId: string) => {
		try {
			// Fetch all sessions for statistics
			const response = await apiClient.getStudySessions();

			if (response.error) throw new Error(response.error);

			const sessions = (response.data?.sessions || []).map(mapSessionFromApi);
			if (!sessions || sessions.length === 0) return;

			// Calculate statistics
			let totalCards = 0;
			let totalCorrect = 0;
			let totalTime = 0;
			let bestAccuracy = 0;
			let bestAccuracyDay = '';
			let mostCards = 0;
			let mostStudiedDay = '';

			const timeOfDayCount = new Map<number, number>();

			sessions.forEach((session: any) => {
				totalCards += session.completed_cards || 0;
				totalCorrect += session.correct_answers || 0;

				if (session.ended_at) {
					const duration =
						(new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60000;
					totalTime += duration;
				} else if (session.time_spent_seconds) {
					totalTime += session.time_spent_seconds / 60;
				}

				// Track accuracy
				if (session.completed_cards > 0) {
					const accuracy = (session.correct_answers / session.completed_cards) * 100;
					if (accuracy > bestAccuracy) {
						bestAccuracy = accuracy;
						bestAccuracyDay = new Date(session.started_at).toISOString().split('T')[0];
					}
				}

				// Track most studied day
				const date = new Date(session.started_at).toISOString().split('T')[0];
				if (session.completed_cards > mostCards) {
					mostCards = session.completed_cards;
					mostStudiedDay = date;
				}

				// Track time of day
				const hour = new Date(session.started_at).getHours();
				timeOfDayCount.set(hour, (timeOfDayCount.get(hour) || 0) + 1);
			});

			// Find favorite time of day
			let favoriteHour = 0;
			let maxCount = 0;
			timeOfDayCount.forEach((count, hour) => {
				if (count > maxCount) {
					maxCount = count;
					favoriteHour = hour;
				}
			});

			const favoriteTimeOfDay =
				favoriteHour < 6
					? 'Nacht (0-6 Uhr)'
					: favoriteHour < 12
						? 'Morgen (6-12 Uhr)'
						: favoriteHour < 18
							? 'Nachmittag (12-18 Uhr)'
							: 'Abend (18-24 Uhr)';

			set({
				statistics: {
					total_cards_studied: totalCards,
					total_study_time_minutes: Math.round(totalTime),
					average_accuracy: totalCards > 0 ? Math.round((totalCorrect / totalCards) * 100) : 0,
					best_accuracy_day: bestAccuracyDay,
					most_studied_day: mostStudiedDay,
					favorite_time_of_day: favoriteTimeOfDay,
				},
			});
		} catch (error: any) {
			console.error('Error fetching statistics:', error);
		}
	},

	updateTodayProgress: (sessionData: any) => {
		const today = new Date().toISOString().split('T')[0];
		const dailyProgress = get().dailyProgress;
		const existing = dailyProgress.get(today) || {
			date: today,
			cards_studied: 0,
			correct_answers: 0,
			total_time_minutes: 0,
			sessions_count: 0,
			new_cards: 0,
			reviewed_cards: 0,
		};

		dailyProgress.set(today, {
			...existing,
			cards_studied: existing.cards_studied + sessionData.completed_cards,
			correct_answers: existing.correct_answers + sessionData.correct_answers,
			sessions_count: existing.sessions_count + 1,
		});

		set({ dailyProgress: new Map(dailyProgress) });
	},

	getHeatmapData: () => {
		const dailyProgress = get().dailyProgress;
		const data: { date: string; count: number }[] = [];

		dailyProgress.forEach((progress, date) => {
			data.push({
				date,
				count: progress.cards_studied,
			});
		});

		return data;
	},

	getChartData: (type: 'accuracy' | 'cards' | 'time') => {
		const dailyProgress = get().dailyProgress;
		const period = get().selectedPeriod;
		const data: any[] = [];

		// Get date range based on period
		const endDate = new Date();
		const startDate = new Date();

		switch (period) {
			case 'week':
				startDate.setDate(endDate.getDate() - 7);
				break;
			case 'month':
				startDate.setDate(endDate.getDate() - 30);
				break;
			case 'year':
				startDate.setDate(endDate.getDate() - 365);
				break;
		}

		// Generate data points
		const current = new Date(startDate);
		while (current <= endDate) {
			const dateStr = current.toISOString().split('T')[0];
			const progress = dailyProgress.get(dateStr);

			let value = 0;
			switch (type) {
				case 'accuracy':
					value =
						progress && progress.cards_studied > 0
							? Math.round((progress.correct_answers / progress.cards_studied) * 100)
							: 0;
					break;
				case 'cards':
					value = progress?.cards_studied || 0;
					break;
				case 'time':
					value = progress?.total_time_minutes || 0;
					break;
			}

			data.push({
				date: dateStr,
				value,
				label: current.toLocaleDateString('de-DE', {
					day: 'numeric',
					month: 'short',
				}),
			});

			current.setDate(current.getDate() + 1);
		}

		return data;
	},

	setSelectedPeriod: (period: 'week' | 'month' | 'year') => {
		set({ selectedPeriod: period });
	},

	clearError: () => set({ error: null }),
}));
