import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/db/schema/*.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL || 'postgresql://mana:devpassword@localhost:5432/mana_platform',
	},
	// Scope to just the schemas mana-mail owns. Other services (mana-auth,
	// mana-research) manage their own pgSchemas; pushing all would
	// accidentally drop foreign rows on each service's next migration.
	schemaFilter: ['mail', 'broadcast'],
});
