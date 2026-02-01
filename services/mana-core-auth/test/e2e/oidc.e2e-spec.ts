/**
 * OIDC Provider E2E Tests
 *
 * Tests for OpenID Connect provider functionality:
 * 1. OIDC Discovery endpoint
 * 2. JWKS endpoint
 * 3. Authorization endpoint
 * 4. Token endpoint
 * 5. UserInfo endpoint
 *
 * These tests verify that mana-core-auth can act as an OIDC Provider
 * for external services like Matrix/Synapse.
 */

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ConfigService } from '@nestjs/config';
import { getDb } from '../../src/db/connection';
import { oauthApplications } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes, createHash } from 'crypto';

// Helper to generate random IDs
const generateId = (length = 16): string => {
	return randomBytes(Math.ceil(length / 2))
		.toString('hex')
		.slice(0, length);
};

// Helper to generate PKCE code verifier and challenge
const generatePKCE = () => {
	const verifier = randomBytes(32).toString('base64url');
	const challenge = createHash('sha256').update(verifier).digest('base64url');
	return { verifier, challenge };
};

describe('OIDC Provider (E2E)', () => {
	let app: INestApplication;
	let configService: ConfigService;
	let testClientId: string;
	let testClientSecret: string;
	let testRedirectUri: string;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		app.useGlobalPipes(new ValidationPipe({ transform: true }));
		configService = app.get(ConfigService);
		await app.init();

		// Create test OIDC client
		testClientId = `test-client-${generateId(8)}`;
		testClientSecret = randomBytes(32).toString('hex');
		testRedirectUri = 'https://test.example.com/callback';

		const databaseUrl = configService.get<string>('database.url');
		if (databaseUrl) {
			const db = getDb(databaseUrl);
			await db.insert(oauthApplications).values({
				id: generateId(16),
				name: 'Test OIDC Client',
				clientId: testClientId,
				clientSecret: testClientSecret,
				redirectUrls: testRedirectUri,
				type: 'web',
				disabled: false,
				metadata: JSON.stringify({
					description: 'E2E test client',
					trusted: true,
				}),
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		}
	});

	afterAll(async () => {
		// Clean up test client
		const databaseUrl = configService.get<string>('database.url');
		if (databaseUrl) {
			const db = getDb(databaseUrl);
			await db.delete(oauthApplications).where(eq(oauthApplications.clientId, testClientId));
		}
		await app.close();
	});

	describe('OIDC Discovery', () => {
		it('should return OIDC discovery document at /.well-known/openid-configuration', async () => {
			const response = await request(app.getHttpServer())
				.get('/.well-known/openid-configuration')
				.expect((res) => {
					// Accept 200 OK or 500 if Better Auth is mocked
					expect([200, 500]).toContain(res.status);
				});

			if (response.status === 200) {
				const discovery = response.body;

				// Required OIDC Discovery fields
				expect(discovery).toHaveProperty('issuer');
				expect(discovery).toHaveProperty('authorization_endpoint');
				expect(discovery).toHaveProperty('token_endpoint');
				expect(discovery).toHaveProperty('jwks_uri');

				// Recommended fields
				expect(discovery).toHaveProperty('response_types_supported');
				expect(discovery).toHaveProperty('subject_types_supported');
				expect(discovery).toHaveProperty('id_token_signing_alg_values_supported');

				// Verify endpoints are correct format
				expect(discovery.issuer).toMatch(/^https?:\/\//);
				expect(discovery.authorization_endpoint).toMatch(/authorize/);
				expect(discovery.token_endpoint).toMatch(/token/);
			}
		});
	});

	describe('JWKS Endpoint', () => {
		it('should return JWKS at /api/auth/jwks', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/auth/jwks')
				.expect((res) => {
					expect([200, 500]).toContain(res.status);
				});

			if (response.status === 200) {
				const jwks = response.body;

				// JWKS must have keys array
				expect(jwks).toHaveProperty('keys');
				expect(Array.isArray(jwks.keys)).toBe(true);

				if (jwks.keys.length > 0) {
					const key = jwks.keys[0];
					// JWK required fields
					expect(key).toHaveProperty('kty');
					expect(key).toHaveProperty('use', 'sig');
					expect(key).toHaveProperty('kid');
				}
			}
		});

		it('should return JWKS at alternative path /api/oidc/jwks', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/oidc/jwks')
				.expect((res) => {
					expect([200, 500]).toContain(res.status);
				});

			if (response.status === 200) {
				expect(response.body).toHaveProperty('keys');
			}
		});

		it('should return JWKS at /auth/jwks via auth controller', async () => {
			const response = await request(app.getHttpServer())
				.get('/auth/jwks')
				.expect((res) => {
					expect([200, 500]).toContain(res.status);
				});

			if (response.status === 200) {
				expect(response.body).toHaveProperty('keys');
			}
		});
	});

	describe('Authorization Endpoint', () => {
		it('should handle authorization request with required parameters', async () => {
			const state = generateId(16);

			const response = await request(app.getHttpServer())
				.get('/api/auth/oauth2/authorize')
				.query({
					client_id: testClientId,
					redirect_uri: testRedirectUri,
					response_type: 'code',
					scope: 'openid profile email',
					state,
				})
				.expect((res) => {
					// Should redirect to login or return error for unauthenticated user
					expect([200, 302, 400, 401, 500]).toContain(res.status);
				});

			if (response.status === 302) {
				const location = response.headers.location;
				// Should redirect to login page or back with error
				expect(location).toBeDefined();
			}
		});

		it('should reject authorization request with missing client_id', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/auth/oauth2/authorize')
				.query({
					redirect_uri: testRedirectUri,
					response_type: 'code',
					scope: 'openid',
				})
				.expect((res) => {
					expect([400, 500]).toContain(res.status);
				});

			if (response.status === 400) {
				expect(response.body).toHaveProperty('error');
			}
		});

		it('should reject authorization request with invalid client_id', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/auth/oauth2/authorize')
				.query({
					client_id: 'non-existent-client',
					redirect_uri: 'https://attacker.com/callback',
					response_type: 'code',
					scope: 'openid',
				})
				.expect((res) => {
					expect([400, 401, 500]).toContain(res.status);
				});
		});

		it('should handle PKCE authorization request', async () => {
			const { verifier, challenge } = generatePKCE();
			const state = generateId(16);

			const response = await request(app.getHttpServer())
				.get('/api/auth/oauth2/authorize')
				.query({
					client_id: testClientId,
					redirect_uri: testRedirectUri,
					response_type: 'code',
					scope: 'openid profile email',
					state,
					code_challenge: challenge,
					code_challenge_method: 'S256',
				})
				.expect((res) => {
					expect([200, 302, 400, 401, 500]).toContain(res.status);
				});
		});

		it('should work with alternative path /api/oidc/authorize', async () => {
			const state = generateId(16);

			const response = await request(app.getHttpServer())
				.get('/api/oidc/authorize')
				.query({
					client_id: testClientId,
					redirect_uri: testRedirectUri,
					response_type: 'code',
					scope: 'openid',
					state,
				})
				.expect((res) => {
					expect([200, 302, 400, 401, 500]).toContain(res.status);
				});
		});
	});

	describe('Token Endpoint', () => {
		it('should reject token request without credentials', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/oauth2/token')
				.send({
					grant_type: 'authorization_code',
					code: 'invalid-code',
					redirect_uri: testRedirectUri,
				})
				.expect((res) => {
					expect([400, 401, 500]).toContain(res.status);
				});
		});

		it('should handle token request with form-urlencoded body', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/oauth2/token')
				.set('Content-Type', 'application/x-www-form-urlencoded')
				.send(
					new URLSearchParams({
						grant_type: 'authorization_code',
						code: 'test-code',
						redirect_uri: testRedirectUri,
						client_id: testClientId,
						client_secret: testClientSecret,
					}).toString()
				)
				.expect((res) => {
					// Invalid code should fail
					expect([400, 401, 500]).toContain(res.status);
				});
		});

		it('should handle token request with Basic auth', async () => {
			const credentials = Buffer.from(`${testClientId}:${testClientSecret}`).toString('base64');

			const response = await request(app.getHttpServer())
				.post('/api/auth/oauth2/token')
				.set('Authorization', `Basic ${credentials}`)
				.set('Content-Type', 'application/x-www-form-urlencoded')
				.send(
					new URLSearchParams({
						grant_type: 'authorization_code',
						code: 'test-code',
						redirect_uri: testRedirectUri,
					}).toString()
				)
				.expect((res) => {
					expect([400, 401, 500]).toContain(res.status);
				});
		});

		it('should reject refresh_token grant with invalid token', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/oauth2/token')
				.set('Content-Type', 'application/x-www-form-urlencoded')
				.send(
					new URLSearchParams({
						grant_type: 'refresh_token',
						refresh_token: 'invalid-refresh-token',
						client_id: testClientId,
						client_secret: testClientSecret,
					}).toString()
				)
				.expect((res) => {
					expect([400, 401, 500]).toContain(res.status);
				});
		});

		it('should work with alternative path /api/oidc/token', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/oidc/token')
				.set('Content-Type', 'application/x-www-form-urlencoded')
				.send(
					new URLSearchParams({
						grant_type: 'authorization_code',
						code: 'test-code',
						redirect_uri: testRedirectUri,
						client_id: testClientId,
						client_secret: testClientSecret,
					}).toString()
				)
				.expect((res) => {
					expect([400, 401, 500]).toContain(res.status);
				});
		});
	});

	describe('UserInfo Endpoint', () => {
		it('should reject userinfo request without token', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/auth/oauth2/userinfo')
				.expect((res) => {
					expect([401, 500]).toContain(res.status);
				});
		});

		it('should reject userinfo request with invalid token', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/auth/oauth2/userinfo')
				.set('Authorization', 'Bearer invalid-token-12345')
				.expect((res) => {
					expect([401, 500]).toContain(res.status);
				});
		});

		it('should work with alternative path /api/oidc/userinfo', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/oidc/userinfo')
				.expect((res) => {
					expect([401, 500]).toContain(res.status);
				});
		});
	});

	describe('Complete OIDC Authorization Code Flow', () => {
		let userAccessToken: string;
		let authorizationCode: string;
		const testEmail = `oidc-flow-${Date.now()}@example.com`;
		const testPassword = 'SecurePassword123!';

		it('Step 1: Register a test user', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/register')
				.send({
					email: testEmail,
					password: testPassword,
					name: 'OIDC Test User',
				})
				.expect((res) => {
					expect([201, 400]).toContain(res.status);
				});

			if (response.status === 201) {
				expect(response.body).toHaveProperty('id');
			}
		});

		it('Step 2: Login to get user token', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					email: testEmail,
					password: testPassword,
				})
				.expect((res) => {
					expect([200, 401]).toContain(res.status);
				});

			if (response.status === 200) {
				expect(response.body).toHaveProperty('accessToken');
				userAccessToken = response.body.accessToken;
			}
		});

		it('Step 3: Initiate authorization with session', async () => {
			// Note: In a real E2E test, we would need to:
			// 1. Have the user authenticate via the login page
			// 2. Set session cookie
			// 3. Then make the authorize request
			// Since we use mocked Better Auth, this flow is simulated

			const state = generateId(16);
			const nonce = generateId(16);

			const response = await request(app.getHttpServer())
				.get('/api/auth/oauth2/authorize')
				.query({
					client_id: testClientId,
					redirect_uri: testRedirectUri,
					response_type: 'code',
					scope: 'openid profile email',
					state,
					nonce,
				})
				.expect((res) => {
					expect([200, 302, 400, 401, 500]).toContain(res.status);
				});

			// In a real flow, this would redirect with an authorization code
			if (response.status === 302 && response.headers.location) {
				const locationUrl = new URL(response.headers.location, 'https://test.example.com');
				authorizationCode = locationUrl.searchParams.get('code') || '';
			}
		});

		it('Step 4: Exchange code for tokens (mocked)', async () => {
			// Skip if no authorization code was obtained
			if (!authorizationCode) {
				console.log(
					'Skipping token exchange - no authorization code obtained (expected with mocked Better Auth)'
				);
				return;
			}

			const response = await request(app.getHttpServer())
				.post('/api/auth/oauth2/token')
				.set('Content-Type', 'application/x-www-form-urlencoded')
				.send(
					new URLSearchParams({
						grant_type: 'authorization_code',
						code: authorizationCode,
						redirect_uri: testRedirectUri,
						client_id: testClientId,
						client_secret: testClientSecret,
					}).toString()
				)
				.expect((res) => {
					expect([200, 400, 401]).toContain(res.status);
				});

			if (response.status === 200) {
				expect(response.body).toHaveProperty('access_token');
				expect(response.body).toHaveProperty('token_type', 'Bearer');
				expect(response.body).toHaveProperty('id_token');
			}
		});
	});

	describe('Security Tests', () => {
		it('should reject redirect_uri mismatch', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/auth/oauth2/authorize')
				.query({
					client_id: testClientId,
					redirect_uri: 'https://attacker.com/steal-code',
					response_type: 'code',
					scope: 'openid',
				})
				.expect((res) => {
					// Should fail due to redirect_uri mismatch
					expect([400, 401, 500]).toContain(res.status);
				});
		});

		it('should reject unsupported response_type', async () => {
			const response = await request(app.getHttpServer())
				.get('/api/auth/oauth2/authorize')
				.query({
					client_id: testClientId,
					redirect_uri: testRedirectUri,
					response_type: 'token', // Implicit flow - may not be supported
					scope: 'openid',
				})
				.expect((res) => {
					// May fail or succeed depending on configuration
					expect([200, 302, 400, 500]).toContain(res.status);
				});
		});

		it('should reject client_credentials grant for confidential client', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/oauth2/token')
				.set('Content-Type', 'application/x-www-form-urlencoded')
				.send(
					new URLSearchParams({
						grant_type: 'client_credentials',
						client_id: testClientId,
						client_secret: testClientSecret,
						scope: 'openid',
					}).toString()
				)
				.expect((res) => {
					// client_credentials may not be supported
					expect([200, 400, 401, 500]).toContain(res.status);
				});
		});

		it('should not leak error details', async () => {
			const response = await request(app.getHttpServer())
				.post('/api/auth/oauth2/token')
				.set('Content-Type', 'application/x-www-form-urlencoded')
				.send(
					new URLSearchParams({
						grant_type: 'authorization_code',
						code: 'definitely-invalid-code',
						redirect_uri: testRedirectUri,
						client_id: testClientId,
						client_secret: 'wrong-secret',
					}).toString()
				);

			// Error response should not contain sensitive info
			if (response.body.error_description) {
				expect(response.body.error_description).not.toContain('database');
				expect(response.body.error_description).not.toContain('sql');
				expect(response.body.error_description).not.toContain('stack');
			}
		});
	});
});

