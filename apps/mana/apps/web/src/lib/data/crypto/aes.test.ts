/**
 * AES-GCM wrap/unwrap primitive tests.
 *
 * Runs against the native Web Crypto API exposed on `globalThis.crypto`
 * by Node 20+. No Dexie or fake-indexeddb needed — these are pure
 * functions over the standard subtle crypto interface.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
	wrapValue,
	unwrapValue,
	isEncrypted,
	generateMasterKey,
	importMasterKey,
	exportMasterKey,
	ENC_PREFIX,
} from './aes';
import { MemoryKeyProvider, setKeyProvider, getActiveKey, isVaultUnlocked } from './key-provider';
import {
	getEncryptedFields,
	hasAnyEncryption,
	getRegisteredTables,
	ENCRYPTION_REGISTRY,
} from './registry';

let key: CryptoKey;
let otherKey: CryptoKey;

beforeAll(async () => {
	key = await generateMasterKey();
	otherKey = await generateMasterKey();
});

describe('isEncrypted', () => {
	it('detects the encryption prefix', () => {
		expect(isEncrypted('enc:1:abc.def')).toBe(true);
	});

	it('rejects non-string values', () => {
		expect(isEncrypted(null)).toBe(false);
		expect(isEncrypted(undefined)).toBe(false);
		expect(isEncrypted(42)).toBe(false);
		expect(isEncrypted({})).toBe(false);
		expect(isEncrypted([])).toBe(false);
	});

	it('rejects strings without the prefix', () => {
		expect(isEncrypted('hello world')).toBe(false);
		expect(isEncrypted('')).toBe(false);
		expect(isEncrypted('enc:')).toBe(false);
		expect(isEncrypted('enc:2:abc.def')).toBe(false); // wrong version
	});
});

describe('wrapValue / unwrapValue roundtrip', () => {
	it('roundtrips a plain string', async () => {
		const blob = await wrapValue('Buy milk', key);
		expect(typeof blob).toBe('string');
		expect((blob as string).startsWith(ENC_PREFIX)).toBe(true);
		expect(await unwrapValue(blob, key)).toBe('Buy milk');
	});

	it('roundtrips an empty string', async () => {
		const blob = await wrapValue('', key);
		expect(await unwrapValue(blob, key)).toBe('');
	});

	it('roundtrips a unicode string', async () => {
		const original = 'Schlüssel — 日本語 — 🔐 — ☃';
		const blob = await wrapValue(original, key);
		expect(await unwrapValue(blob, key)).toBe(original);
	});

	it('roundtrips an object', async () => {
		const original = { title: 'Meeting', attendees: ['Alice', 'Bob'], priority: 2 };
		const blob = await wrapValue(original, key);
		expect(await unwrapValue(blob, key)).toEqual(original);
	});

	it('roundtrips an array', async () => {
		const original = [1, 'two', { three: true }, null];
		const blob = await wrapValue(original, key);
		expect(await unwrapValue(blob, key)).toEqual(original);
	});

	it('roundtrips a number', async () => {
		const blob = await wrapValue(42, key);
		expect(await unwrapValue(blob, key)).toBe(42);
	});

	it('roundtrips a boolean', async () => {
		const trueBlob = await wrapValue(true, key);
		const falseBlob = await wrapValue(false, key);
		expect(await unwrapValue(trueBlob, key)).toBe(true);
		expect(await unwrapValue(falseBlob, key)).toBe(false);
	});

	it('roundtrips a large string (10KB)', async () => {
		const large = 'x'.repeat(10_000);
		const blob = await wrapValue(large, key);
		expect(await unwrapValue(blob, key)).toBe(large);
	});

	it('passes null through unchanged on wrap', async () => {
		expect(await wrapValue(null, key)).toBe(null);
	});

	it('passes undefined through unchanged on wrap', async () => {
		expect(await wrapValue(undefined, key)).toBe(undefined);
	});

	it('passes plaintext strings through unchanged on unwrap', async () => {
		expect(await unwrapValue('not encrypted', key)).toBe('not encrypted');
	});

	it('passes null/undefined through unchanged on unwrap', async () => {
		expect(await unwrapValue(null, key)).toBe(null);
		expect(await unwrapValue(undefined, key)).toBe(undefined);
	});
});

describe('IV uniqueness', () => {
	it('produces a different ciphertext for the same plaintext on each call', async () => {
		const a = await wrapValue('same input', key);
		const b = await wrapValue('same input', key);
		const c = await wrapValue('same input', key);
		expect(a).not.toBe(b);
		expect(b).not.toBe(c);
		expect(a).not.toBe(c);
		// All three still decrypt to the same value
		expect(await unwrapValue(a, key)).toBe('same input');
		expect(await unwrapValue(b, key)).toBe('same input');
		expect(await unwrapValue(c, key)).toBe('same input');
	});
});

describe('wrong key rejection', () => {
	it('throws when the wrong key tries to decrypt', async () => {
		const blob = await wrapValue('secret', key);
		await expect(unwrapValue(blob, otherKey)).rejects.toThrow();
	});
});

describe('tampered ciphertext rejection', () => {
	it('throws when the ciphertext bytes are flipped', async () => {
		const blob = (await wrapValue('secret', key)) as string;
		// Flip the last character to corrupt the auth tag
		const lastChar = blob.charAt(blob.length - 1);
		const swapChar = lastChar === 'A' ? 'B' : 'A';
		const tampered = blob.slice(0, -1) + swapChar;
		await expect(unwrapValue(tampered, key)).rejects.toThrow();
	});
});

describe('malformed blob handling', () => {
	it('throws when the iv/ct separator is missing', async () => {
		await expect(unwrapValue('enc:1:noSeparatorHere', key)).rejects.toThrow(
			/missing iv\/ct separator/
		);
	});
});

describe('importMasterKey / exportMasterKey', () => {
	it('roundtrips a key through raw bytes', async () => {
		const exported = await exportMasterKey(key);
		expect(exported.length).toBe(32);

		const reimported = await importMasterKey(exported);
		// Use the reimported key to decrypt something the original encrypted
		const blob = await wrapValue('roundtrip via raw bytes', key);
		expect(await unwrapValue(blob, reimported)).toBe('roundtrip via raw bytes');
	});

	it('rejects raw input that is not 32 bytes', async () => {
		await expect(importMasterKey(new Uint8Array(16))).rejects.toThrow(/32-byte/);
		await expect(importMasterKey(new Uint8Array(64))).rejects.toThrow(/32-byte/);
	});
});

describe('KeyProvider', () => {
	it('NullKeyProvider is the default and reports locked', () => {
		// Re-set to default explicitly in case a previous test left state
		setKeyProvider(
			new (class {
				getKey() {
					return null;
				}
				isUnlocked() {
					return false;
				}
				onChange() {
					return () => {};
				}
			})()
		);
		expect(getActiveKey()).toBe(null);
		expect(isVaultUnlocked()).toBe(false);
	});

	it('MemoryKeyProvider holds a key and reports unlocked', async () => {
		const provider = new MemoryKeyProvider();
		expect(provider.isUnlocked()).toBe(false);
		expect(provider.getKey()).toBe(null);

		provider.setKey(key);
		expect(provider.isUnlocked()).toBe(true);
		expect(provider.getKey()).toBe(key);

		provider.setKey(null);
		expect(provider.isUnlocked()).toBe(false);
	});

	it('MemoryKeyProvider notifies listeners on lock/unlock transitions', () => {
		const provider = new MemoryKeyProvider();
		const events: boolean[] = [];
		const dispose = provider.onChange((unlocked) => events.push(unlocked));

		provider.setKey(key);
		provider.setKey(key); // no transition — should not fire
		provider.setKey(null);
		provider.setKey(null); // no transition — should not fire
		provider.setKey(key);

		expect(events).toEqual([true, false, true]);
		dispose();

		// After dispose, no more notifications
		provider.setKey(null);
		expect(events).toEqual([true, false, true]);
	});

	it('setKeyProvider swaps the active provider', async () => {
		const provider = new MemoryKeyProvider();
		provider.setKey(key);
		setKeyProvider(provider);

		expect(isVaultUnlocked()).toBe(true);
		expect(getActiveKey()).toBe(key);

		// Reset for next tests
		provider.setKey(null);
		expect(isVaultUnlocked()).toBe(false);
	});
});

describe('encryption registry', () => {
	it('returns null for tables not in the registry', () => {
		expect(getEncryptedFields('not_a_real_table')).toBe(null);
	});

	it('returns null for registered tables that are disabled', () => {
		// `notes` was flipped to enabled:true in Phase 4 — pick two
		// tables that are still on the safe default for the assertion.
		expect(getEncryptedFields('messages')).toBe(null);
		expect(getEncryptedFields('contacts')).toBe(null);
	});

	it('returns the field list for tables that are enabled', () => {
		// Phase 4: notes is the pilot, expected to be flipped on.
		expect(getEncryptedFields('notes')).toEqual(['title', 'content']);
	});

	it('hasAnyEncryption returns true once at least one table is enabled', () => {
		expect(hasAnyEncryption()).toBe(true);
	});

	it('getRegisteredTables lists every table in the registry', () => {
		const tables = getRegisteredTables();
		// Spot-check the most sensitive ones
		expect(tables).toContain('messages');
		expect(tables).toContain('notes');
		expect(tables).toContain('memos');
		expect(tables).toContain('contacts');
		expect(tables).toContain('cycleDayLogs');
	});

	it('every registry entry has a non-empty fields list', () => {
		for (const [table, config] of Object.entries(ENCRYPTION_REGISTRY)) {
			expect(config.fields.length, `${table} has empty fields list`).toBeGreaterThan(0);
		}
	});

	it('field lists contain no duplicates', () => {
		for (const [table, config] of Object.entries(ENCRYPTION_REGISTRY)) {
			const unique = new Set(config.fields);
			expect(unique.size, `${table} has duplicate field names`).toBe(config.fields.length);
		}
	});
});
