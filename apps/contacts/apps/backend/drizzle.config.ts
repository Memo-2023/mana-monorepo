import { createDrizzleConfig } from '@manacore/shared-drizzle-config';

export default createDrizzleConfig({
	dbName: 'contacts',
	additionalEnvVars: ['CONTACTS_DATABASE_URL'],
});
