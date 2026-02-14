import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface UmamiStats {
	pageviews: { value: number; change: number };
	visitors: { value: number; change: number };
	visits: { value: number; change: number };
	bounces: { value: number; change: number };
	totaltime: { value: number; change: number };
}

// Raw API response format from Umami
interface UmamiStatsRaw {
	pageviews: number;
	visitors: number;
	visits: number;
	bounces: number;
	totaltime: number;
	comparison: {
		pageviews: number;
		visitors: number;
		visits: number;
		bounces: number;
		totaltime: number;
	};
}

interface UmamiRealtime {
	pageviews: number;
	visitors: number;
	countries: { name: string; count: number }[];
}

@Injectable()
export class UmamiService implements OnModuleInit {
	private readonly logger = new Logger(UmamiService.name);
	private readonly apiUrl: string;
	private readonly username: string;
	private readonly password: string;
	private accessToken: string | null = null;

	constructor(private configService: ConfigService) {
		this.apiUrl = this.configService.get<string>('umami.apiUrl') || 'http://localhost:3000';
		this.username = this.configService.get<string>('umami.username') || 'admin';
		this.password = this.configService.get<string>('umami.password') || '';
	}

	async onModuleInit() {
		try {
			await this.authenticate();
		} catch (error) {
			this.logger.warn('Initial Umami auth failed, will retry on first request');
		}
	}

	private async authenticate(): Promise<void> {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			const response = await fetch(`${this.apiUrl}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: this.username,
					password: this.password,
				}),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				throw new Error(`Umami auth failed: ${response.status}`);
			}

			const data = await response.json();
			this.accessToken = data.token;
			this.logger.log('Umami authenticated successfully');
		} catch (error) {
			this.logger.error('Failed to authenticate with Umami:', error);
			this.accessToken = null;
			throw error instanceof Error ? error : new Error('Umami authentication failed');
		}
	}

	private async request<T>(endpoint: string, retryCount = 0): Promise<T | null> {
		if (!this.accessToken) {
			await this.authenticate();
		}

		if (!this.accessToken) {
			throw new Error('Umami nicht authentifiziert - prüfe UMAMI_API_URL und Credentials');
		}

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

			const response = await fetch(`${this.apiUrl}${endpoint}`, {
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (response.status === 401 && retryCount < 1) {
				this.accessToken = null;
				await this.authenticate();
				return this.request(endpoint, retryCount + 1);
			}

			if (!response.ok) {
				throw new Error(`Umami API Fehler: ${response.status}`);
			}

			return response.json();
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				this.logger.error(`Umami request timeout: ${endpoint}`);
				throw new Error('Umami API Timeout - Server nicht erreichbar?');
			}
			this.logger.error(`Umami request failed: ${endpoint}`, error);
			throw error;
		}
	}

	async getWebsites(): Promise<{ id: string; name: string; domain: string }[]> {
		const data = await this.request<{ data: { id: string; name: string; domain: string }[] }>(
			'/api/websites'
		);
		return data?.data || [];
	}

	async getStats(websiteId: string, startAt: number, endAt: number): Promise<UmamiStats | null> {
		const raw = await this.request<UmamiStatsRaw>(
			`/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`
		);

		if (!raw) return null;

		// Transform raw API response to expected format
		const calcChange = (current: number, previous: number): number => {
			if (previous === 0) return current > 0 ? 100 : 0;
			return Math.round(((current - previous) / previous) * 100);
		};

		return {
			pageviews: {
				value: raw.pageviews,
				change: calcChange(raw.pageviews, raw.comparison?.pageviews ?? 0),
			},
			visitors: {
				value: raw.visitors,
				change: calcChange(raw.visitors, raw.comparison?.visitors ?? 0),
			},
			visits: {
				value: raw.visits,
				change: calcChange(raw.visits, raw.comparison?.visits ?? 0),
			},
			bounces: {
				value: raw.bounces,
				change: calcChange(raw.bounces, raw.comparison?.bounces ?? 0),
			},
			totaltime: {
				value: raw.totaltime,
				change: calcChange(raw.totaltime, raw.comparison?.totaltime ?? 0),
			},
		};
	}

	async getRealtime(websiteId: string): Promise<UmamiRealtime | null> {
		return this.request<UmamiRealtime>(`/api/websites/${websiteId}/active`);
	}

	async getPageviews(
		websiteId: string,
		startAt: number,
		endAt: number,
		unit: 'hour' | 'day' | 'month' = 'day'
	): Promise<{
		pageviews: { x: string; y: number }[];
		sessions: { x: string; y: number }[];
	} | null> {
		return this.request(
			`/api/websites/${websiteId}/pageviews?startAt=${startAt}&endAt=${endAt}&unit=${unit}`
		);
	}
}
