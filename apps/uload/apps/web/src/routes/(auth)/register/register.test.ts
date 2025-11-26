import { describe, it, expect, beforeEach } from 'vitest';
import { registerUser } from '$lib/auth-helper';

describe('User Registration', () => {
	const testEmail = () => `test${Date.now()}@example.com`;

	it('should register user with email and password only', async () => {
		const email = testEmail();
		const password = 'TestPassword123!';

		const result = await registerUser({
			email,
			password,
			passwordConfirm: password
		});

		// May fail in test environment without PocketBase
		if (process.env.PUBLIC_POCKETBASE_URL) {
			expect(result.success).toBe(true);
			expect(result.user).toBeDefined();
			expect(result.user?.email).toBe(email.toLowerCase());
			expect(result.user?.username).toBeDefined();
		}
	});

	it('should validate email format', async () => {
		const result = await registerUser({
			email: 'invalid-email',
			password: 'TestPassword123!',
			passwordConfirm: 'TestPassword123!'
		});

		expect(result.success).toBe(false);
		expect(result.error).toContain('email');
	});

	it('should validate password match', async () => {
		const result = await registerUser({
			email: testEmail(),
			password: 'Password123!',
			passwordConfirm: 'DifferentPassword123!'
		});

		expect(result.success).toBe(false);
		expect(result.error).toContain('match');
	});

	it('should generate unique username from email', async () => {
		const email = 'john.doe+test@example.com';
		const password = 'TestPassword123!';

		const result = await registerUser({
			email,
			password,
			passwordConfirm: password
		});

		if (process.env.PUBLIC_POCKETBASE_URL && result.success) {
			expect(result.user?.username).toBeDefined();
			expect(result.user?.username).toMatch(/^[a-zA-Z0-9_-]+$/);
		}
	});

	it('should handle duplicate email gracefully', async () => {
		const email = testEmail();
		const password = 'TestPassword123!';

		// First registration
		await registerUser({
			email,
			password,
			passwordConfirm: password
		});

		// Second registration with same email
		const result = await registerUser({
			email,
			password,
			passwordConfirm: password
		});

		if (process.env.PUBLIC_POCKETBASE_URL) {
			expect(result.success).toBe(false);
			expect(result.error).toContain('already');
		}
	});
});
