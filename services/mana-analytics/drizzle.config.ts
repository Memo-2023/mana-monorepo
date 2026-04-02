import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/db/schema/*.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url:
			process.env.DATABASE_URL || 'postgresql://manacore:devpassword@localhost:5432/mana_platform',
	},
	schemaFilter: ['feedback'],
});
