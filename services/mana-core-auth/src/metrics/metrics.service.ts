import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as client from 'prom-client';
import { count, eq, gte, and, isNull, sql } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { users } from '../db/schema';

@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(MetricsService.name);
	private readonly register: client.Registry;
	private updateInterval: NodeJS.Timeout | null = null;

	// HTTP metrics
	readonly httpRequestsTotal: client.Counter<string>;
	readonly httpRequestDuration: client.Histogram<string>;

	// User metrics
	readonly usersTotal: client.Gauge<string>;
	readonly usersVerified: client.Gauge<string>;
	readonly usersCreatedToday: client.Gauge<string>;
	readonly usersCreatedThisWeek: client.Gauge<string>;
	readonly usersCreatedThisMonth: client.Gauge<string>;

	constructor(private readonly configService: ConfigService) {
		this.register = new client.Registry();

		// Add default metrics (CPU, memory, event loop, etc.)
		client.collectDefaultMetrics({
			register: this.register,
			prefix: 'auth_',
		});

		// HTTP request counter
		this.httpRequestsTotal = new client.Counter({
			name: 'http_requests_total',
			help: 'Total number of HTTP requests',
			labelNames: ['method', 'route', 'status'],
			registers: [this.register],
		});

		// HTTP request duration histogram
		this.httpRequestDuration = new client.Histogram({
			name: 'http_request_duration_seconds',
			help: 'Duration of HTTP requests in seconds',
			labelNames: ['method', 'route', 'status'],
			buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
			registers: [this.register],
		});

		// User statistics gauges
		this.usersTotal = new client.Gauge({
			name: 'auth_users_total',
			help: 'Total number of registered users',
			registers: [this.register],
		});

		this.usersVerified = new client.Gauge({
			name: 'auth_users_verified',
			help: 'Number of email-verified users',
			registers: [this.register],
		});

		this.usersCreatedToday = new client.Gauge({
			name: 'auth_users_created_today',
			help: 'Number of users created today',
			registers: [this.register],
		});

		this.usersCreatedThisWeek = new client.Gauge({
			name: 'auth_users_created_this_week',
			help: 'Number of users created this week',
			registers: [this.register],
		});

		this.usersCreatedThisMonth = new client.Gauge({
			name: 'auth_users_created_this_month',
			help: 'Number of users created this month',
			registers: [this.register],
		});
	}

	async onModuleInit() {
		// Update user metrics immediately and then every 60 seconds
		await this.updateUserMetrics();
		this.updateInterval = setInterval(() => this.updateUserMetrics(), 60000);
	}

	onModuleDestroy() {
		if (this.updateInterval) {
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}
	}

	private async updateUserMetrics() {
		const databaseUrl = this.configService.get<string>('DATABASE_URL');
		if (!databaseUrl) {
			this.logger.warn('DATABASE_URL not configured, user metrics unavailable');
			return;
		}

		try {
			const db = getDb(databaseUrl);
			const now = new Date();

			// Start of today (midnight)
			const startOfToday = new Date(now);
			startOfToday.setHours(0, 0, 0, 0);

			// Start of week (Monday)
			const startOfWeek = new Date(now);
			const day = startOfWeek.getDay();
			const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
			startOfWeek.setDate(diff);
			startOfWeek.setHours(0, 0, 0, 0);

			// Start of month
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

			// Query all metrics in parallel
			const [totalResult, verifiedResult, todayResult, weekResult, monthResult] = await Promise.all(
				[
					// Total users
					db.select({ count: count() }).from(users).where(isNull(users.deletedAt)),
					// Verified users
					db
						.select({ count: count() })
						.from(users)
						.where(and(isNull(users.deletedAt), eq(users.emailVerified, true))),
					// Users created today
					db
						.select({ count: count() })
						.from(users)
						.where(and(isNull(users.deletedAt), gte(users.createdAt, startOfToday))),
					// Users created this week
					db
						.select({ count: count() })
						.from(users)
						.where(and(isNull(users.deletedAt), gte(users.createdAt, startOfWeek))),
					// Users created this month
					db
						.select({ count: count() })
						.from(users)
						.where(and(isNull(users.deletedAt), gte(users.createdAt, startOfMonth))),
				]
			);

			this.usersTotal.set(totalResult[0].count);
			this.usersVerified.set(verifiedResult[0].count);
			this.usersCreatedToday.set(todayResult[0].count);
			this.usersCreatedThisWeek.set(weekResult[0].count);
			this.usersCreatedThisMonth.set(monthResult[0].count);
		} catch (error) {
			this.logger.error('Failed to update user metrics:', error);
		}
	}

	async getMetrics(): Promise<string> {
		return this.register.metrics();
	}

	getContentType(): string {
		return this.register.contentType;
	}
}
