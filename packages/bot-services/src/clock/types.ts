/**
 * Clock service types
 */

/**
 * Timer entity
 */
export interface Timer {
	id: string;
	userId: string;
	label: string | null;
	durationSeconds: number;
	remainingSeconds: number;
	status: 'idle' | 'running' | 'paused' | 'finished';
	startedAt: string | null;
	pausedAt: string | null;
	sound: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Alarm entity
 */
export interface Alarm {
	id: string;
	userId: string;
	label: string | null;
	time: string; // HH:MM:SS
	enabled: boolean;
	repeatDays: number[]; // 0-6, Sunday = 0
	snoozeMinutes: number;
	sound: string;
	vibrate: boolean;
	createdAt: string;
	updatedAt: string;
}

/**
 * World clock entity
 */
export interface WorldClock {
	id: string;
	userId: string;
	timezone: string;
	cityName: string;
	sortOrder: number;
	createdAt: string;
}

/**
 * Timezone search result
 */
export interface TimezoneResult {
	timezone: string;
	city: string;
}

/**
 * Create timer input
 */
export interface CreateTimerInput {
	durationSeconds: number;
	label?: string | null;
}

/**
 * Create alarm input
 */
export interface CreateAlarmInput {
	time: string; // HH:MM:SS
	label?: string | null;
	repeatDays?: number[];
}

/**
 * Create world clock input
 */
export interface CreateWorldClockInput {
	timezone: string;
	cityName: string;
}

/**
 * Clock service configuration
 */
export interface ClockServiceConfig {
	apiUrl: string;
}

/**
 * Time tracking summary
 */
export interface TimeTrackingSummary {
	totalMinutes: number;
	sessions: number;
}
