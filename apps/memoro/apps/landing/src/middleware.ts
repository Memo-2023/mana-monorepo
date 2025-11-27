import { defineMiddleware } from 'astro/middleware';
import { getRedirectUrl, getRedirectStatus } from './utils/redirects';

export const onRequest = defineMiddleware(async (context, next) => {
	const { url } = context;
	const { pathname } = url;

	// 1. Prüfe zuerst die Redirect-Map für alte URLs
	const redirectUrl = getRedirectUrl(pathname);
	if (redirectUrl) {
		const status = getRedirectStatus(pathname);
		return context.redirect(redirectUrl, status);
	}

	// 2. Handle root path - redirect to /de
	if (pathname === '/') {
		return context.redirect('/de', 301);
	}

	// 3. Handle paths without language prefix (except special paths)
	const segments = pathname.split('/').filter(Boolean);
	const firstSegment = segments[0];
	const validLanguages = ['de', 'en'];
	const specialPaths = ['admin', 'api', '_astro', 'images', 'favicon', '404'];

	// If no language prefix and not a special path, redirect to /de/...
	if (
		!validLanguages.includes(firstSegment) &&
		!specialPaths.includes(firstSegment) &&
		!pathname.includes('.')
	) {
		return context.redirect(`/de${pathname}`, 301);
	}

	// 4. Lasse alle anderen Requests durch
	const response = await next();

	// 5. Log 404 errors für Monitoring (nur in Production)
	if (response.status === 404 && import.meta.env.PROD) {
		console.warn(
			`404 Error: ${pathname} | Referrer: ${context.request.headers.get('referer') || 'direct'}`
		);
	}

	return response;
});
