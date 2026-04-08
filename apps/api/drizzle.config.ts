import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle config for the unified mana-api.
 *
 * Most modules in apps/api inline their schemas in routes.ts and create
 * tables out-of-band (or piggyback on schemas owned by other services).
 * This config currently only manages the `research` schema introduced for
 * the deep-research feature; expand the `schema` glob and `schemaFilter`
 * as more modules adopt managed migrations.
 */
export default defineConfig({
	schema: './src/modules/research/schema.ts',
	out: './drizzle/research',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL || 'postgresql://mana:devpassword@localhost:5432/mana_platform',
	},
	schemaFilter: ['research'],
});
