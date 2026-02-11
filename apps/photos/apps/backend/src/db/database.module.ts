import { Module, Global } from '@nestjs/common';
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
			useFactory: () => {
				const connectionString = process.env.DATABASE_URL;
				if (!connectionString) {
					throw new Error('DATABASE_URL environment variable is not set');
				}
				const client = postgres(connectionString);
				return drizzle(client, { schema });
			},
		},
	],
	exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
