import type { HandleClientError } from '@sveltejs/kit';
import { initErrorTracking, createErrorHandler } from '@manacore/shared-error-tracking';

initErrorTracking({
	serviceName: 'inventar-web',
});

const errorHandler = createErrorHandler('inventar-web');

export const handleError: HandleClientError = ({ error, event }) => {
	errorHandler(error, { url: event.url.pathname });
};
