/**
 * KEK (Key Encryption Key) helper tests.
 *
 * Pure crypto — no Postgres or Drizzle dependency. Run with `bun test`.
 *
 * Service-level tests for EncryptionVaultService live in `index.test.ts`
 * and require a real Postgres (RLS + CHECK constraints can't be
 * faithfully reproduced with pg-mem). They auto-skip when
 * TEST_DATABASE_URL is unset, so this kek.test.ts always runs.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
	loadKek,
	wrapMasterKey,
	unwrapMasterKey,
	generateMasterKey,
	activeKekId,
	_resetForTesting,
} from './kek';

// Deterministic 32-byte test KEK (NOT the dev fallback — that's all
// zeros, which would trigger the warning every test run).
const TEST_KEK_BASE64 = 'AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=';

beforeEach(async () => {
	_resetForTesting();
	await loadKek(TEST_KEK_BASE64);
});

describe('loadKek', () => {
	it('imports a valid 32-byte base64 KEK', () => {
		expect(activeKekId()).toBe('env-v1');
	});

	it('rejects a base64 string that decodes to the wrong length', async () => {
		_resetForTesting();
		// 16 bytes — half the size of an AES-256 KEK
		await expect(loadKek('AAAAAAAAAAAAAAAAAAAAAA==')).rejects.toThrow(/expected 32 bytes/);
	});

	it('is idempotent — second call is a no-op', async () => {
		// Already loaded in beforeEach. A second call should not throw.
		await loadKek(TEST_KEK_BASE64);
		expect(activeKekId()).toBe('env-v1');
	});

	it('refuses to expose kekId before loadKek is called', () => {
		_resetForTesting();
		expect(() => activeKekId()).toThrow(/loadKek\(\) not called/);
	});
});

describe('generateMasterKey', () => {
	it('returns 32 bytes of cryptographic randomness', () => {
		const a = generateMasterKey();
		const b = generateMasterKey();
		expect(a).toBeInstanceOf(Uint8Array);
		expect(a.length).toBe(32);
		expect(b.length).toBe(32);
		// Two consecutive calls should virtually never collide
		expect(Buffer.from(a).toString('hex')).not.toBe(Buffer.from(b).toString('hex'));
	});
});

describe('wrapMasterKey / unwrapMasterKey roundtrip', () => {
	it('roundtrips a freshly generated master key', async () => {
		const mk = generateMasterKey();
		const { wrappedMk, wrapIv } = await wrapMasterKey(mk);

		expect(typeof wrappedMk).toBe('string');
		expect(typeof wrapIv).toBe('string');
		expect(wrappedMk.length).toBeGreaterThan(0);
		expect(wrapIv.length).toBeGreaterThan(0);

		const recovered = await unwrapMasterKey(wrappedMk, wrapIv);
		expect(Buffer.from(recovered).toString('hex')).toBe(Buffer.from(mk).toString('hex'));
	});

	it('produces a different ciphertext for the same MK on each call', async () => {
		const mk = generateMasterKey();
		const a = await wrapMasterKey(mk);
		const b = await wrapMasterKey(mk);
		const c = await wrapMasterKey(mk);
		expect(a.wrappedMk).not.toBe(b.wrappedMk);
		expect(b.wrappedMk).not.toBe(c.wrappedMk);
		expect(a.wrapIv).not.toBe(b.wrapIv);
		// All three still unwrap correctly
		expect(Buffer.from(await unwrapMasterKey(a.wrappedMk, a.wrapIv)).toString('hex')).toBe(
			Buffer.from(mk).toString('hex')
		);
		expect(Buffer.from(await unwrapMasterKey(b.wrappedMk, b.wrapIv)).toString('hex')).toBe(
			Buffer.from(mk).toString('hex')
		);
	});

	it('rejects a master key of the wrong length', async () => {
		await expect(wrapMasterKey(new Uint8Array(16))).rejects.toThrow(/32-byte master key/);
		await expect(wrapMasterKey(new Uint8Array(64))).rejects.toThrow(/32-byte master key/);
	});
});

describe('unwrapMasterKey error paths', () => {
	it('throws on tampered ciphertext (auth tag mismatch)', async () => {
		const mk = generateMasterKey();
		const { wrappedMk, wrapIv } = await wrapMasterKey(mk);
		// Flip the last base64 character to corrupt the auth tag
		const lastChar = wrappedMk.charAt(wrappedMk.length - 1);
		const swapped = lastChar === 'A' ? 'B' : 'A';
		const tampered = wrappedMk.slice(0, -1) + swapped;
		await expect(unwrapMasterKey(tampered, wrapIv)).rejects.toThrow();
	});

	it('throws on a wrong-length IV', async () => {
		const mk = generateMasterKey();
		const { wrappedMk } = await wrapMasterKey(mk);
		const badIv = 'AAAAAAAA'; // 6 bytes after base64 decode
		await expect(unwrapMasterKey(wrappedMk, badIv)).rejects.toThrow(/12-byte IV/);
	});

	it('throws when a different KEK was used to wrap', async () => {
		// Wrap with the test KEK
		const mk = generateMasterKey();
		const { wrappedMk, wrapIv } = await wrapMasterKey(mk);

		// Reload with a different KEK
		_resetForTesting();
		const otherKek = 'IB8eHRwbGhkYFxYVFBMSERAPDg0MCwoJCAcGBQQDAgE=';
		await loadKek(otherKek);

		await expect(unwrapMasterKey(wrappedMk, wrapIv)).rejects.toThrow();
	});
});
