import { createDrizzleConfig } from '@manacore/shared-drizzle-config';

export default createDrizzleConfig({
	dbName: 'zitare',
	additionalEnvVars: ['ZITARE_DATABASE_URL'],
});
