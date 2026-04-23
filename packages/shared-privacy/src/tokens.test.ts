import { describe, it, expect } from 'vitest';
import { generateUnlistedToken } from './tokens';
import { UnlistedTokenSchema } from './schema';

describe('generateUnlistedToken', () => {
	it('returns a 32-char base64url string', () => {
		const token = generateUnlistedToken();
		expect(token).toHaveLength(32);
		expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
	});

	it('passes the UnlistedTokenSchema', () => {
		for (let i = 0; i < 10; i++) {
			const token = generateUnlistedToken();
			expect(() => UnlistedTokenSchema.parse(token)).not.toThrow();
		}
	});

	it('is unique across many calls (entropy check)', () => {
		const tokens = new Set<string>();
		for (let i = 0; i < 1000; i++) tokens.add(generateUnlistedToken());
		expect(tokens.size).toBe(1000);
	});
});

describe('UnlistedTokenSchema', () => {
	it('rejects tokens that are too short', () => {
		expect(() => UnlistedTokenSchema.parse('short')).toThrow();
	});

	it('rejects tokens with invalid chars', () => {
		expect(() => UnlistedTokenSchema.parse('a/b+c=d'.padEnd(32, 'x'))).toThrow();
	});

	it('accepts 32-char base64url', () => {
		expect(() => UnlistedTokenSchema.parse('A'.repeat(32))).not.toThrow();
		expect(() => UnlistedTokenSchema.parse('-_'.repeat(16))).not.toThrow();
	});
});
