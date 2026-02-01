import type { MatrixCredentials, LoginResult } from './types';

/**
 * Login with username and password
 */
export async function loginWithPassword(
	homeserver: string,
	username: string,
	password: string
): Promise<LoginResult> {
	// Load polyfills first
	await import('./polyfills');
	const { createClient } = await import('matrix-js-sdk');

	// Normalize homeserver URL
	let baseUrl = homeserver.trim();
	if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
		baseUrl = `https://${baseUrl}`;
	}
	// Remove trailing slash
	baseUrl = baseUrl.replace(/\/$/, '');

	const tempClient = createClient({ baseUrl });

	try {
		const response = await tempClient.login('m.login.password', {
			user: username,
			password: password,
			initial_device_display_name: 'Manalink',
		});

		return {
			success: true,
			credentials: {
				homeserver: baseUrl,
				accessToken: response.access_token,
				userId: response.user_id,
				deviceId: response.device_id,
			},
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Login failed';

		// Provide more helpful error messages
		if (message.includes('M_FORBIDDEN')) {
			return { success: false, error: 'Invalid username or password' };
		}
		if (message.includes('M_USER_DEACTIVATED')) {
			return { success: false, error: 'This account has been deactivated' };
		}
		if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
			return { success: false, error: 'Could not connect to homeserver' };
		}

		return { success: false, error: message };
	}
}

/**
 * Login with an existing access token (for SSO/OAuth flows)
 */
export async function loginWithToken(
	homeserver: string,
	accessToken: string,
	userId: string,
	deviceId?: string
): Promise<LoginResult> {
	// Normalize homeserver URL
	let baseUrl = homeserver.trim();
	if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
		baseUrl = `https://${baseUrl}`;
	}
	baseUrl = baseUrl.replace(/\/$/, '');

	return {
		success: true,
		credentials: {
			homeserver: baseUrl,
			accessToken,
			userId,
			deviceId: deviceId || `MANA_${Date.now()}`,
		},
	};
}

/**
 * Discover homeserver from user ID or domain
 * Uses .well-known discovery
 */
export async function discoverHomeserver(userIdOrDomain: string): Promise<string | null> {
	// Extract domain from user ID if provided
	let domain = userIdOrDomain;
	if (userIdOrDomain.startsWith('@')) {
		const parts = userIdOrDomain.split(':');
		if (parts.length < 2) return null;
		domain = parts[1];
	}

	// Remove any protocol prefix
	domain = domain.replace(/^https?:\/\//, '');

	try {
		// Try .well-known discovery
		const wellKnownUrl = `https://${domain}/.well-known/matrix/client`;
		const response = await fetch(wellKnownUrl);

		if (response.ok) {
			const data = await response.json();
			const baseUrl = data['m.homeserver']?.base_url;
			if (baseUrl) {
				return baseUrl.replace(/\/$/, '');
			}
		}
	} catch {
		// .well-known not available
	}

	// Fallback: assume homeserver is at the domain
	return `https://${domain}`;
}

/**
 * Check if a homeserver is reachable
 */
export async function checkHomeserver(
	homeserver: string
): Promise<{ ok: boolean; error?: string }> {
	let baseUrl = homeserver.trim();
	if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
		baseUrl = `https://${baseUrl}`;
	}

	try {
		const response = await fetch(`${baseUrl}/_matrix/client/versions`, {
			method: 'GET',
		});

		if (response.ok) {
			return { ok: true };
		}

		return { ok: false, error: `Server returned ${response.status}` };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : 'Could not connect to server',
		};
	}
}

/**
 * Register a new account (if registration is open)
 */
export async function register(
	homeserver: string,
	username: string,
	password: string
): Promise<LoginResult> {
	await import('./polyfills');
	const { createClient } = await import('matrix-js-sdk');

	let baseUrl = homeserver.trim();
	if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
		baseUrl = `https://${baseUrl}`;
	}
	baseUrl = baseUrl.replace(/\/$/, '');

	const tempClient = createClient({ baseUrl });

	try {
		const response = await tempClient.register(username, password, null, {
			initial_device_display_name: 'Manalink',
		} as any);

		return {
			success: true,
			credentials: {
				homeserver: baseUrl,
				accessToken: response.access_token!,
				userId: response.user_id,
				deviceId: response.device_id!,
			},
		};
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Registration failed';

		// Check for common errors
		if (message.includes('M_USER_IN_USE')) {
			return { success: false, error: 'Username is already taken' };
		}
		if (message.includes('M_INVALID_USERNAME')) {
			return { success: false, error: 'Invalid username format' };
		}
		if (message.includes('M_FORBIDDEN')) {
			return { success: false, error: 'Registration is disabled on this server' };
		}

		return { success: false, error: message };
	}
}
