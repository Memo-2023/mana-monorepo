import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/db/schema/index.ts',
	out: './src/db/migrations',
	dbCredentials: {
		url:
			process.env.MAIL_DATABASE_URL ||
			process.env.DATABASE_URL ||
			'postgresql://manacore:devpassword@localhost:5432/mail',
	},
	verbose: true,
	strict: true,
});
