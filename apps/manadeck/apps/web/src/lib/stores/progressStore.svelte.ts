import type { StudySession, CardProgress, DailyProgress } from '$lib/types/study';
import { PUBLIC_API_URL } from '$env/static/public';
import { authService } from '$lib/auth';

// Svelte 5 runes-based progress store
let studySessions = $state<StudySession[]>([]);
let cardProgress = $state<CardProgress[]>([]);
let statistics = $state<Statistics | null>(null);
let streakInfo = $state<StreakInfo | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);

interface Statistics {
	totalCardsStudied: number;
	totalStudyTimeMinutes: number;
	averageAccuracy: number;
	totalSessions: number;
}

interface StreakInfo {
	currentStreak: number;
	longestStreak: number;
	lastStudyDate: string;
	totalStudyDays: number;
}

/**
 * Helper to make authenticated API requests
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const appToken = await authService.getAppToken();
	if (!appToken) {
		throw new Error('Not authenticated');
	}

	const response = await fetch(`${PUBLIC_API_URL}${endpoint}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${appToken}`,
			...options.headers,
		},
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.message || `API error: ${response.status}`);
	}

	return response.json();
}

/**
 * Map backend session to frontend format
 */
function mapSessionFromApi(apiSession: any): StudySession {
	return {
		id: apiSession.id,
		deck_id: apiSession.deckId,
		user_id: apiSession.userId,
		mode: 'all',
		total_cards: apiSession.totalCards || 0,
		completed_cards: apiSession.completedCards || 0,
		correct_cards: apiSession.correctCards || 0,
		started_at: apiSession.startedAt,
		completed_at: apiSession.endedAt,
		time_spent_seconds: apiSession.timeSpentSeconds || 0,
	};
}

/**
 * Map backend card progress to frontend format
 */
function mapProgressFromApi(apiProgress: any): CardProgress {
	return {
		id: apiProgress.id,
		user_id: apiProgress.userId,
		card_id: apiProgress.cardId,
		ease_factor: apiProgress.easeFactor,
		interval: apiProgress.interval,
		repetitions: apiProgress.repetitions,
		last_reviewed: apiProgress.lastReviewed,
		next_review: apiProgress.nextReview,
		status: apiProgress.status || 'new',
		created_at: apiProgress.createdAt,
		updated_at: apiProgress.updatedAt,
	};
}

/**
 * Calculate streak from sessions
 */
function calculateStreak(sessions: StudySession[]): StreakInfo {
	if (!sessions || sessions.length === 0) {
		return {
			currentStreak: 0,
			longestStreak: 0,
			lastStudyDate: '',
			totalStudyDays: 0,
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

	const lastStudyDate = sortedDates[sortedDates.length - 1];
	if (lastStudyDate === today || lastStudyDate === yesterday) {
		currentStreak = 1;

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
		currentStreak,
		longestStreak,
		lastStudyDate,
		totalStudyDays: studyDates.size,
	};
}

export const progressStore = {
	get studySessions() {
		return studySessions;
	},
	get cardProgress() {
		return cardProgress;
	},
	get statistics() {
		return statistics;
	},
	get streakInfo() {
		return streakInfo;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	/**
	 * Fetch all study sessions
	 */
	async fetchStudySessions() {
		loading = true;
		error = null;

		try {
			const response = await apiRequest<{ sessions: any[]; count: number }>(
				'/v1/api/study-sessions'
			);
			studySessions = (response.sessions || []).map(mapSessionFromApi);

			// Calculate streak
			streakInfo = calculateStreak(studySessions);
		} catch (err: any) {
			error = err.message || 'Failed to fetch study sessions';
			console.error('Fetch study sessions error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Fetch study session statistics
	 */
	async fetchStatistics() {
		loading = true;
		error = null;

		try {
			const [sessionsResponse, progressStatsResponse] = await Promise.all([
				apiRequest<{ stats: any }>('/v1/api/study-sessions/stats'),
				apiRequest<{ stats: any }>('/v1/api/progress/stats'),
			]);

			const sessionStats = sessionsResponse.stats || {};
			const progressStats = progressStatsResponse.stats || {};

			statistics = {
				totalCardsStudied: sessionStats.totalCardsStudied || 0,
				totalStudyTimeMinutes: Math.round((sessionStats.totalTimeSeconds || 0) / 60),
				averageAccuracy:
					sessionStats.totalCardsStudied > 0
						? Math.round(
								((sessionStats.totalCorrectCards || 0) / sessionStats.totalCardsStudied) * 100
							)
						: 0,
				totalSessions: sessionStats.totalSessions || 0,
			};
		} catch (err: any) {
			error = err.message || 'Failed to fetch statistics';
			console.error('Fetch statistics error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Fetch card progress for a deck
	 */
	async fetchDeckProgress(deckId: string) {
		loading = true;
		error = null;

		try {
			const response = await apiRequest<{ progress: any[]; count: number }>(
				`/v1/api/progress/deck/${deckId}`
			);
			cardProgress = (response.progress || []).map(mapProgressFromApi);
		} catch (err: any) {
			error = err.message || 'Failed to fetch deck progress';
			console.error('Fetch deck progress error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Fetch due cards
	 */
	async fetchDueCards(deckId?: string) {
		loading = true;
		error = null;

		try {
			const endpoint = deckId ? `/v1/api/progress/deck/${deckId}/due` : '/v1/api/progress/due';
			const response = await apiRequest<{ progress: any[]; count: number }>(endpoint);
			return (response.progress || []).map(mapProgressFromApi);
		} catch (err: any) {
			error = err.message || 'Failed to fetch due cards';
			console.error('Fetch due cards error:', err);
			return [];
		} finally {
			loading = false;
		}
	},

	/**
	 * Get progress summary for a deck
	 */
	getDeckProgressSummary(deckId: string) {
		const deckProgress = cardProgress.filter((p) => {
			// This requires cards info - for now return all progress
			return true;
		});

		const total = deckProgress.length;
		const mastered = deckProgress.filter((p) => p.ease_factor >= 2.5 && p.interval >= 21).length;
		const learning = deckProgress.filter((p) => p.status === 'learning').length;
		const newCards = deckProgress.filter((p) => p.status === 'new').length;
		const dueNow = deckProgress.filter((p) => {
			if (!p.next_review) return false;
			return new Date(p.next_review) <= new Date();
		}).length;

		return {
			total,
			mastered,
			learning,
			newCards,
			dueNow,
		};
	},

	/**
	 * Clear error
	 */
	clearError() {
		error = null;
	},
};
