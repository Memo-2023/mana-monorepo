import type { Handle } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/**
 * Server hooks for ManaCore web app
 *
 * Injects runtime environment variables into the HTML for client-side access.
 * Uses $env/dynamic/private to read environment variables at RUNTIME (not build time),
 * which is necessary for Docker containers that set env vars at runtime.
 */

export const handle: Handle = async ({ event, resolve }) => {
	// Get client-side URLs from environment at RUNTIME (not build time)
	const authUrlClient = env.PUBLIC_MANA_CORE_AUTH_URL_CLIENT || env.PUBLIC_MANA_CORE_AUTH_URL || '';
	const todoApiUrlClient = env.PUBLIC_TODO_API_URL_CLIENT || env.PUBLIC_TODO_API_URL || '';
	const calendarApiUrlClient =
		env.PUBLIC_CALENDAR_API_URL_CLIENT || env.PUBLIC_CALENDAR_API_URL || '';
	const clockApiUrlClient = env.PUBLIC_CLOCK_API_URL_CLIENT || env.PUBLIC_CLOCK_API_URL || '';
	const contactsApiUrlClient =
		env.PUBLIC_CONTACTS_API_URL_CLIENT || env.PUBLIC_CONTACTS_API_URL || '';

	return resolve(event, {
		transformPageChunk: ({ html }) => {
			const envScript = `<script>
window.__PUBLIC_MANA_CORE_AUTH_URL__ = "${authUrlClient}";
window.__PUBLIC_TODO_API_URL__ = "${todoApiUrlClient}";
window.__PUBLIC_CALENDAR_API_URL__ = "${calendarApiUrlClient}";
window.__PUBLIC_CLOCK_API_URL__ = "${clockApiUrlClient}";
window.__PUBLIC_CONTACTS_API_URL__ = "${contactsApiUrlClient}";
</script>`;
			return html.replace('<head>', `<head>${envScript}`);
		},
	});
};
