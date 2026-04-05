import { createDrizzleConfig } from '@mana/shared-drizzle-config';

export default createDrizzleConfig({
	dbName: 'mana_platform',
	schemaPath: './src/db/schema/index.ts',
	schemaFilter: ['media'],
});
