import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Database } from 'duckdb-async';
import { sql } from 'drizzle-orm';
import { getDb } from '../db/connection';
import * as fs from 'fs';
import * as path from 'path';

export interface DailyMetrics {
	date: string;
	total_users: number;
	verified_users: number;
	new_users_today: number;
	new_users_week: number;
	new_users_month: number;
	total_db_size_bytes: number | null;
	recorded_at: string;
}

export interface GrowthData {
	date: string;
	total_users: number;
	growth: number | null;
	growth_percent: number | null;
}

export interface MonthlyMetrics {
	month: string;
	total_users_eom: number;
	new_users: number;
	growth_percent: number | null;
}

@Injectable()
export class AnalyticsService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(AnalyticsService.name);
	private duckdb: Database | null = null;
	private readonly dbPath: string;
	private readonly databaseUrl: string;

	constructor(private readonly configService: ConfigService) {
		this.dbPath = this.configService.get<string>('DUCKDB_PATH', './data/metrics.duckdb');
		this.databaseUrl = this.configService.get<string>('DATABASE_URL', '');
	}

	async onModuleInit(): Promise<void> {
		try {
			// Ensure the directory exists
			const dbDir = path.dirname(this.dbPath);
			if (!fs.existsSync(dbDir)) {
				fs.mkdirSync(dbDir, { recursive: true });
				this.logger.log(`Created DuckDB directory: ${dbDir}`);
			}

			this.duckdb = await Database.create(this.dbPath);
			await this.initializeSchema();
			this.logger.log(`DuckDB initialized at ${this.dbPath}`);

			// Record initial snapshot if database is empty
			const count = await this.getRecordCount();
			if (count === 0) {
				this.logger.log('No existing records found, recording initial snapshot...');
				await this.recordDailySnapshot();
			}
		} catch (error) {
			this.logger.error('Failed to initialize DuckDB', error);
		}
	}

	async onModuleDestroy(): Promise<void> {
		if (this.duckdb) {
			await this.duckdb.close();
			this.logger.log('DuckDB connection closed');
		}
	}

	private async initializeSchema(): Promise<void> {
		if (!this.duckdb) return;

		await this.duckdb.run(`
			CREATE TABLE IF NOT EXISTS daily_metrics (
				date DATE PRIMARY KEY,
				total_users INTEGER NOT NULL,
				verified_users INTEGER NOT NULL,
				new_users_today INTEGER NOT NULL,
				new_users_week INTEGER NOT NULL,
				new_users_month INTEGER NOT NULL,
				total_db_size_bytes BIGINT,
				recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`);

		this.logger.log('DuckDB schema initialized');
	}

	private async getRecordCount(): Promise<number> {
		if (!this.duckdb) return 0;
		const result = await this.duckdb.all('SELECT COUNT(*) as count FROM daily_metrics');
		return Number(result[0]?.count ?? 0);
	}

	/**
	 * Record daily snapshot - runs at midnight UTC
	 */
	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async recordDailySnapshot(): Promise<void> {
		if (!this.duckdb) {
			this.logger.warn('DuckDB not initialized, skipping snapshot');
			return;
		}

		try {
			const today = new Date().toISOString().split('T')[0];

			// Get user counts from PostgreSQL
			const [totalUsers, verifiedUsers, newToday, newWeek, newMonth, dbSize] = await Promise.all([
				this.countTotalUsers(),
				this.countVerifiedUsers(),
				this.countUsersCreatedSince(1),
				this.countUsersCreatedSince(7),
				this.countUsersCreatedSince(30),
				this.getDatabaseSize(),
			]);

			// Insert or replace in DuckDB
			await this.duckdb.run(
				`
				INSERT OR REPLACE INTO daily_metrics
				(date, total_users, verified_users, new_users_today, new_users_week, new_users_month, total_db_size_bytes, recorded_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
			`,
				today,
				totalUsers,
				verifiedUsers,
				newToday,
				newWeek,
				newMonth,
				dbSize
			);

			this.logger.log(`Daily snapshot recorded for ${today}: ${totalUsers} total users`);
		} catch (error) {
			this.logger.error('Failed to record daily snapshot', error);
		}
	}

	/**
	 * Get user growth over time
	 */
	async getUserGrowth(days = 90): Promise<GrowthData[]> {
		if (!this.duckdb) return [];

		const result = await this.duckdb.all(
			`
			SELECT
				date::VARCHAR as date,
				total_users,
				total_users - LAG(total_users) OVER (ORDER BY date) as growth,
				ROUND(((total_users::FLOAT - LAG(total_users) OVER (ORDER BY date)) /
					NULLIF(LAG(total_users) OVER (ORDER BY date), 0)) * 100, 2) as growth_percent
			FROM daily_metrics
			WHERE date > CURRENT_DATE - INTERVAL '${days} days'
			ORDER BY date
		`
		);

		return result as GrowthData[];
	}

	/**
	 * Get monthly aggregated metrics
	 */
	async getMonthlyMetrics(months = 12): Promise<MonthlyMetrics[]> {
		if (!this.duckdb) return [];

		const result = await this.duckdb.all(
			`
			SELECT
				strftime(date_trunc('month', date), '%Y-%m') as month,
				MAX(total_users)::INTEGER as total_users_eom,
				SUM(new_users_today)::INTEGER as new_users,
				ROUND(((MAX(total_users)::FLOAT - MIN(total_users)) /
					NULLIF(MIN(total_users), 0)) * 100, 2) as growth_percent
			FROM daily_metrics
			WHERE date > CURRENT_DATE - INTERVAL '${months} months'
			GROUP BY date_trunc('month', date)
			ORDER BY month
		`
		);

		return result as MonthlyMetrics[];
	}

	/**
	 * Get latest metrics
	 */
	async getLatestMetrics(): Promise<DailyMetrics | null> {
		if (!this.duckdb) return null;

		const result = await this.duckdb.all(`
			SELECT
				date::VARCHAR as date,
				total_users,
				verified_users,
				new_users_today,
				new_users_week,
				new_users_month,
				total_db_size_bytes::INTEGER as total_db_size_bytes,
				recorded_at::VARCHAR as recorded_at
			FROM daily_metrics
			ORDER BY date DESC
			LIMIT 1
		`);

		return (result[0] as DailyMetrics) ?? null;
	}

	/**
	 * Get all metrics for a date range
	 */
	async getMetricsRange(startDate: string, endDate: string): Promise<DailyMetrics[]> {
		if (!this.duckdb) return [];

		const result = await this.duckdb.all(
			`
			SELECT
				date::VARCHAR as date,
				total_users,
				verified_users,
				new_users_today,
				new_users_week,
				new_users_month,
				total_db_size_bytes::INTEGER as total_db_size_bytes,
				recorded_at::VARCHAR as recorded_at
			FROM daily_metrics
			WHERE date BETWEEN ? AND ?
			ORDER BY date
		`,
			startDate,
			endDate
		);

		return result as DailyMetrics[];
	}

	/**
	 * Health check for the analytics service
	 */
	async getHealth(): Promise<{
		status: string;
		database_path: string;
		database_size_bytes: number | null;
		total_records: number;
		latest_snapshot: string | null;
	}> {
		const recordCount = await this.getRecordCount();
		const latest = await this.getLatestMetrics();

		return {
			status: this.duckdb ? 'healthy' : 'unhealthy',
			database_path: this.dbPath,
			database_size_bytes: null, // DuckDB doesn't expose this easily
			total_records: recordCount,
			latest_snapshot: latest?.date ?? null,
		};
	}

	/**
	 * Export metrics to Parquet format (for archival)
	 */
	async exportToParquet(outputPath: string): Promise<void> {
		if (!this.duckdb) {
			throw new Error('DuckDB not initialized');
		}

		await this.duckdb.run(`COPY daily_metrics TO '${outputPath}' (FORMAT PARQUET)`);
		this.logger.log(`Metrics exported to ${outputPath}`);
	}

	// ============================================
	// PostgreSQL Query Helpers
	// ============================================

	private getPostgresDb() {
		if (!this.databaseUrl) {
			throw new Error('DATABASE_URL not configured');
		}
		return getDb(this.databaseUrl);
	}

	private async countTotalUsers(): Promise<number> {
		const db = this.getPostgresDb();
		const result = await db.execute(sql`SELECT COUNT(*) as count FROM auth.users`);
		const row = result[0] as { count: string | number } | undefined;
		return Number(row?.count ?? 0);
	}

	private async countVerifiedUsers(): Promise<number> {
		const db = this.getPostgresDb();
		const result = await db.execute(
			sql`SELECT COUNT(*) as count FROM auth.users WHERE email_verified = true`
		);
		const row = result[0] as { count: string | number } | undefined;
		return Number(row?.count ?? 0);
	}

	private async countUsersCreatedSince(days: number): Promise<number> {
		const db = this.getPostgresDb();
		const result = await db.execute(
			sql`SELECT COUNT(*) as count FROM auth.users WHERE created_at > NOW() - INTERVAL '${sql.raw(days.toString())} days'`
		);
		const row = result[0] as { count: string | number } | undefined;
		return Number(row?.count ?? 0);
	}

	private async getDatabaseSize(): Promise<number | null> {
		try {
			const db = this.getPostgresDb();
			const result = await db.execute(sql`SELECT pg_database_size(current_database()) as size`);
			const row = result[0] as { size: string | number } | undefined;
			return Number(row?.size ?? 0);
		} catch {
			return null;
		}
	}
}
