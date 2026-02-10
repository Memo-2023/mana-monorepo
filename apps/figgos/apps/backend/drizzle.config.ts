import { createDrizzleConfig } from '@manacore/shared-drizzle-config';

export default createDrizzleConfig({
	dbName: 'figgos',
	additionalEnvVars: ['FIGGOS_DATABASE_URL'],
});
