/**
 * Recovery code primitive tests (Phase 9).
 *
 * Pure crypto tests against Node 20+ Web Crypto. No Dexie / fake-
 * indexeddb needed — these exercise the deterministic primitives that
 * the zero-knowledge opt-in is built on.
 */

import { describe, it, expect } from 'vitest';
import {
	generateRecoverySecret,
	formatRecoveryCode,
	parseRecoveryCode,
	deriveRecoveryWrapKey,
	wrapMasterKeyWithRecovery,
	unwrapMasterKeyWithRecovery,
	RecoveryCodeFormatError,
	RECOVERY_SECRET_BYTES,
} from './recovery';
import { generateMasterKey, wrapValue, unwrapValue, exportMasterKey } from './aes';

describe('generateRecoverySecret', () => {
	it('returns 32 bytes', () => {
		const secret = generateRecoverySecret();
		expect(secret).toBeInstanceOf(Uint8Array);
		expect(secret.length).toBe(RECOVERY_SECRET_BYTES);
	});

	it('returns different bytes on each call (CSPRNG)', () => {
		const a = generateRecoverySecret();
		const b = generateRecoverySecret();
		// Vanishingly unlikely they collide on 256 bits
		expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
	});
});

describe('formatRecoveryCode', () => {
	it('produces 16 dash-separated groups of 4 hex chars', () => {
		const secret = new Uint8Array(32).fill(0xab);
		const formatted = formatRecoveryCode(secret);
		const groups = formatted.split('-');
		expect(groups).toHaveLength(16);
		for (const g of groups) {
			expect(g).toHaveLength(4);
			expect(g).toMatch(/^[0-9A-F]+$/);
		}
	});

	it('uses uppercase hex', () => {
		const secret = new Uint8Array(32);
		secret[0] = 0xab;
		const formatted = formatRecoveryCode(secret);
		expect(formatted.startsWith('AB00')).toBe(true);
	});

	it('throws on wrong-length input', () => {
		expect(() => formatRecoveryCode(new Uint8Array(16))).toThrow(/expected 32 raw bytes/);
		expect(() => formatRecoveryCode(new Uint8Array(64))).toThrow(/expected 32 raw bytes/);
	});

	it('total length is 79 chars (64 hex + 15 dashes)', () => {
		const formatted = formatRecoveryCode(new Uint8Array(32));
		expect(formatted).toHaveLength(79);
	});
});

describe('parseRecoveryCode', () => {
	it('roundtrips through formatRecoveryCode', () => {
		const original = generateRecoverySecret();
		const formatted = formatRecoveryCode(original);
		const parsed = parseRecoveryCode(formatted);
		expect(Buffer.from(parsed).equals(Buffer.from(original))).toBe(true);
	});

	it('accepts lowercase hex', () => {
		const secret = generateRecoverySecret();
		const upper = formatRecoveryCode(secret);
		const lower = upper.toLowerCase();
		const parsed = parseRecoveryCode(lower);
		expect(Buffer.from(parsed).equals(Buffer.from(secret))).toBe(true);
	});

	it('tolerates extra whitespace', () => {
		const secret = generateRecoverySecret();
		const formatted = formatRecoveryCode(secret);
		const messy = `  ${formatted}\n  `;
		expect(Buffer.from(parseRecoveryCode(messy)).equals(Buffer.from(secret))).toBe(true);
	});

	it('tolerates missing dashes', () => {
		const secret = generateRecoverySecret();
		const formatted = formatRecoveryCode(secret).replace(/-/g, '');
		expect(formatted).toHaveLength(64);
		expect(Buffer.from(parseRecoveryCode(formatted)).equals(Buffer.from(secret))).toBe(true);
	});

	it('tolerates extra dashes anywhere', () => {
		const secret = generateRecoverySecret();
		const hex = formatRecoveryCode(secret).replace(/-/g, '');
		// Inject random dashes
		const sliced = `${hex.slice(0, 8)}-${hex.slice(8, 16)}-${hex.slice(16, 32)}-${hex.slice(32)}`;
		expect(Buffer.from(parseRecoveryCode(sliced)).equals(Buffer.from(secret))).toBe(true);
	});

	it('throws RecoveryCodeFormatError on wrong length', () => {
		expect(() => parseRecoveryCode('AB12')).toThrow(RecoveryCodeFormatError);
		expect(() => parseRecoveryCode('A'.repeat(63))).toThrow(RecoveryCodeFormatError);
		expect(() => parseRecoveryCode('A'.repeat(65))).toThrow(RecoveryCodeFormatError);
	});

	it('throws RecoveryCodeFormatError on non-hex characters', () => {
		// 64-char string with a 'G' in it
		const bad = 'G' + 'A'.repeat(63);
		expect(() => parseRecoveryCode(bad)).toThrow(RecoveryCodeFormatError);
	});

	it('error message does not leak which character position was wrong', () => {
		try {
			parseRecoveryCode('Z'.repeat(64));
		} catch (e) {
			// Position-leaking words would help an attacker narrow the brute
			// force; "characters" (plural, generic) is fine.
			expect((e as Error).message).not.toMatch(/position|offset|index|at byte|at char \d/);
		}
	});
});

