import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://chat:password@localhost:5432/chat',
  },
  verbose: true,
  strict: true,
});
