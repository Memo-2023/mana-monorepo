import { createDrizzleConfig } from '@manacore/shared-drizzle-config';

export default createDrizzleConfig({
	dbName: 'manacore',
	schemaFilter: ['auth', 'credits', 'gifts', 'subscriptions', 'public'],
});
