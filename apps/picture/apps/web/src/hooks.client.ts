import { initErrorTracking, handleSvelteError } from '@manacore/shared-error-tracking/browser';
import type { HandleClientError } from '@sveltejs/kit';

initErrorTracking({
	serviceName: 'picture-web',
	dsn: (window as any).__PUBLIC_GLITCHTIP_DSN__,
	environment: import.meta.env.MODE,
});

export const handleError: HandleClientError = ({ error }) => {
	handleSvelteError(error);
};
