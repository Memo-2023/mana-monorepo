import { createDrizzleConfig } from '@manacore/shared-drizzle-config';

export default createDrizzleConfig({
	dbName: 'storage',
	additionalEnvVars: ['STORAGE_DATABASE_URL'],
});
