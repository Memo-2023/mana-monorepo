import type { MatrixCredentials, LoginResult } from './types';

function normalizeHomeserver(homeserver: string): string {
	let url = homeserver.trim();
	if (!url.startsWith('http://') && !url.startsWith('https://')) {
		url = `https://${url}`;
	}
	return url.replace(/\/$/, '');
}

export async function loginWithPassword(
	homeserver: string,
	username: string,
	password: string,
): Promise<LoginResult> {
	await import('./polyfills');
	const { createClient } = await import('matrix-js-sdk');

	const baseUrl = normalizeHomeserver(homeserver);
	const tempClient = createClient({ baseUrl });

	try {
		const response = await tempClient.login('m.login.password', {
			user: username,
			password,
			initial_device_display_name: 'Manalink Mobile',
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
		if (message.includes('M_FORBIDDEN')) return { success: false, error: 'Invalid username or password' };
		if (message.includes('M_USER_DEACTIVATED')) return { success: false, error: 'Account is deactivated' };
		if (message.includes('Failed to fetch') || message.includes('Network')) {
			return { success: false, error: 'Could not connect to homeserver' };
		}
		return { success: false, error: message };
	}
}

export async function loginWithToken(
	homeserver: string,
	accessToken: string,
	userId: string,
	deviceId?: string,
): Promise<LoginResult> {
	const baseUrl = normalizeHomeserver(homeserver);
	return {
		success: true,
		credentials: {
			homeserver: baseUrl,
			accessToken,
			userId,
			deviceId: deviceId ?? `MANALINK_${Date.now()}`,
		},
	};
}

export async function checkHomeserver(homeserver: string): Promise<{ ok: boolean; error?: string }> {
	const baseUrl = normalizeHomeserver(homeserver);
	try {
		const response = await fetch(`${baseUrl}/_matrix/client/versions`);
		if (response.ok) return { ok: true };
		return { ok: false, error: `Server returned ${response.status}` };
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : 'Could not connect' };
	}
}

export async function discoverHomeserver(userIdOrDomain: string): Promise<string | null> {
	let domain = userIdOrDomain;
	if (userIdOrDomain.startsWith('@')) {
		const parts = userIdOrDomain.split(':');
		if (parts.length < 2) return null;
		domain = parts[1];
	}
	domain = domain.replace(/^https?:\/\//, '');

	try {
		const response = await fetch(`https://${domain}/.well-known/matrix/client`);
		if (response.ok) {
			const data = await response.json();
			const baseUrl = data['m.homeserver']?.base_url;
			if (baseUrl) return baseUrl.replace(/\/$/, '');
		}
	} catch {
		// .well-known not available
	}

	return `https://${domain}`;
}
