/**
 * SSO Configuration Tests
 *
 * Validates that the Better Auth configuration correctly supports
 * cross-subdomain SSO for all apps in the monorepo.
 *
 * These tests ensure that:
 * 1. All active apps are listed in trustedOrigins
 * 2. Cookie domain configuration is correct for SSO
 * 3. CORS_ORIGINS in docker-compose matches trustedOrigins
 */

import * as fs from 'fs';
import * as path from 'path';

describe('SSO Configuration', () => {
	const configPath = path.resolve(__dirname, 'better-auth.config.ts');
	let configContent: string;

	beforeAll(() => {
		configContent = fs.readFileSync(configPath, 'utf8');
	});

	describe('trustedOrigins', () => {
		/**
		 * All apps that have a web frontend with SSO support.
		 * When adding a new app, add it here AND to trustedOrigins in better-auth.config.ts.
		 */
		const APPS_WITH_SSO = [
			'calendar',
			'chat',
			'clock',
			'contacts',
			'context',
			'manadeck',
			'matrix',
			'mukke',
			'nutriphi',
			'photos',
			'picture',
			'planta',
			'presi',
			'questions',
			'skilltree',
			'storage',
			'todo',
			'traces',
			'zitare',
		];

		it.each(APPS_WITH_SSO)('should include %s.mana.how in trustedOrigins', (appName) => {
			expect(configContent).toContain(`https://${appName}.mana.how`);
		});

		it('should include the auth service itself', () => {
			expect(configContent).toContain('https://auth.mana.how');
		});

		it('should include the main domain', () => {
			expect(configContent).toContain('https://mana.how');
		});

		it('should include localhost for development', () => {
			expect(configContent).toContain('http://localhost:5173');
			expect(configContent).toContain('http://localhost:3001');
		});
	});

	describe('cookie configuration', () => {
		it('should use "mana" cookie prefix', () => {
			expect(configContent).toContain("cookiePrefix: 'mana'");
		});

		it('should enable crossSubDomainCookies based on COOKIE_DOMAIN env', () => {
			expect(configContent).toContain('enabled: !!process.env.COOKIE_DOMAIN');
		});

		it('should use COOKIE_DOMAIN for the cookie domain', () => {
			expect(configContent).toContain('domain: process.env.COOKIE_DOMAIN');
		});

		it('should use sameSite lax for cross-subdomain navigation', () => {
			expect(configContent).toContain("sameSite: 'lax'");
		});

		it('should set httpOnly to protect cookies from JS access', () => {
			expect(configContent).toContain('httpOnly: true');
		});
	});

	describe('docker-compose alignment', () => {
		const dockerComposePath = path.resolve(__dirname, '../../../../docker-compose.macmini.yml');

		it('should have COOKIE_DOMAIN set to .mana.how in production docker-compose', () => {
			if (!fs.existsSync(dockerComposePath)) {
				// Skip if docker-compose not available (e.g., in CI)
				return;
			}
			const dockerContent = fs.readFileSync(dockerComposePath, 'utf8');
			expect(dockerContent).toContain('COOKIE_DOMAIN: .mana.how');
		});

		it('should have CORS_ORIGINS in docker-compose for mana-auth', () => {
			if (!fs.existsSync(dockerComposePath)) {
				return;
			}
			const dockerContent = fs.readFileSync(dockerComposePath, 'utf8');
			// All SSO apps should be in the CORS_ORIGINS
			const appsToCheck = [
				'calendar',
				'chat',
				'clock',
				'contacts',
				'mukke',
				'nutriphi',
				'photos',
				'picture',
				'planta',
				'presi',
				'questions',
				'skilltree',
				'storage',
				'todo',
				'zitare',
			];

			for (const app of appsToCheck) {
				expect(dockerContent).toContain(`https://${app}.mana.how`);
			}
		});
	});
});

describe('sessionToToken cookie detection', () => {
	it('should look for mana-prefixed cookies when COOKIE_DOMAIN is set', () => {
		const servicePath = path.resolve(__dirname, 'services/better-auth.service.ts');
		const serviceContent = fs.readFileSync(servicePath, 'utf8');

		// Verify cookie name detection logic
		expect(serviceContent).toContain(
			"const cookiePrefix = process.env.COOKIE_DOMAIN ? 'mana' : 'better-auth'"
		);
		expect(serviceContent).toContain('__Secure-${cookiePrefix}.session_token');
		expect(serviceContent).toContain('${cookiePrefix}.session_token');
	});
});