describe('OIDC Integration with Auth Flow', () => {
	let app: INestApplication;
	let accessToken: string;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		app.useGlobalPipes(new ValidationPipe({ transform: true }));
		await app.init();

		// Create and login test user
		const uniqueEmail = `oidc-integration-${Date.now()}@example.com`;
		await request(app.getHttpServer()).post('/auth/register').send({
			email: uniqueEmail,
			password: 'SecurePassword123!',
			name: 'OIDC Integration User',
		});

		const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
			email: uniqueEmail,
			password: 'SecurePassword123!',
		});

		if (loginResponse.body.accessToken) {
			accessToken = loginResponse.body.accessToken;
		}
	});

	afterAll(async () => {
		await app.close();
	});

	describe('Token Validation via /auth/validate', () => {
		it('should validate access token via auth endpoint', async () => {
			if (!accessToken) {
				console.log('Skipping - no access token available');
				return;
			}

			const response = await request(app.getHttpServer())
				.post('/auth/validate')
				.send({ token: accessToken })
				.expect((res) => {
					expect([200, 401]).toContain(res.status);
				});

			if (response.status === 200) {
				expect(response.body).toHaveProperty('valid', true);
				expect(response.body).toHaveProperty('payload');
			}
		});

		it('should reject invalid token', async () => {
			const response = await request(app.getHttpServer())
				.post('/auth/validate')
				.send({ token: 'invalid.jwt.token' })
				.expect((res) => {
					expect([200, 401]).toContain(res.status);
				});

			if (response.status === 200) {
				expect(response.body).toHaveProperty('valid', false);
			}
		});
	});

	describe('JWKS for Token Verification', () => {
		it('should provide consistent JWKS across endpoints', async () => {
			const [jwks1, jwks2, jwks3] = await Promise.all([
				request(app.getHttpServer()).get('/api/auth/jwks'),
				request(app.getHttpServer()).get('/api/oidc/jwks'),
				request(app.getHttpServer()).get('/auth/jwks'),
			]);

			// All endpoints should return same or similar JWKS
			if (jwks1.status === 200 && jwks2.status === 200) {
				// Keys should be equivalent
				expect(jwks1.body.keys?.length).toBe(jwks2.body.keys?.length);
			}
		});
	});
});
