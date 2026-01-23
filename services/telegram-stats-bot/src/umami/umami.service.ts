import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WEBSITE_IDS } from '../config/configuration';

export interface UmamiStats {
	pageviews: { value: number; change: number };
	visitors: { value: number; change: number };
	visits: { value: number; change: number };
	bounces: { value: number; change: number };
	totalTime: { value: number; change: number };
}

export interface ActiveVisitors {
	websiteId: string;
	visitors: number;
}

@Injectable()
export class UmamiService implements OnModuleInit {
	private readonly logger = new Logger(UmamiService.name);
	private apiUrl: string;
	private username: string;
	private password: string;
	private authToken: string | null = null;
	private tokenExpiry: Date | null = null;

	constructor(private configService: ConfigService) {
		this.apiUrl = this.configService.get<string>('umami.apiUrl') || 'http://localhost:3200';
		this.username = this.configService.get<string>('umami.username') || 'admin';
		this.password = this.configService.get<string>('umami.password') || '';
	}

	async onModuleInit() {
		try {
			await this.authenticate();
			this.logger.log('Successfully authenticated with Umami');
		} catch (error) {
			this.logger.warn(
				'Failed to authenticate with Umami on startup. Will retry on first request.'
			);
		}
	}

	private async authenticate(): Promise<void> {
		const response = await fetch(`${this.apiUrl}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				username: this.username,
				password: this.password,
			}),
		});

		if (!response.ok) {
			throw new Error(`Umami auth failed: ${response.status}`);
		}

		const data = await response.json();
		this.authToken = data.token;
		// Token is valid for 24 hours, refresh after 23 hours
		this.tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
	}

	private async getAuthToken(): Promise<string> {
		if (!this.authToken || !this.tokenExpiry || this.tokenExpiry < new Date()) {
			await this.authenticate();
		}
		return this.authToken!;
	}

	private async apiRequest<T>(endpoint: string): Promise<T> {
		const token = await this.getAuthToken();
		const response = await fetch(`${this.apiUrl}${endpoint}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`Umami API error: ${response.status} ${await response.text()}`);
		}

		return response.json();
	}

	async getWebsiteStats(websiteId: string, startAt: number, endAt: number): Promise<UmamiStats> {
		return this.apiRequest<UmamiStats>(
			`/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`
		);
	}

	async getActiveVisitors(websiteId: string): Promise<number> {
		try {
			const result = await this.apiRequest<ActiveVisitors[]>(`/api/websites/${websiteId}/active`);
			return result?.[0]?.visitors || 0;
		} catch {
			return 0;
		}
	}

	async getAllWebsiteStats(startAt: number, endAt: number): Promise<Map<string, UmamiStats>> {
		const results = new Map<string, UmamiStats>();

		for (const [name, id] of Object.entries(WEBSITE_IDS)) {
			try {
				const stats = await this.getWebsiteStats(id, startAt, endAt);
				results.set(name, stats);
			} catch (error) {
				this.logger.warn(`Failed to get stats for ${name}: ${error}`);
			}
		}

		return results;
	}

	async getAllActiveVisitors(): Promise<Map<string, number>> {
		const results = new Map<string, number>();

		for (const [name, id] of Object.entries(WEBSITE_IDS)) {
			try {
				const visitors = await this.getActiveVisitors(id);
				results.set(name, visitors);
			} catch (error) {
				this.logger.warn(`Failed to get active visitors for ${name}: ${error}`);
			}
		}

		return results;
	}

	getWebsiteId(name: string): string | undefined {
		return WEBSITE_IDS[name];
	}
}
