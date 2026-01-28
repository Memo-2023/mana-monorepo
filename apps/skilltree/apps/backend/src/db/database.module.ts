import { Module, Global, OnModuleDestroy } from '@nestjs/common';
import { getDb, closeConnection, Database } from './connection';

export const DATABASE_TOKEN = 'DATABASE';

@Global()
@Module({
	providers: [
		{
			provide: DATABASE_TOKEN,
			useFactory: () => getDb(),
		},
	],
	exports: [DATABASE_TOKEN],
})
export class DatabaseModule implements OnModuleDestroy {
	async onModuleDestroy() {
		await closeConnection();
	}
}
