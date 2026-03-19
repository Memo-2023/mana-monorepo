import { createDrizzleConfig } from '@manacore/shared-drizzle-config';

export default createDrizzleConfig({
	dbName: 'mukke',
	additionalEnvVars: ['MUKKE_DATABASE_URL'],
});