describe('deriveRecoveryWrapKey', () => {
	it('returns a non-extractable AES-GCM key', async () => {
		const secret = generateRecoverySecret();
		const wrapKey = await deriveRecoveryWrapKey(secret);
		expect(wrapKey.type).toBe('secret');
		expect(wrapKey.algorithm.name).toBe('AES-GCM');
		expect(wrapKey.extractable).toBe(false);
	});

	it('is deterministic for the same input', async () => {
		const secret = new Uint8Array(32).fill(0x42);
		const key1 = await deriveRecoveryWrapKey(secret);
		const key2 = await deriveRecoveryWrapKey(secret);
		// Both keys should produce the same ciphertext for the same plaintext + IV.
		// We can verify this indirectly by encrypting with one and decrypting
		// with the other.
		const iv = new Uint8Array(12);
		const data = new TextEncoder().encode('determinism check');
		const ct1 = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key1, data);
		const pt2 = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key2, ct1);
		expect(new TextDecoder().decode(pt2)).toBe('determinism check');
	});

	it('throws on wrong-length input', async () => {
		await expect(deriveRecoveryWrapKey(new Uint8Array(16))).rejects.toThrow(
			/expected 32-byte secret/
		);
	});
});

describe('wrapMasterKeyWithRecovery / unwrapMasterKeyWithRecovery', () => {
	it('roundtrips a master key through the recovery wrap', async () => {
		const mk = await generateMasterKey();
		const secret = generateRecoverySecret();
		const wrapKey = await deriveRecoveryWrapKey(secret);

		const sealed = await wrapMasterKeyWithRecovery(mk, wrapKey);
		expect(sealed.recoveryWrappedMk).toBeTypeOf('string');
		expect(sealed.recoveryIv).toBeTypeOf('string');
		expect(sealed.recoveryWrappedMk.length).toBeGreaterThan(0);

		const recovered = await unwrapMasterKeyWithRecovery(
			sealed.recoveryWrappedMk,
			sealed.recoveryIv,
			wrapKey
		);

		// The recovered key should encrypt + decrypt the same data as the
		// original master key.
		const original = await exportMasterKey(mk);
		const sample = 'recovery roundtrip';
		const enc = await wrapValue(sample, mk);
		const dec = await unwrapValue(enc, recovered);
		expect(dec).toBe(sample);

		// And the recovered key should be non-extractable.
		expect(recovered.extractable).toBe(false);

		// Sanity: the original was extractable so we could read its raw
		// bytes for the wrap. Just verifying we didn't accidentally break
		// that prerequisite.
		expect(original.length).toBe(32);
	});

	it('survives the full user-typed roundtrip (format + parse)', async () => {
		const mk = await generateMasterKey();
		const secret = generateRecoverySecret();
		const wrapKey = await deriveRecoveryWrapKey(secret);
		const sealed = await wrapMasterKeyWithRecovery(mk, wrapKey);

		// Simulate the user copy-pasting the formatted code somewhere and
		// pasting it back later.
		const displayed = formatRecoveryCode(secret);
		const reentered = parseRecoveryCode(displayed);
		const reWrapKey = await deriveRecoveryWrapKey(reentered);

		const recovered = await unwrapMasterKeyWithRecovery(
			sealed.recoveryWrappedMk,
			sealed.recoveryIv,
			reWrapKey
		);

		const sample = { secret: 'data', n: 42 };
		const enc = await wrapValue(sample, mk);
		const dec = await unwrapValue(enc, recovered);
		expect(dec).toEqual(sample);
	});

	it('fails to unwrap with the wrong recovery code', async () => {
		const mk = await generateMasterKey();
		const correct = generateRecoverySecret();
		const wrong = generateRecoverySecret();

		const correctWrapKey = await deriveRecoveryWrapKey(correct);
		const wrongWrapKey = await deriveRecoveryWrapKey(wrong);

		const sealed = await wrapMasterKeyWithRecovery(mk, correctWrapKey);

		await expect(
			unwrapMasterKeyWithRecovery(sealed.recoveryWrappedMk, sealed.recoveryIv, wrongWrapKey)
		).rejects.toThrow(); // AES-GCM auth tag mismatch
	});

	it('fails to unwrap tampered ciphertext', async () => {
		const mk = await generateMasterKey();
		const secret = generateRecoverySecret();
		const wrapKey = await deriveRecoveryWrapKey(secret);
		const sealed = await wrapMasterKeyWithRecovery(mk, wrapKey);

		// Flip a bit in the base64 ciphertext (turn first 'A' into 'B' or vice
		// versa). The simplest robust mutation: change the first character.
		const tampered =
			(sealed.recoveryWrappedMk[0] === 'A' ? 'B' : 'A') + sealed.recoveryWrappedMk.slice(1);

		await expect(
			unwrapMasterKeyWithRecovery(tampered, sealed.recoveryIv, wrapKey)
		).rejects.toThrow();
	});

	it('different IVs are produced for repeated wraps of the same key', async () => {
		const mk = await generateMasterKey();
		const wrapKey = await deriveRecoveryWrapKey(generateRecoverySecret());
		const a = await wrapMasterKeyWithRecovery(mk, wrapKey);
		const b = await wrapMasterKeyWithRecovery(mk, wrapKey);
		expect(a.recoveryIv).not.toBe(b.recoveryIv);
		expect(a.recoveryWrappedMk).not.toBe(b.recoveryWrappedMk);
	});
});
