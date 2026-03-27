import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const injectRuntimeEnv: Handle = async ({ event, resolve }) => {
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => {
			const authUrl = process.env.PUBLIC_MANA_CORE_AUTH_URL || '';
			const glitchtipDsn = process.env.PUBLIC_GLITCHTIP_DSN || '';

			return html.replace(
				'</head>',
				`<script>
					window.__PUBLIC_MANA_CORE_AUTH_URL__="${authUrl}";
					window.__PUBLIC_GLITCHTIP_DSN__="${glitchtipDsn}";
				</script></head>`
			);
		},
	});

	// Security headers
	const authUrl = process.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';
	response.headers.set(
		'Content-Security-Policy',
		`default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ${authUrl}; font-src 'self' data:;`
	);
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	return response;
};

export const handle = sequence(injectRuntimeEnv);
