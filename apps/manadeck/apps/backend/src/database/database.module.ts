import { Module, Global, OnModuleDestroy, Logger } from '@nestjs/common';
import { getDb, closeDb } from '@manacore/manadeck-database/client';
import type { Database } from '@manacore/manadeck-database/client';

export const DATABASE_TOKEN = 'DATABASE';

@Global()
@Module({
	providers: [
		{
			provide: DATABASE_TOKEN,
			useFactory: () => {
				const logger = new Logger('DatabaseModule');
				logger.log('Initializing database connection');
				return getDb();
			},
		},
	],
	exports: [DATABASE_TOKEN],
})
export class DatabaseModule implements OnModuleDestroy {
	private readonly logger = new Logger(DatabaseModule.name);

	async onModuleDestroy() {
		this.logger.log('Closing database connection');
		await closeDb();
	}
}

export type { Database };
