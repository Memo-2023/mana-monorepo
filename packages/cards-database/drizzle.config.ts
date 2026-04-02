import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/schema/*.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url:
			process.env.DATABASE_URL || 'postgresql://manacore:devpassword@localhost:5432/mana_platform',
	},
	schemaFilter: ['cards'],
	verbose: true,
	strict: true,
});
