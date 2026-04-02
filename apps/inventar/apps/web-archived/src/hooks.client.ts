import type { HandleClientError } from '@sveltejs/kit';
import { initErrorTracking, handleSvelteError } from '@manacore/shared-error-tracking/browser';

initErrorTracking({
	serviceName: 'inventar-web',
});

export const handleError: HandleClientError = ({ error }) => {
	handleSvelteError(error);
};
