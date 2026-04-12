import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/modules/presi/schema.ts',
	out: './drizzle/presi',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL || 'postgresql://mana:devpassword@localhost:5432/mana_platform',
	},
	schemaFilter: ['presi'],
});
