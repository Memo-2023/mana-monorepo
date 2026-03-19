import { initErrorTracking } from '@manacore/shared-error-tracking';

initErrorTracking({
	serviceName: 'todo-backend',
	environment: process.env.NODE_ENV,
	release: process.env.APP_VERSION,
	debug: process.env.NODE_ENV === 'development',
});
