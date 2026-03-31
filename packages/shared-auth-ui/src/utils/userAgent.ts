/**
 * Parse a user agent string to extract browser and OS information.
 */
export function parseUserAgent(ua: string | null): { browser: string; os: string } {
	if (!ua) return { browser: '', os: '' };

	let browser = '';
	let os = '';

	if (ua.includes('Firefox/')) browser = 'Firefox';
	else if (ua.includes('Edg/')) browser = 'Edge';
	else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome';
	else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
	else if (ua.includes('Opera/') || ua.includes('OPR/')) browser = 'Opera';

	if (ua.includes('Windows')) os = 'Windows';
	else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS';
	else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
	else if (ua.includes('Android')) os = 'Android';
	else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

	return { browser, os };
}

/**
 * Determine the device type from a user agent string.
 */
export function getDeviceType(ua: string | null): 'mobile' | 'desktop' | 'tablet' {
	if (!ua) return 'desktop';
	if (ua.includes('iPhone') || (ua.includes('Android') && !ua.includes('Tablet'))) return 'mobile';
	if (ua.includes('iPad') || ua.includes('Tablet')) return 'tablet';
	return 'desktop';
}

/**
 * Format a user agent string as a display label (e.g. "Chrome · macOS").
 */
export function formatUserAgent(ua: string | null): string {
	const { browser, os } = parseUserAgent(ua);
	const parts = [browser, os].filter(Boolean);
	return parts.length > 0 ? parts.join(' \u00b7 ') : '';
}
