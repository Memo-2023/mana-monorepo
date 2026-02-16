import { createDrizzleConfig } from '@manacore/shared-drizzle-config';

export default createDrizzleConfig({
	dbName: 'lightwrite',
	additionalEnvVars: ['LIGHTWRITE_DATABASE_URL'],
});
