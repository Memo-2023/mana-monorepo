import { createDrizzleConfig } from '@manacore/shared-drizzle-config';

export default createDrizzleConfig({
	dbName: 'citycorners',
	additionalEnvVars: ['CITYCORNERS_DATABASE_URL'],
});
