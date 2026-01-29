import { Injectable, Logger } from '@nestjs/common';
import {
	Timer,
	Alarm,
	WorldClock,
	TimezoneResult,
	CreateTimerInput,
	CreateAlarmInput,
	CreateWorldClockInput,
	ClockServiceConfig,
	TimeTrackingSummary,
} from './types';

@Injectable()
export class ClockService {
	private readonly logger = new Logger(ClockService.name);
	private readonly apiUrl: string;

	// In-memory token storage per user
	private userTokens: Map<string, string> = new Map();

	constructor(config?: Partial<ClockServiceConfig>) {
		this.apiUrl = config?.apiUrl ?? process.env.CLOCK_API_URL ?? 'http://localhost:3017/api/v1';
		this.logger.log(`Clock API URL: ${this.apiUrl}`);
	}

	// ===== Auth Token Management =====

	setUserToken(userId: string, token: string): void {
		this.userTokens.set(userId, token);
	}

	getUserToken(userId: string): string | undefined {
		return this.userTokens.get(userId);
	}

	// ===== API Helper =====

	private async apiCall<T>(endpoint: string, method: string = 'GET', token?: string, body?: unknown): Promise<T> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
		};

		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		const response = await fetch(`${this.apiUrl}${endpoint}`, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Clock API error: ${response.status} - ${errorText}`);
		}

		return response.json();
	}

	// ===== Health =====

	async checkHealth(): Promise<boolean> {
		try {
			const response = await fetch(`${this.apiUrl.replace('/api/v1', '')}/health`);
			return response.ok;
		} catch {
			return false;
		}
	}

	// ===== Timers =====

	async getTimers(token: string): Promise<Timer[]> {
		return this.apiCall<Timer[]>('/timers', 'GET', token);
	}

	async getTimer(id: string, token: string): Promise<Timer> {
		return this.apiCall<Timer>(`/timers/${id}`, 'GET', token);
	}

	async createTimer(input: CreateTimerInput, token: string): Promise<Timer> {
		return this.apiCall<Timer>('/timers', 'POST', token, {
			durationSeconds: input.durationSeconds,
			label: input.label,
		});
	}

	async startTimer(id: string, token: string): Promise<Timer> {
		return this.apiCall<Timer>(`/timers/${id}/start`, 'POST', token);
	}

	async pauseTimer(id: string, token: string): Promise<Timer> {
		return this.apiCall<Timer>(`/timers/${id}/pause`, 'POST', token);
	}

	async resetTimer(id: string, token: string): Promise<Timer> {
		return this.apiCall<Timer>(`/timers/${id}/reset`, 'POST', token);
	}

	async deleteTimer(id: string, token: string): Promise<void> {
		await this.apiCall<void>(`/timers/${id}`, 'DELETE', token);
	}

	async getRunningTimer(token: string): Promise<Timer | null> {
		const timers = await this.getTimers(token);
		return timers.find((t) => t.status === 'running' || t.status === 'paused') || null;
	}

	// ===== Alarms =====

	async getAlarms(token: string): Promise<Alarm[]> {
		return this.apiCall<Alarm[]>('/alarms', 'GET', token);
	}

	async createAlarm(input: CreateAlarmInput, token: string): Promise<Alarm> {
		return this.apiCall<Alarm>('/alarms', 'POST', token, {
			time: input.time,
			label: input.label,
			enabled: true,
			repeatDays: input.repeatDays,
		});
	}

	async toggleAlarm(id: string, token: string): Promise<Alarm> {
		return this.apiCall<Alarm>(`/alarms/${id}/toggle`, 'PATCH', token);
	}

	async deleteAlarm(id: string, token: string): Promise<void> {
		await this.apiCall<void>(`/alarms/${id}`, 'DELETE', token);
	}

	// ===== World Clocks =====

	async getWorldClocks(token: string): Promise<WorldClock[]> {
		return this.apiCall<WorldClock[]>('/world-clocks', 'GET', token);
	}

	async addWorldClock(input: CreateWorldClockInput, token: string): Promise<WorldClock> {
		return this.apiCall<WorldClock>('/world-clocks', 'POST', token, {
			timezone: input.timezone,
			cityName: input.cityName,
		});
	}

	async deleteWorldClock(id: string, token: string): Promise<void> {
		await this.apiCall<void>(`/world-clocks/${id}`, 'DELETE', token);
	}

	// ===== Timezone Search =====

	async searchTimezones(query: string): Promise<TimezoneResult[]> {
		return this.apiCall<TimezoneResult[]>(`/timezones/search?q=${encodeURIComponent(query)}`);
	}

	// ===== Time Tracking Summary =====

	async getTodayTracked(token: string): Promise<TimeTrackingSummary> {
		// This would aggregate timer data for today
		// For now, return a placeholder - implement based on actual API
		const timers = await this.getTimers(token);
		const finishedToday = timers.filter((t) => {
			if (t.status !== 'finished') return false;
			const finishedAt = new Date(t.updatedAt);
			const today = new Date();
			return finishedAt.toDateString() === today.toDateString();
		});

		const totalMinutes = finishedToday.reduce((sum, t) => sum + Math.floor(t.durationSeconds / 60), 0);

		return {
			totalMinutes,
			sessions: finishedToday.length,
		};
	}

	// ===== Parsing Utilities =====

	/**
	 * Parse duration string to seconds
	 * Supports: "25m", "1h30m", "90s", "25" (assumes minutes)
	 */
	parseDuration(input: string): number | null {
		let totalSeconds = 0;

		// Match hours
		const hoursMatch = input.match(/(\d+)\s*h/i);
		if (hoursMatch) {
			totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
		}

		// Match minutes
		const minutesMatch = input.match(/(\d+)\s*m(?:in)?/i);
		if (minutesMatch) {
			totalSeconds += parseInt(minutesMatch[1], 10) * 60;
		}

		// Match seconds
		const secondsMatch = input.match(/(\d+)\s*s(?:ec)?/i);
		if (secondsMatch) {
			totalSeconds += parseInt(secondsMatch[1], 10);
		}

		// If just a number, assume minutes
		if (totalSeconds === 0) {
			const justNumber = input.match(/^(\d+)$/);
			if (justNumber) {
				totalSeconds = parseInt(justNumber[1], 10) * 60;
			}
		}

		return totalSeconds > 0 ? totalSeconds : null;
	}

	/**
	 * Parse time string to HH:MM:SS
	 * Supports: "14:30", "9:00", "14 Uhr 30"
	 */
	parseAlarmTime(input: string): string | null {
		// Try HH:MM format
		let match = input.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
		if (match) {
			const hours = parseInt(match[1], 10);
			const minutes = parseInt(match[2], 10);
			const seconds = match[3] ? parseInt(match[3], 10) : 0;

			if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
				return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
			}
		}

		// Try "X Uhr Y" format (German)
		match = input.match(/(\d{1,2})\s*uhr(?:\s*(\d{1,2}))?/i);
		if (match) {
			const hours = parseInt(match[1], 10);
			const minutes = match[2] ? parseInt(match[2], 10) : 0;

			if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
				return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
			}
		}

		return null;
	}

	/**
	 * Format seconds to human readable
	 */
	formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		const parts: string[] = [];
		if (hours > 0) parts.push(`${hours}h`);
		if (minutes > 0) parts.push(`${minutes}m`);
		if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

		return parts.join(' ');
	}
}
