import { createDrizzleConfig } from '@manacore/shared-drizzle-config';

export default createDrizzleConfig({
	dbName: 'mana_media',
	schemaPath: './src/db/schema/index.ts',
});
