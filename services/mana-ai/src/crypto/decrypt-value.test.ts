/**
 * Round-trip test between the webapp's wrap format and mana-ai's unwrap.
 *
 * The webapp's wire format is documented in
 * `apps/mana/apps/web/src/lib/data/crypto/aes.ts`. We re-implement the
 * wrap side here (server-side we never wrap, but the test needs to
 * produce the wire format somehow) and assert the unwrap result matches
 * the original value.
 */

import { describe, it, expect } from 'bun:test';
import { isEncrypted, unwrapValue, decryptRecordFields } from './decrypt-value';

const ENC_PREFIX = 'enc:1:';

async function webappWrap(value: unknown, key: CryptoKey): Promise<unknown> {
	if (value === null || value === undefined) return value;
	const json = JSON.stringify(value);
	const plaintext = new TextEncoder().encode(json);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ct = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv: toBufferSource(iv) },
		key,
		toBufferSource(plaintext)
	);
	return ENC_PREFIX + bytesToBase64(iv) + '.' + bytesToBase64(new Uint8Array(ct));
}

async function freshKey(): Promise<CryptoKey> {
	return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

describe('isEncrypted', () => {
	it('recognises the prefix', () => {
		expect(isEncrypted('enc:1:abc.def')).toBe(true);
		expect(isEncrypted('plain string')).toBe(false);
		expect(isEncrypted(null)).toBe(false);
		expect(isEncrypted(undefined)).toBe(false);
		expect(isEncrypted(42)).toBe(false);
	});
});

describe('unwrapValue', () => {
	it('round-trips strings', async () => {
		const key = await freshKey();
		const blob = await webappWrap('hello world', key);
		expect(await unwrapValue(blob, key)).toBe('hello world');
	});

	it('round-trips arrays and objects (same JSON envelope as webapp)', async () => {
		const key = await freshKey();
		const arr = ['a', 1, { nested: true }];
		const blobArr = await webappWrap(arr, key);
		expect(await unwrapValue(blobArr, key)).toEqual(arr);

		const obj = { title: 'x', tags: ['y', 'z'] };
		const blobObj = await webappWrap(obj, key);
		expect(await unwrapValue(blobObj, key)).toEqual(obj);
	});

	it('passes through null, undefined, non-strings', async () => {
		const key = await freshKey();
		expect(await unwrapValue(null, key)).toBe(null);
		expect(await unwrapValue(undefined, key)).toBe(undefined);
		expect(await unwrapValue(42, key)).toBe(42);
		expect(await unwrapValue('plain', key)).toBe('plain');
	});

	it('throws on tampered ciphertext', async () => {
		const key = await freshKey();
		const blob = (await webappWrap('secret', key)) as string;
		// Flip a byte in the ciphertext part (after the dot).
		const dot = blob.indexOf('.');
		const tampered = blob.slice(0, dot + 1) + 'A' + blob.slice(dot + 2);
		await expect(unwrapValue(tampered, key)).rejects.toThrow();
	});

	it('throws on malformed prefix', async () => {
		const key = await freshKey();
		await expect(unwrapValue('enc:1:nodot', key)).rejects.toThrow(/malformed/);
	});

	it('throws on wrong key', async () => {
		const k1 = await freshKey();
		const k2 = await freshKey();
		const blob = await webappWrap('secret', k1);
		await expect(unwrapValue(blob, k2)).rejects.toThrow();
	});
});

describe('decryptRecordFields', () => {
	it('decrypts only enc: fields and reports which', async () => {
		const key = await freshKey();
		const record = {
			id: 'r1',
			title: await webappWrap('Private Title', key),
			content: await webappWrap({ markdown: 'secret' }, key),
			createdAt: '2026-04-15',
			userId: 'u1',
		};
		const { record: out, decryptedFields } = await decryptRecordFields(record, key);
		expect(out.title).toBe('Private Title');
		expect(out.content).toEqual({ markdown: 'secret' });
		expect(out.id).toBe('r1');
		expect(out.createdAt).toBe('2026-04-15');
		expect(decryptedFields.sort()).toEqual(['content', 'title']);
	});

	it('is a no-op for records with no encrypted fields', async () => {
		const key = await freshKey();
		const record = { id: 'r1', value: 42, period: 'week' };
		const { decryptedFields } = await decryptRecordFields(record, key);
		expect(decryptedFields).toEqual([]);
	});
});

function bytesToBase64(bytes: Uint8Array): string {
	let bin = '';
	for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
	return btoa(bin);
}

function toBufferSource(bytes: Uint8Array): ArrayBuffer {
	const buf = new ArrayBuffer(bytes.length);
	new Uint8Array(buf).set(bytes);
	return buf;
}
