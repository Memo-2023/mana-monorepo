/**
 * SSO sessionToToken Contract Tests
 *
 * Validates the session-to-token exchange logic that powers cross-app SSO.
 * Tests cookie name detection, which is the critical piece that must match
 * between the client (trySSO) and server (sessionToToken).
 *
 * Flow:
 * 1. User logs in on app A → session cookie set with Domain=.mana.how
 * 2. User visits app B → browser sends the session cookie
 * 3. App B calls GET /api/auth/get-session (credentials: include)
 * 4. App B calls POST /api/v1/auth/session-to-token → gets JWT tokens
 * 5. JWT tokens stored in localStorage → user is authenticated
 */

import * as fs from 'fs';
import * as path from 'path';

describe('SSO sessionToToken contract', () => {
	const servicePath = path.resolve(__dirname, 'services/better-auth.service.ts');
	const authServiceClientPath = path.resolve(
		__dirname,
		'../../../../packages/shared-auth/src/core/authService.ts'
	);
	let serviceContent: string;
	let clientContent: string;

	beforeAll(() => {
		serviceContent = fs.readFileSync(servicePath, 'utf8');
		clientContent = fs.readFileSync(authServiceClientPath, 'utf8');
	});

	describe('cookie name detection (server side)', () => {
		it('should use "mana" prefix when COOKIE_DOMAIN is set', () => {
			// The server determines the cookie name based on COOKIE_DOMAIN
			expect(serviceContent).toContain(
				"const cookiePrefix = process.env.COOKIE_DOMAIN ? 'mana' : 'better-auth'"
			);
		});

		it('should check both __Secure- and non-secure cookie names', () => {
			expect(serviceContent).toContain('__Secure-${cookiePrefix}.session_token');
			expect(serviceContent).toContain('${cookiePrefix}.session_token');
		});

		it('should try the secure cookie first, then fallback', () => {
			// The order matters: __Secure- prefix is used in production (HTTPS)
			expect(serviceContent).toContain(
				'req.cookies?.[sessionCookieName] || req.cookies?.[fallbackCookieName]'
			);
		});
	});

	describe('client-server contract alignment', () => {
		it('client should call get-session with credentials: include', () => {
			expect(clientContent).toContain("credentials: 'include'");
			expect(clientContent).toContain("method: 'GET'");
			// The get-session endpoint
			expect(clientContent).toContain('endpoints.getSession');
		});

		it('client should call session-to-token with credentials: include', () => {
			expect(clientContent).toContain('/api/v1/auth/session-to-token');
			// Check that the session-to-token call uses credentials: include
			const tokenFetchMatch = clientContent.match(/session-to-token.*?credentials:\s*'include'/s);
			expect(tokenFetchMatch).not.toBeNull();
		});

		it('server should expose session-to-token endpoint', () => {
			const controllerPath = path.resolve(__dirname, 'auth.controller.ts');
			const controllerContent = fs.readFileSync(controllerPath, 'utf8');
			expect(controllerContent).toContain('sessionToToken');
		});

		it('client should store accessToken and refreshToken from response', () => {
			expect(clientContent).toContain('tokenData.accessToken');
			expect(clientContent).toContain('tokenData.refreshToken');
		});

		it('server should return accessToken and refreshToken', () => {
			// The service method should return an object with these fields
			expect(serviceContent).toContain('accessToken');
			expect(serviceContent).toContain('refreshToken');
		});
	});

	describe('SSO error handling', () => {
		it('client should handle get-session failure gracefully', () => {
			expect(clientContent).toContain('No SSO session found');
		});

		it('client should handle token exchange failure gracefully', () => {
			expect(clientContent).toContain('Token exchange not available');
		});

		it('client should handle missing tokens in response', () => {
			expect(clientContent).toContain('Invalid token response');
		});

		it('client should catch and return network errors', () => {
			// trySSO should not throw - it returns { success: false, error: ... }
			expect(clientContent).toContain('SSO check failed');
		});

		it('server should throw UnauthorizedException when no cookie found', () => {
			expect(serviceContent).toContain('No session cookie found');
			expect(serviceContent).toContain('UnauthorizedException');
		});

		it('server should throw UnauthorizedException for invalid sessions', () => {
			expect(serviceContent).toContain('Invalid or expired session');
		});
	});

	describe('main.ts route configuration', () => {
		it('should exclude get-session from global API prefix', () => {
			const mainPath = path.resolve(__dirname, '../main.ts');
			const mainContent = fs.readFileSync(mainPath, 'utf8');
			// get-session must be excluded from the /api/v1 prefix because
			// Better Auth serves it at /api/auth/get-session (not /api/v1/api/auth/get-session)
			expect(mainContent).toContain('api/auth/get-session');
		});
	});
});

describe('SSO cookie configuration alignment', () => {
	it('cookie prefix in config should match cookie detection in sessionToToken', () => {
		const configPath = path.resolve(__dirname, 'better-auth.config.ts');
		const servicePath = path.resolve(__dirname, 'services/better-auth.service.ts');

		const configContent = fs.readFileSync(configPath, 'utf8');
		const serviceContent = fs.readFileSync(servicePath, 'utf8');

		// Config sets cookiePrefix to 'mana'
		expect(configContent).toContain("cookiePrefix: 'mana'");

		// sessionToToken uses 'mana' when COOKIE_DOMAIN is set
		// This must match! If config uses 'mana' but detection uses something else, SSO breaks.
		expect(serviceContent).toContain("process.env.COOKIE_DOMAIN ? 'mana'");
	});

	it('.env.example should document COOKIE_DOMAIN', () => {
		const envExamplePath = path.resolve(__dirname, '../../.env.example');
		const envContent = fs.readFileSync(envExamplePath, 'utf8');
		expect(envContent).toContain('COOKIE_DOMAIN');
		expect(envContent).toContain('.mana.how');
	});
});
