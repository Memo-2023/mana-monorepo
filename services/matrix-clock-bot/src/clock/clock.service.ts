import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

export interface Alarm {
	id: string;
	userId: string;
	label: string | null;
	time: string;
	enabled: boolean;
	repeatDays: number[];
	snoozeMinutes: number;
	sound: string;
	vibrate: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface WorldClock {
	id: string;
	userId: string;
	timezone: string;
	cityName: string;
	sortOrder: number;
	createdAt: string;
}

export interface TimezoneResult {
	timezone: string;
	city: string;
}

@Injectable()
export class ClockService {
	private readonly logger = new Logger(ClockService.name);
	private readonly apiUrl: string;

	// In-memory token storage per Matrix user
	private userTokens: Map<string, string> = new Map();

	constructor(private configService: ConfigService) {
		this.apiUrl = this.configService.get<string>('clock.apiUrl') || 'http://localhost:3017/api/v1';
		this.logger.log(`Clock API URL: ${this.apiUrl}`);
	}

	setUserToken(matrixUserId: string, token: string) {
		this.userTokens.set(matrixUserId, token);
	}

	getUserToken(matrixUserId: string): string | undefined {
		return this.userTokens.get(matrixUserId);
	}

	private async apiCall<T>(
		endpoint: string,
		method: string = 'GET',
		token?: string,
		body?: unknown
	): Promise<T> {
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

	// Timer operations
	async getTimers(token: string): Promise<Timer[]> {
		return this.apiCall<Timer[]>('/timers', 'GET', token);
	}

	async getTimer(id: string, token: string): Promise<Timer> {
		return this.apiCall<Timer>(`/timers/${id}`, 'GET', token);
	}

	async createTimer(durationSeconds: number, label: string | null, token: string): Promise<Timer> {
		return this.apiCall<Timer>('/timers', 'POST', token, {
			durationSeconds,
			label,
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

	// Alarm operations
	async getAlarms(token: string): Promise<Alarm[]> {
		return this.apiCall<Alarm[]>('/alarms', 'GET', token);
	}

	async createAlarm(time: string, label: string | null, token: string): Promise<Alarm> {
		return this.apiCall<Alarm>('/alarms', 'POST', token, {
			time,
			label,
			enabled: true,
		});
	}

	async toggleAlarm(id: string, token: string): Promise<Alarm> {
		return this.apiCall<Alarm>(`/alarms/${id}/toggle`, 'PATCH', token);
	}

	async deleteAlarm(id: string, token: string): Promise<void> {
		await this.apiCall<void>(`/alarms/${id}`, 'DELETE', token);
	}

	// World Clock operations
	async getWorldClocks(token: string): Promise<WorldClock[]> {
		return this.apiCall<WorldClock[]>('/world-clocks', 'GET', token);
	}

	async addWorldClock(timezone: string, cityName: string, token: string): Promise<WorldClock> {
		return this.apiCall<WorldClock>('/world-clocks', 'POST', token, {
			timezone,
			cityName,
		});
	}

	async deleteWorldClock(id: string, token: string): Promise<void> {
		await this.apiCall<void>(`/world-clocks/${id}`, 'DELETE', token);
	}

	// Timezone search (public, no auth needed)
	async searchTimezones(query: string): Promise<TimezoneResult[]> {
		return this.apiCall<TimezoneResult[]>(`/timezones/search?q=${encodeURIComponent(query)}`);
	}

	// Health check
	async checkHealth(): Promise<boolean> {
		try {
			const response = await fetch(`${this.apiUrl.replace('/api/v1', '')}/health`);
			return response.ok;
		} catch {
			return false;
		}
	}

	// Utility: Find running timer
	async getRunningTimer(token: string): Promise<Timer | null> {
		const timers = await this.getTimers(token);
		return timers.find((t) => t.status === 'running' || t.status === 'paused') || null;
	}

	// Utility: Parse duration string to seconds
	parseDuration(input: string): number | null {
		let totalSeconds = 0;

		// Match hours: 1h, 1 h, 1 stunde, 1 stunden, 1 hour, 1 hours
		const hoursMatch = input.match(/(\d+)\s*(?:h|stunde[n]?|hour[s]?)\b/i);
		if (hoursMatch) {
			totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
		}

		// Match minutes: 25m, 25 m, 25min, 25 min, 25 minuten, 25 minute, 25 minutes
		const minutesMatch = input.match(/(\d+)\s*(?:m|min|minute[n]?|minutes?)\b/i);
		if (minutesMatch) {
			totalSeconds += parseInt(minutesMatch[1], 10) * 60;
		}

		// Match seconds: 30s, 30 s, 30sec, 30 sec, 30 sekunden, 30 seconds
		const secondsMatch = input.match(/(\d+)\s*(?:s|sec|sekunde[n]?|seconds?)\b/i);
		if (secondsMatch) {
			totalSeconds += parseInt(secondsMatch[1], 10);
		}

		// If just a number (with optional whitespace), assume minutes
		if (totalSeconds === 0) {
			const justNumber = input.trim().match(/^(\d+)$/);
			if (justNumber) {
				totalSeconds = parseInt(justNumber[1], 10) * 60;
			}
		}

		return totalSeconds > 0 ? totalSeconds : null;
	}

	// Utility: Parse time string to HH:MM:SS
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

	// Utility: Format seconds to human readable
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
