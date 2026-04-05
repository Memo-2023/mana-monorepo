import type { Handle } from '@sveltejs/kit';
import { setSecurityHeaders } from '@mana/shared-utils/security-headers';

const PUBLIC_MANA_AUTH_URL_CLIENT =
	process.env.PUBLIC_MANA_AUTH_URL_CLIENT || process.env.PUBLIC_MANA_AUTH_URL || '';
const PUBLIC_BACKEND_URL_CLIENT =
	process.env.PUBLIC_BACKEND_URL_CLIENT || process.env.PUBLIC_BACKEND_URL || '';
const PUBLIC_GLITCHTIP_DSN = process.env.PUBLIC_GLITCHTIP_DSN || '';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			const envScript = `<script>
window.__PUBLIC_MANA_AUTH_URL__ = ${JSON.stringify(PUBLIC_MANA_AUTH_URL_CLIENT)};
window.__PUBLIC_BACKEND_URL__ = ${JSON.stringify(PUBLIC_BACKEND_URL_CLIENT)};
window.__PUBLIC_GLITCHTIP_DSN__ = ${JSON.stringify(PUBLIC_GLITCHTIP_DSN)};
</script>`;
			return html.replace('<head>', `<head>${envScript}`);
		},
	});

	setSecurityHeaders(response, {
		connectSrc: [PUBLIC_MANA_AUTH_URL_CLIENT, PUBLIC_BACKEND_URL_CLIENT],
	});

	return response;
};
