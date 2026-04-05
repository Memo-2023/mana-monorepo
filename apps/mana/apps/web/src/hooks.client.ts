import { initErrorTracking, handleSvelteError } from '@mana/shared-error-tracking/browser';
import { trackWebVitals } from '@mana/shared-utils/web-vitals';
import type { HandleClientError } from '@sveltejs/kit';

initErrorTracking({
	serviceName: 'mana-web',
	dsn: (window as any).__PUBLIC_GLITCHTIP_DSN__,
	environment: import.meta.env.MODE,
});

trackWebVitals();

export const handleError: HandleClientError = ({ error }) => {
	handleSvelteError(error);
};
