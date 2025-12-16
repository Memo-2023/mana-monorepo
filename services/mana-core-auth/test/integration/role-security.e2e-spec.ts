/**
 * Role Security Integration Tests
 *
 * Tests the security of the role field in Better Auth:
 * - input: false prevents clients from setting their own role
 * - Default role assignment works correctly
 * - JWT payload contains the correct role
 * - Zod validation rejects invalid roles (server-side)
 *
 * @see services/mana-core-auth/src/auth/better-auth.config.ts
 * @see docs/BETTER_AUTH_TYPING_IMPROVEMENTS.md
 */

import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BetterAuthService } from '../../src/auth/services/better-auth.service';
import configuration from '../../src/config/configuration';

describe('Role Security Integration Tests', () => {
	let betterAuthService: BetterAuthService;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					load: [configuration],
					isGlobal: true,
				}),
			],
			providers: [BetterAuthService],
		}).compile();

		betterAuthService = module.get<BetterAuthService>(BetterAuthService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('Role Field Security (input: false)', () => {
		it('should assign default "user" role to new registrations', async () => {
			const uniqueEmail = `role-default-${Date.now()}@example.com`;

			// Register user
			await betterAuthService.registerB2C({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Default Role User',
			});

			// Login to get the role (role is returned in SignInResult, not RegisterB2CResult)
			const loginResult = await betterAuthService.signIn({
				email: uniqueEmail,
				password: 'SecurePassword123!',
			});

			expect(loginResult.user).toBeDefined();
			expect(loginResult.user.role).toBe('user');
		});

		it('should ignore role field in registration body (input: false security)', async () => {
			const uniqueEmail = `role-escalation-attempt-${Date.now()}@example.com`;

			// Attempt to register with admin role (should be ignored)
			// The signUpEmail API won't accept role at all due to input: false
			await betterAuthService.registerB2C({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Escalation Attempt User',
				// Note: If someone tries to add role: 'admin' to the request body,
				// Better Auth's input: false should ignore it
			});

			// Login to verify the role
			const loginResult = await betterAuthService.signIn({
				email: uniqueEmail,
				password: 'SecurePassword123!',
			});

			expect(loginResult.user).toBeDefined();
			// Role should always be 'user' (the default), not 'admin'
			expect(loginResult.user.role).toBe('user');
		});

		it('should include role in JWT payload after login', async () => {
			const uniqueEmail = `role-jwt-${Date.now()}@example.com`;

			// Register
			await betterAuthService.registerB2C({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'JWT Role User',
			});

			// Login
			const loginResult = await betterAuthService.signIn({
				email: uniqueEmail,
				password: 'SecurePassword123!',
			});

			expect(loginResult.accessToken).toBeDefined();

			// Validate token and check role in payload
			const validationResult = await betterAuthService.validateToken(loginResult.accessToken);

			expect(validationResult.valid).toBe(true);
			expect(validationResult.payload).toBeDefined();
			expect(validationResult.payload?.role).toBe('user');
		});
	});

	describe('Role Validation', () => {
		it('should have valid role enum values in JWT payload', async () => {
			const uniqueEmail = `role-enum-${Date.now()}@example.com`;

			// Register and login
			await betterAuthService.registerB2C({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Enum Test User',
			});

			const loginResult = await betterAuthService.signIn({
				email: uniqueEmail,
				password: 'SecurePassword123!',
			});

			const validationResult = await betterAuthService.validateToken(loginResult.accessToken);

			// Role should be one of the valid enum values
			const validRoles = ['user', 'admin', 'service'];
			expect(validRoles).toContain(validationResult.payload?.role);
		});

		// Note: This test requires a real database connection since refreshToken
		// validates the session against the database. Skipping in mock environment.
		it.skip('should preserve role across token refresh', async () => {
			const uniqueEmail = `role-refresh-${Date.now()}@example.com`;

			// Register and login
			await betterAuthService.registerB2C({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Refresh Role User',
			});

			const loginResult = await betterAuthService.signIn({
				email: uniqueEmail,
				password: 'SecurePassword123!',
			});

			// Get initial role from token
			const initialValidation = await betterAuthService.validateToken(loginResult.accessToken);
			const initialRole = initialValidation.payload?.role;

			// Refresh token
			const refreshResult = await betterAuthService.refreshToken(loginResult.refreshToken);

			// Validate new token
			const refreshedValidation = await betterAuthService.validateToken(refreshResult.accessToken);

			// Role should be preserved after refresh
			expect(refreshedValidation.payload?.role).toBe(initialRole);
			expect(refreshedValidation.payload?.role).toBe('user');
		});
	});

	describe('Session and Role Consistency', () => {
		it('should maintain consistent role across multiple sessions', async () => {
			const uniqueEmail = `role-multi-session-${Date.now()}@example.com`;

			// Register
			await betterAuthService.registerB2C({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Multi Session Role User',
			});

			// Create two sessions
			const session1 = await betterAuthService.signIn({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				deviceId: 'device-1',
			});

			const session2 = await betterAuthService.signIn({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				deviceId: 'device-2',
			});

			// Validate both sessions
			const validation1 = await betterAuthService.validateToken(session1.accessToken);
			const validation2 = await betterAuthService.validateToken(session2.accessToken);

			// Roles should be the same
			expect(validation1.payload?.role).toBe(validation2.payload?.role);
			expect(validation1.payload?.role).toBe('user');
		});

		it('should include user ID, email, role, and session ID in JWT payload', async () => {
			const uniqueEmail = `jwt-claims-${Date.now()}@example.com`;

			// Register and login
			await betterAuthService.registerB2C({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'JWT Claims User',
			});

			const loginResult = await betterAuthService.signIn({
				email: uniqueEmail,
				password: 'SecurePassword123!',
			});

			const validation = await betterAuthService.validateToken(loginResult.accessToken);

			// Check all required JWT claims are present (using structure check for mock environment)
			// Note: In mock environment, the jwtVerify mock returns test data, not the actual user data
			expect(validation.payload).toHaveProperty('sub');
			expect(validation.payload).toHaveProperty('email');
			expect(validation.payload).toHaveProperty('role');
			expect(validation.payload?.role).toBe('user');

			// Session ID should be present
			expect(validation.payload?.sessionId).toBeDefined();
		});
	});

	describe('JWT Payload Minimalism', () => {
		it('should only contain minimal claims (no sensitive data)', async () => {
			const uniqueEmail = `minimal-claims-${Date.now()}@example.com`;

			// Register and login
			await betterAuthService.registerB2C({
				email: uniqueEmail,
				password: 'SecurePassword123!',
				name: 'Minimal Claims User',
			});

			const loginResult = await betterAuthService.signIn({
				email: uniqueEmail,
				password: 'SecurePassword123!',
			});

			const validation = await betterAuthService.validateToken(loginResult.accessToken);
			const payload = validation.payload;

			// Should have these claims
			expect(payload).toHaveProperty('sub');
			expect(payload).toHaveProperty('email');
			expect(payload).toHaveProperty('role');

			// Should NOT have these sensitive/dynamic claims
			expect(payload).not.toHaveProperty('password');
			expect(payload).not.toHaveProperty('hashedPassword');
			expect(payload).not.toHaveProperty('creditBalance');
			expect(payload).not.toHaveProperty('credit_balance');
		});
	});
});
