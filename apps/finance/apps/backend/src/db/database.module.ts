import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getDb, closeConnection, DATABASE_CONNECTION, type Database } from './connection';

@Global()
@Module({
	providers: [
		{
			provide: DATABASE_CONNECTION,
			useFactory: (configService: ConfigService): Database => {
				const databaseUrl = configService.get<string>('DATABASE_URL');
				if (!databaseUrl) {
					throw new Error('DATABASE_URL environment variable is not set');
				}
				return getDb(databaseUrl);
			},
			inject: [ConfigService],
		},
	],
	exports: [DATABASE_CONNECTION],
})
export class DatabaseModule implements OnModuleDestroy {
	async onModuleDestroy() {
		await closeConnection();
	}
}
