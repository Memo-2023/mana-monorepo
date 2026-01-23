import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import postgres from 'postgres';

export interface UserStats {
	totalUsers: number;
	verifiedUsers: number;
	todayNewUsers: number;
	weekNewUsers: number;
	monthNewUsers: number;
}

@Injectable()
export class UsersService implements OnModuleInit {
	private readonly logger = new Logger(UsersService.name);
	private sql: postgres.Sql | null = null;
	private databaseUrl: string | undefined;

	constructor(private configService: ConfigService) {
		this.databaseUrl = this.configService.get<string>('database.url');
	}

	async onModuleInit() {
		if (this.databaseUrl) {
			try {
				this.sql = postgres(this.databaseUrl);
				this.logger.log('Database connection initialized');
			} catch (error) {
				this.logger.warn('Failed to initialize database connection:', error);
			}
		} else {
			this.logger.warn('DATABASE_URL not configured, user stats will be unavailable');
		}
	}

	async getUserStats(): Promise<UserStats | null> {
		if (!this.sql) {
			return null;
		}

		try {
			const now = new Date();
			const startOfToday = new Date(now);
			startOfToday.setHours(0, 0, 0, 0);

			const startOfWeek = new Date(now);
			const day = startOfWeek.getDay();
			const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
			startOfWeek.setDate(diff);
			startOfWeek.setHours(0, 0, 0, 0);

			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

			const [result] = await this.sql`
        SELECT
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
          COUNT(*) FILTER (WHERE created_at >= ${startOfToday.toISOString()}) as today_new_users,
          COUNT(*) FILTER (WHERE created_at >= ${startOfWeek.toISOString()}) as week_new_users,
          COUNT(*) FILTER (WHERE created_at >= ${startOfMonth.toISOString()}) as month_new_users
        FROM auth.users
        WHERE deleted_at IS NULL
      `;

			return {
				totalUsers: Number(result.total_users),
				verifiedUsers: Number(result.verified_users),
				todayNewUsers: Number(result.today_new_users),
				weekNewUsers: Number(result.week_new_users),
				monthNewUsers: Number(result.month_new_users),
			};
		} catch (error) {
			this.logger.error('Failed to fetch user stats:', error);
			return null;
		}
	}
}
