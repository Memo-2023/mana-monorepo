import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, closeDb, type Database } from '@manacore/nutriphi-database';

export const DATABASE_TOKEN = 'DATABASE';

@Global()
@Module({
	providers: [
		{
			provide: DATABASE_TOKEN,
			useFactory: (configService: ConfigService): Database => {
				const databaseUrl = configService.get<string>('DATABASE_URL');
				if (!databaseUrl) {
					throw new Error('DATABASE_URL environment variable is not set');
				}
				return createClient(databaseUrl);
			},
			inject: [ConfigService],
		},
	],
	exports: [DATABASE_TOKEN],
})
export class DatabaseModule implements OnModuleDestroy {
	async onModuleDestroy() {
		await closeDb();
	}
}
