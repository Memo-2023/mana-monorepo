import { Module, Global, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
	providers: [
		{
			provide: DATABASE_CONNECTION,
			useFactory: (configService: ConfigService) => {
				const logger = new Logger('Database');
				const url = configService.get<string>('database.url');

				if (!url) {
					logger.error('DATABASE_URL is required');
					throw new Error('DATABASE_URL is required');
				}

				const client = postgres(url);
				logger.log('Database connected');

				return drizzle(client, { schema });
			},
			inject: [ConfigService],
		},
	],
	exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
