import { describe, it, expect } from 'vitest';
import { validateUsername, generateUsernameFromEmail, RESERVED_USERNAMES } from './username';

describe('Username Utilities', () => {
	describe('validateUsername', () => {
		it('should accept valid usernames', () => {
			const validUsernames = [
				'john_doe',
				'user123',
				'test-user',
				'JohnDoe',
				'a1b2c3',
				'user_name-123'
			];

			validUsernames.forEach((username) => {
				const result = validateUsername(username);
				expect(result.valid).toBe(true);
				expect(result.error).toBeUndefined();
			});
		});

		it('should reject usernames shorter than 3 characters', () => {
			const result = validateUsername('ab');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('at least 3 characters');
		});

		it('should reject usernames longer than 30 characters', () => {
			const longUsername = 'a'.repeat(31);
			const result = validateUsername(longUsername);
			expect(result.valid).toBe(false);
			expect(result.error).toContain('less than 30 characters');
		});

		it('should reject usernames with special characters', () => {
			const invalidUsernames = [
				'user@name',
				'user.name',
				'user name',
				'user!name',
				'user#name',
				'user$name'
			];

			invalidUsernames.forEach((username) => {
				const result = validateUsername(username);
				expect(result.valid).toBe(false);
				expect(result.error).toContain('letters, numbers, underscore and hyphen');
			});
		});

		it('should reject usernames not starting with letter or number', () => {
			const invalidStarts = ['_username', '-username', '__test'];

			invalidStarts.forEach((username) => {
				const result = validateUsername(username);
				expect(result.valid).toBe(false);
				expect(result.error).toContain('start with a letter or number');
			});
		});

		it('should reject reserved usernames', () => {
			const reserved = ['admin', 'api', 'dashboard', 'login', 'settings'];

			reserved.forEach((username) => {
				const result = validateUsername(username);
				expect(result.valid).toBe(false);
				expect(result.error).toContain('reserved');
			});
		});

		it('should reject reserved usernames case-insensitively', () => {
			const result = validateUsername('ADMIN');
			expect(result.valid).toBe(false);
			expect(result.error).toContain('reserved');
		});
	});

	describe('generateUsernameFromEmail', () => {
		it('should extract local part from email', () => {
			const username = generateUsernameFromEmail('john.doe@example.com');
			expect(username).toContain('john');
			expect(username).not.toContain('@');
			expect(username).not.toContain('example.com');
		});

		it('should remove special characters', () => {
			const username = generateUsernameFromEmail('john.doe+test@example.com');
			expect(username).toBe('johndoetest');
		});

		it('should handle emails with numbers', () => {
			const username = generateUsernameFromEmail('user123@example.com');
			expect(username).toBe('user123');
		});

		it('should preserve underscores and hyphens', () => {
			const username = generateUsernameFromEmail('john_doe-123@example.com');
			expect(username).toBe('john_doe-123');
		});

		it('should add prefix if starting with invalid character', () => {
			const username = generateUsernameFromEmail('_test@example.com');
			expect(username).toMatch(/^user_test/);
		});

		it('should ensure minimum length of 3', () => {
			const username = generateUsernameFromEmail('a@example.com');
			expect(username.length).toBeGreaterThanOrEqual(3);
			expect(username).toMatch(/^a[a-z0-9]+$/);
		});

		it('should truncate if longer than 30 characters', () => {
			const longEmail = 'a'.repeat(40) + '@example.com';
			const username = generateUsernameFromEmail(longEmail);
			expect(username.length).toBeLessThanOrEqual(30);
		});

		it('should handle empty local part', () => {
			const username = generateUsernameFromEmail('@example.com');
			expect(username.length).toBeGreaterThanOrEqual(3);
			expect(username).toMatch(/^user/);
		});

		it('should handle complex email formats', () => {
			const testCases = [
				{ email: 'first.last@example.com', expected: 'firstlast' },
				{ email: 'user+tag@example.com', expected: 'usertag' },
				{ email: '123user@example.com', expected: '123user' },
				{ email: 'test.test.test@example.com', expected: 'testtesttest' }
			];

			testCases.forEach(({ email, expected }) => {
				const username = generateUsernameFromEmail(email);
				expect(username).toBe(expected);
			});
		});
	});

	describe('RESERVED_USERNAMES', () => {
		it('should contain common reserved names', () => {
			const essentialReserved = [
				'admin',
				'api',
				'login',
				'logout',
				'register',
				'settings',
				'dashboard',
				'user',
				'users'
			];

			essentialReserved.forEach((name) => {
				expect(RESERVED_USERNAMES).toContain(name);
			});
		});

		it('should not have duplicates', () => {
			const uniqueNames = new Set(RESERVED_USERNAMES);
			expect(uniqueNames.size).toBe(RESERVED_USERNAMES.length);
		});

		it('should be all lowercase', () => {
			RESERVED_USERNAMES.forEach((name) => {
				expect(name).toBe(name.toLowerCase());
			});
		});
	});
});
