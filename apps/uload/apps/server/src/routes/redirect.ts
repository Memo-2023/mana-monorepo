import { Hono } from 'hono';
import type { RedirectService } from '../services/redirect';
import { NotFoundError } from '../lib/errors';

export function createRedirectRoutes(redirectService: RedirectService) {
	return new Hono().get('/:code', async (c) => {
		const code = c.req.param('code');
		const link = await redirectService.resolve(code);

		if (!link) {
			throw new NotFoundError('Link not found or expired');
		}

		// Track click asynchronously (don't block redirect)
		const userAgent = c.req.header('User-Agent') || '';
		const referer = c.req.header('Referer') || '';

		// Simple UA parsing
		const browser = parseBrowser(userAgent);
		const deviceType = parseDeviceType(userAgent);
		const os = parseOS(userAgent);

		// Hash IP for privacy
		const ip = c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || 'unknown';
		const ipHash = await hashIP(ip);

		redirectService
			.trackClick(link.id, {
				ipHash,
				userAgent,
				referer,
				browser,
				deviceType,
				os,
			})
			.catch((err) => console.error('Click tracking error:', err));

		return c.redirect(link.originalUrl, 302);
	});
}

function parseDeviceType(ua: string): string {
	if (/mobile|android|iphone|ipad/i.test(ua)) return 'mobile';
	if (/tablet|ipad/i.test(ua)) return 'tablet';
	return 'desktop';
}

function parseBrowser(ua: string): string {
	if (/firefox/i.test(ua)) return 'Firefox';
	if (/edg/i.test(ua)) return 'Edge';
	if (/chrome|chromium/i.test(ua)) return 'Chrome';
	if (/safari/i.test(ua)) return 'Safari';
	if (/opera|opr/i.test(ua)) return 'Opera';
	return 'Other';
}

function parseOS(ua: string): string {
	if (/windows/i.test(ua)) return 'Windows';
	if (/mac os/i.test(ua)) return 'macOS';
	if (/linux/i.test(ua)) return 'Linux';
	if (/android/i.test(ua)) return 'Android';
	if (/iphone|ipad/i.test(ua)) return 'iOS';
	return 'Other';
}

async function hashIP(ip: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(ip + 'uload-salt');
	const hash = await crypto.subtle.digest('SHA-256', data);
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
		.slice(0, 16);
}
