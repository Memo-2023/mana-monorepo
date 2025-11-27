import type { Config } from 'drizzle-kit';

export default {
	schema: './src/lib/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url:
			process.env.DATABASE_URL ||
			'postgresql://uload:uload_dev_password_123@localhost:5432/uload_dev',
	},
	verbose: true,
	strict: true,
} satisfies Config;
