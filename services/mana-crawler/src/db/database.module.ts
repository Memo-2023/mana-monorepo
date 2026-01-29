import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getDb } from './connection';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
	providers: [
		{
			provide: DATABASE_CONNECTION,
			useFactory: (configService: ConfigService) => {
				const databaseUrl = configService.get<string>('database.url');
				if (!databaseUrl) {
					throw new Error('DATABASE_URL is not configured');
				}
				return getDb(databaseUrl);
			},
			inject: [ConfigService],
		},
	],
	exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
