import { initErrorTracking, handleSvelteError } from '@manacore/shared-error-tracking/browser';
import { trackWebVitals } from '@manacore/shared-utils/web-vitals';
import type { HandleClientError } from '@sveltejs/kit';

initErrorTracking({
	serviceName: 'manacore-web',
	dsn: (window as any).__PUBLIC_GLITCHTIP_DSN__,
	environment: import.meta.env.MODE,
});

trackWebVitals();

export const handleError: HandleClientError = ({ error }) => {
	handleSvelteError(error);
};
