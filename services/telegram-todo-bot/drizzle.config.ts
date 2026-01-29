import { createDrizzleConfig } from '@manacore/shared-drizzle-config';

export default createDrizzleConfig({
	dbName: 'todo_bot',
	schemaPath: './src/database/schema.ts',
	outDir: './drizzle',
	verbose: false,
	strict: false,
});
