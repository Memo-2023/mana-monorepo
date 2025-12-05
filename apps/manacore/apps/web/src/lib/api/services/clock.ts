/**
 * Clock API Service
 *
 * Fetches timers and alarms from local storage for dashboard widgets.
 * Note: Clock app stores data in localStorage, not a backend.
 */

import type { ApiResult } from '../base-client';

/**
 * Timer entity from Clock app
 */
export interface Timer {
	id: string;
	name: string;
	duration: number; // Total duration in seconds
	remaining: number; // Remaining time in seconds
	isRunning: boolean;
	isPaused: boolean;
	createdAt: string;
	completedAt?: string;
}

/**
 * Alarm entity from Clock app
 */
export interface Alarm {
	id: string;
	name: string;
	time: string; // HH:MM format
	days: number[]; // 0-6 (Sunday to Saturday)
	isEnabled: boolean;
	sound?: string;
	createdAt: string;
}

/**
 * Pomodoro session from Clock app
 */
export interface PomodoroSession {
	id: string;
	type: 'work' | 'shortBreak' | 'longBreak';
	duration: number;
	completedAt: string;
}

/**
 * Clock statistics
 */
export interface ClockStats {
	activeTimers: number;
	enabledAlarms: number;
	pomodorosToday: number;
	focusTimeToday: number; // In minutes
}

// LocalStorage keys (matching Clock app's storage)
const STORAGE_KEYS = {
	timers: 'clock-timers',
	alarms: 'clock-alarms',
	pomodoros: 'clock-pomodoros',
};

/**
 * Clock service for dashboard widgets
 *
 * Since Clock stores data in localStorage, this service reads from there.
 */
export const clockService = {
	/**
	 * Get all timers
	 */
	async getTimers(): Promise<ApiResult<Timer[]>> {
		try {
			if (typeof window === 'undefined') {
				return { data: [], error: null };
			}

			const stored = localStorage.getItem(STORAGE_KEYS.timers);
			const timers = stored ? JSON.parse(stored) : [];
			return { data: timers, error: null };
		} catch {
			return { data: null, error: 'Failed to load timers' };
		}
	},

	/**
	 * Get active timers (running or paused with time remaining)
	 */
	async getActiveTimers(): Promise<ApiResult<Timer[]>> {
		const result = await this.getTimers();

		if (result.error || !result.data) {
			return result;
		}

		const activeTimers = result.data.filter((t) => t.isRunning || (t.isPaused && t.remaining > 0));
		return { data: activeTimers, error: null };
	},

	/**
	 * Get all alarms
	 */
	async getAlarms(): Promise<ApiResult<Alarm[]>> {
		try {
			if (typeof window === 'undefined') {
				return { data: [], error: null };
			}

			const stored = localStorage.getItem(STORAGE_KEYS.alarms);
			const alarms = stored ? JSON.parse(stored) : [];
			return { data: alarms, error: null };
		} catch {
			return { data: null, error: 'Failed to load alarms' };
		}
	},

	/**
	 * Get enabled alarms sorted by next trigger time
	 */
	async getEnabledAlarms(): Promise<ApiResult<Alarm[]>> {
		const result = await this.getAlarms();

		if (result.error || !result.data) {
			return result;
		}

		const now = new Date();
		const currentDay = now.getDay();
		const currentTime = now.getHours() * 60 + now.getMinutes();

		const enabledAlarms = result.data
			.filter((a) => a.isEnabled)
			.sort((a, b) => {
				// Parse alarm times
				const [aHours, aMinutes] = a.time.split(':').map(Number);
				const [bHours, bMinutes] = b.time.split(':').map(Number);
				const aTime = aHours * 60 + aMinutes;
				const bTime = bHours * 60 + bMinutes;

				// Sort by time of day
				return aTime - bTime;
			});

		return { data: enabledAlarms, error: null };
	},

	/**
	 * Get clock statistics
	 */
	async getStats(): Promise<ApiResult<ClockStats>> {
		try {
			const [timersResult, alarmsResult] = await Promise.all([
				this.getActiveTimers(),
				this.getEnabledAlarms(),
			]);

			// Get pomodoro sessions for today
			const pomodorosStored = localStorage.getItem(STORAGE_KEYS.pomodoros);
			const pomodoros: PomodoroSession[] = pomodorosStored ? JSON.parse(pomodorosStored) : [];

			const today = new Date().toDateString();
			const todayPomodoros = pomodoros.filter(
				(p) => new Date(p.completedAt).toDateString() === today
			);

			const focusTimeToday = todayPomodoros
				.filter((p) => p.type === 'work')
				.reduce((sum, p) => sum + p.duration, 0);

			return {
				data: {
					activeTimers: timersResult.data?.length || 0,
					enabledAlarms: alarmsResult.data?.length || 0,
					pomodorosToday: todayPomodoros.filter((p) => p.type === 'work').length,
					focusTimeToday: Math.round(focusTimeToday / 60),
				},
				error: null,
			};
		} catch {
			return { data: null, error: 'Failed to load clock stats' };
		}
	},

	/**
	 * Get next alarm time as a formatted string
	 */
	async getNextAlarmTime(): Promise<ApiResult<string | null>> {
		const result = await this.getEnabledAlarms();

		if (result.error || !result.data || result.data.length === 0) {
			return { data: null, error: result.error };
		}

		// Get next alarm
		const nextAlarm = result.data[0];
		return { data: nextAlarm.time, error: null };
	},
};
