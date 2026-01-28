import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface UmamiStats {
	pageviews: { value: number; change: number };
	visitors: { value: number; change: number };
	visits: { value: number; change: number };
	bounces: { value: number; change: number };
	totaltime: { value: number; change: number };
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
		await this.authenticate();
	}

	private async authenticate(): Promise<void> {
		try {
			const response = await fetch(`${this.apiUrl}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: this.username,
					password: this.password,
				}),
			});

			if (!response.ok) {
				throw new Error(`Auth failed: ${response.status}`);
			}

			const data = await response.json();
			this.accessToken = data.token;
			this.logger.log('Umami authenticated successfully');
		} catch (error) {
			this.logger.error('Failed to authenticate with Umami:', error);
		}
	}

	private async request<T>(endpoint: string): Promise<T | null> {
		if (!this.accessToken) {
			await this.authenticate();
		}

		try {
			const response = await fetch(`${this.apiUrl}${endpoint}`, {
				headers: {
					Authorization: `Bearer ${this.accessToken}`,
				},
			});

			if (response.status === 401) {
				await this.authenticate();
				return this.request(endpoint);
			}

			if (!response.ok) {
				throw new Error(`Request failed: ${response.status}`);
			}

			return response.json();
		} catch (error) {
			this.logger.error(`Umami request failed: ${endpoint}`, error);
			return null;
		}
	}

	async getWebsites(): Promise<{ id: string; name: string; domain: string }[]> {
		const data = await this.request<{ data: { id: string; name: string; domain: string }[] }>(
			'/api/websites'
		);
		return data?.data || [];
	}

	async getStats(websiteId: string, startAt: number, endAt: number): Promise<UmamiStats | null> {
		return this.request<UmamiStats>(
			`/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`
		);
	}

	async getRealtime(websiteId: string): Promise<UmamiRealtime | null> {
		return this.request<UmamiRealtime>(`/api/websites/${websiteId}/active`);
	}

	async getPageviews(
		websiteId: string,
		startAt: number,
		endAt: number,
		unit: 'hour' | 'day' | 'month' = 'day'
	): Promise<{ pageviews: { x: string; y: number }[]; sessions: { x: string; y: number }[] } | null> {
		return this.request(
			`/api/websites/${websiteId}/pageviews?startAt=${startAt}&endAt=${endAt}&unit=${unit}`
		);
	}
}
