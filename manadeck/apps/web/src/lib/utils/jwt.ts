import type { JwtPayload, ManaUser } from '$lib/types/auth';

/**
 * Decode JWT token without verification (client-side only)
 */
export function decodeToken(token: string): JwtPayload | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) {
			return null;
		}

		const payload = parts[1];
		const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
		return decoded as JwtPayload;
	} catch (error) {
		console.error('Failed to decode token:', error);
		return null;
	}
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
	const decoded = decodeToken(token);
	if (!decoded || !decoded.exp) {
		return true;
	}

	const now = Math.floor(Date.now() / 1000);
	return decoded.exp < now;
}

/**
 * Get time until token expires (in seconds)
 */
export function getTokenExpiresIn(token: string): number {
	const decoded = decodeToken(token);
	if (!decoded || !decoded.exp) {
		return 0;
	}

	const now = Math.floor(Date.now() / 1000);
	return Math.max(0, decoded.exp - now);
}

/**
 * Extract user info from token
 */
export function getUserFromToken(token: string): ManaUser | null {
	const decoded = decodeToken(token);
	if (!decoded) {
		return null;
	}

	return {
		id: decoded.sub || decoded.user_id || '',
		email: decoded.email || '',
		role: decoded.role || 'user',
		organizationId: decoded.app_settings?.b2b?.organizationId
	};
}
