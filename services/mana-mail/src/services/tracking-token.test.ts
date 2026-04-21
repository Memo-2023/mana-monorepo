import { describe, it, expect } from 'bun:test';
import { signToken, verifyToken, generateNonce } from './tracking-token';

const SECRET = 'test-secret-never-in-prod';
const OTHER_SECRET = 'other-secret';

const payload = {
	campaignId: 'camp-abc-123',
	sendId: 'send-xyz-789',
	nonce: 'n_test_nonce',
};

describe('tracking-token', () => {
	it('signs and verifies a token roundtrip', () => {
		const token = signToken(payload, SECRET);
		const decoded = verifyToken(token, SECRET);
		expect(decoded).toEqual(payload);
	});

	it('returns a URL-safe token (base64url, no padding)', () => {
		const token = signToken(payload, SECRET);
		expect(token).not.toContain('+');
		expect(token).not.toContain('/');
		expect(token).not.toContain('=');
		expect(token).toContain('.');
	});

	it('rejects tokens signed with a different secret', () => {
		const token = signToken(payload, OTHER_SECRET);
		expect(verifyToken(token, SECRET)).toBeNull();
	});

	it('rejects tampered payload', () => {
		const token = signToken(payload, SECRET);
		// Flip a character in the payload half — signature no longer matches.
		const [p, s] = token.split('.');
		const tampered = `${p.slice(0, -1)}X.${s}`;
		expect(verifyToken(tampered, SECRET)).toBeNull();
	});

	it('rejects tampered signature', () => {
		const token = signToken(payload, SECRET);
		const [p, s] = token.split('.');
		const tampered = `${p}.${s.slice(0, -1)}X`;
		expect(verifyToken(tampered, SECRET)).toBeNull();
	});

	it('rejects malformed tokens', () => {
		expect(verifyToken('', SECRET)).toBeNull();
		expect(verifyToken('only-one-part', SECRET)).toBeNull();
		expect(verifyToken('a.b.c', SECRET)).toBeNull(); // three parts
		expect(verifyToken('!@#.!@#', SECRET)).toBeNull(); // bad base64
	});

	it('handles special chars in ids through base64-encoding', () => {
		const withDots = {
			campaignId: 'camp:with:colons',
			sendId: 'send.with.dots',
			nonce: 'n_ok',
		};
		const token = signToken(withDots, SECRET);
		const decoded = verifyToken(token, SECRET);
		expect(decoded).toEqual(withDots);
	});

	it('generates unique nonces', () => {
		const nonces = new Set<string>();
		for (let i = 0; i < 100; i++) nonces.add(generateNonce());
		expect(nonces.size).toBe(100);
	});

	it('generated nonces are URL-safe', () => {
		for (let i = 0; i < 20; i++) {
			const nonce = generateNonce();
			expect(nonce).toMatch(/^[A-Za-z0-9_-]+$/);
		}
	});
});
