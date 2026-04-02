import { defineConfig, type Config } from 'drizzle-kit';

export interface DrizzleConfigOptions {
	/**
	 * Database name for fallback URL when DATABASE_URL is not set
	 * @default 'mana_platform'
	 */
	dbName?: string;

	/**
	 * Path to schema file(s)
	 * @default './src/db/schema/index.ts'
	 */
	schemaPath?: string;

	/**
	 * Output directory for migrations
	 * @default './src/db/migrations'
	 */
	outDir?: string;

	/**
	 * Environment variable name for database URL
	 * @default 'DATABASE_URL'
	 */
	envVar?: string;

	/**
	 * Additional environment variable names to check (in order)
	 * Example: ['STORAGE_DATABASE_URL'] for storage backend
	 */
	additionalEnvVars?: string[];

	/**
	 * Schema filter for multi-schema databases
	 * Example: ['auth', 'credits', 'public']
	 */
	schemaFilter?: string[];

	/**
	 * Enable verbose output
	 * @default true
	 */
	verbose?: boolean;

	/**
	 * Enable strict mode
	 * @default true
	 */
	strict?: boolean;
}

/**
 * Default PostgreSQL connection for local development
 */
const DEFAULT_PG_HOST = 'localhost';
const DEFAULT_PG_PORT = '5432';
const DEFAULT_PG_USER = 'manacore';
const DEFAULT_PG_PASSWORD = 'devpassword';

/**
 * Creates a Drizzle Kit configuration with sensible defaults
 *
 * @example
 * // Basic usage
 * export default createDrizzleConfig({ dbName: 'calendar' });
 *
 * @example
 * // With custom paths
 * export default createDrizzleConfig({
 *   dbName: 'calendar',
 *   schemaPath: './src/database/schema.ts',
 *   outDir: './drizzle',
 * });
 *
 * @example
 * // With schema filter (multi-schema)
 * export default createDrizzleConfig({
 *   dbName: 'manacore',
 *   schemaFilter: ['auth', 'credits', 'public'],
 * });
 */
export function createDrizzleConfig(options: DrizzleConfigOptions): Config {
	const {
		dbName = 'mana_platform',
		schemaPath = './src/db/schema/index.ts',
		outDir = './src/db/migrations',
		envVar = 'DATABASE_URL',
		additionalEnvVars = [],
		schemaFilter,
		verbose = true,
		strict = true,
	} = options;

	// Build fallback URL
	const fallbackUrl = `postgresql://${DEFAULT_PG_USER}:${DEFAULT_PG_PASSWORD}@${DEFAULT_PG_HOST}:${DEFAULT_PG_PORT}/${dbName}`;

	// Check all env vars in order
	let databaseUrl: string | undefined;
	for (const envVarName of [...additionalEnvVars, envVar]) {
		if (process.env[envVarName]) {
			databaseUrl = process.env[envVarName];
			break;
		}
	}
	databaseUrl = databaseUrl || fallbackUrl;

	const config: Config = {
		dialect: 'postgresql',
		schema: schemaPath,
		out: outDir,
		dbCredentials: {
			url: databaseUrl,
		},
		verbose,
		strict,
	};

	// Add schema filter if provided
	if (schemaFilter && schemaFilter.length > 0) {
		config.schemaFilter = schemaFilter;
	}

	return defineConfig(config);
}

// Re-export defineConfig for cases where more customization is needed
export { defineConfig } from 'drizzle-kit';
export type { Config } from 'drizzle-kit';
