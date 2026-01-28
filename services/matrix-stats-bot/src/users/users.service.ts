import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import postgres from 'postgres';

interface UserStats {
	total: number;
	verified: number;
	lastWeek: number;
	lastMonth: number;
}

@Injectable()
export class UsersService implements OnModuleInit {
	private readonly logger = new Logger(UsersService.name);
	private sql: postgres.Sql | null = null;

	constructor(private configService: ConfigService) {}

	async onModuleInit() {
		const databaseUrl = this.configService.get<string>('database.url');
		if (databaseUrl) {
			try {
				this.sql = postgres(databaseUrl);
				this.logger.log('Database connected for user stats');
			} catch (error) {
				this.logger.warn('Failed to connect to database:', error);
			}
		} else {
			this.logger.warn('DATABASE_URL not configured - user stats disabled');
		}
	}

	async getUserStats(): Promise<UserStats | null> {
		if (!this.sql) {
			return null;
		}

		try {
			const [totalResult] = await this.sql`SELECT COUNT(*) as count FROM "user"`;
			const [verifiedResult] = await this.sql`SELECT COUNT(*) as count FROM "user" WHERE "emailVerified" = true`;
			const [weekResult] = await this.sql`SELECT COUNT(*) as count FROM "user" WHERE "createdAt" > NOW() - INTERVAL '7 days'`;
			const [monthResult] = await this.sql`SELECT COUNT(*) as count FROM "user" WHERE "createdAt" > NOW() - INTERVAL '30 days'`;

			return {
				total: parseInt(totalResult.count, 10),
				verified: parseInt(verifiedResult.count, 10),
				lastWeek: parseInt(weekResult.count, 10),
				lastMonth: parseInt(monthResult.count, 10),
			};
		} catch (error) {
			this.logger.error('Failed to get user stats:', error);
			return null;
		}
	}
}
