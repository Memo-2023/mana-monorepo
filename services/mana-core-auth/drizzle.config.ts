import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/db/schema/index.ts',
	out: './src/db/migrations',
	dbCredentials: {
		url: process.env.DATABASE_URL || 'postgresql://manacore:password@localhost:5432/manacore',
	},
	verbose: true,
	strict: true,
});
