import 'dotenv/config';
import { createDrizzleConfig } from '@manacore/shared-drizzle-config';

export default createDrizzleConfig({
	dbName: 'questions',
	schemaPath: './src/db/schema/*.ts',
	outDir: './drizzle',
});
