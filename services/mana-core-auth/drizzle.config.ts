import { createDrizzleConfig } from '@manacore/shared-drizzle-config';

export default createDrizzleConfig({
	dbName: 'manacore',
	schemaFilter: ['auth', 'credits', 'referrals', 'subscriptions', 'public'],
});
