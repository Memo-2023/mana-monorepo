import { Module, Global, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';
export type Database = PostgresJsDatabase<typeof schema>;

@Global()
@Module({
	providers: [
		{
			provide: DATABASE_CONNECTION,
			useFactory: async (configService: ConfigService): Promise<Database | null> => {
				const logger = new Logger('Database');
				const databaseUrl = configService.get<string>('database.url');

				if (!databaseUrl) {
					logger.warn('DATABASE_URL not set, database features will be disabled');
					return null;
				}

				try {
					const client = postgres(databaseUrl);
					const db = drizzle(client, { schema });
					logger.log('Database connection established');
					return db;
				} catch (error) {
					logger.error(`Failed to connect to database: ${error}`);
					return null;
				}
			},
			inject: [ConfigService],
		},
	],
	exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
