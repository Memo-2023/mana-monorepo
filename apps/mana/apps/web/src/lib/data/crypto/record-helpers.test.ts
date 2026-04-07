/**
 * Tests for encryptRecord / decryptRecord roundtrip behaviour.
 *
 * Uses real Web Crypto from the Node 20+ runtime — no Dexie or
 * IndexedDB needed. The registry is mutated in place via vi.spyOn so
 * we can flip a test table to enabled:true without affecting the
 * production defaults.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { encryptRecord, decryptRecord, decryptRecords, VaultLockedError } from './record-helpers';
import { generateMasterKey, isEncrypted } from './aes';
import { MemoryKeyProvider, setKeyProvider } from './key-provider';
import * as registry from './registry';

let key: CryptoKey;
let provider: MemoryKeyProvider;

const TEST_TABLE = 'notes';

beforeEach(async () => {
	key = await generateMasterKey();
	provider = new MemoryKeyProvider();
	provider.setKey(key);
	setKeyProvider(provider);

	// Pretend the notes table is enabled with title + body fields.
	vi.spyOn(registry, 'getEncryptedFields').mockImplementation((tableName: string) => {
		if (tableName === TEST_TABLE) return ['title', 'body'];
		return null;
	});
});

afterEach(() => {
	vi.restoreAllMocks();
	provider.setKey(null);
});

describe('encryptRecord', () => {
	it('encrypts only the configured fields, leaves the rest plaintext', async () => {
		const record = {
			id: 'note-1',
			title: 'Buy milk',
			body: 'and eggs and bread',
			createdAt: '2026-04-07T10:00:00Z',
			isPinned: false,
		};
		await encryptRecord(TEST_TABLE, record);

		expect(record.id).toBe('note-1');
		expect(record.createdAt).toBe('2026-04-07T10:00:00Z');
		expect(record.isPinned).toBe(false);

		expect(isEncrypted(record.title)).toBe(true);
		expect(isEncrypted(record.body)).toBe(true);
		expect(record.title).not.toBe('Buy milk');
		expect(record.body).not.toBe('and eggs and bread');
	});

	it('skips fields that are null or undefined', async () => {
		const record = { id: 'n', title: null, body: undefined as unknown as string };
		await encryptRecord(TEST_TABLE, record);
		expect(record.title).toBe(null);
		expect(record.body).toBe(undefined);
	});

	it('skips already-encrypted fields (idempotent on second call)', async () => {
		const record = { id: 'n', title: 'first', body: 'second' };
		await encryptRecord(TEST_TABLE, record);
		const encryptedTitle = record.title;
		const encryptedBody = record.body;

		await encryptRecord(TEST_TABLE, record);
		expect(record.title).toBe(encryptedTitle);
		expect(record.body).toBe(encryptedBody);
	});

	it('returns unchanged when the table is not in the registry', async () => {
		const record = { id: 'x', title: 'plain', body: 'plain' };
		await encryptRecord('not_encrypted_table', record);
		expect(record.title).toBe('plain');
		expect(record.body).toBe('plain');
	});

	it('throws VaultLockedError when no key is available', async () => {
		provider.setKey(null);
		const record = { id: 'n', title: 'secret', body: 'also secret' };
		await expect(encryptRecord(TEST_TABLE, record)).rejects.toThrow(VaultLockedError);
		// Record was not partially mutated
		expect(record.title).toBe('secret');
		expect(record.body).toBe('also secret');
	});

	it('does not throw when the vault is locked but no fields need encryption', async () => {
		provider.setKey(null);
		const record = { id: 'n', title: null, body: undefined as unknown as string };
		await expect(encryptRecord(TEST_TABLE, record)).resolves.toBeDefined();
	});
});

describe('decryptRecord', () => {
	it('decrypts the configured fields back to their plaintext', async () => {
		const original = { id: 'n', title: 'Buy milk', body: 'plus eggs', createdAt: 'now' };
		// We can't pass the same object to encrypt + decrypt without
		// reading the encrypted values first, so encrypt in place then
		// decrypt the same reference.
		await encryptRecord(TEST_TABLE, original);
		expect(isEncrypted(original.title)).toBe(true);

		await decryptRecord(TEST_TABLE, original);
		expect(original.title).toBe('Buy milk');
		expect(original.body).toBe('plus eggs');
		expect(original.createdAt).toBe('now');
	});

	it('leaves blobs in place when the vault is locked', async () => {
		const record = { id: 'n', title: 'Buy milk', body: 'plus eggs' };
		await encryptRecord(TEST_TABLE, record);
		const encryptedTitle = record.title;
		const encryptedBody = record.body;

		provider.setKey(null);
		await decryptRecord(TEST_TABLE, record);
		expect(record.title).toBe(encryptedTitle);
		expect(record.body).toBe(encryptedBody);
	});

	it('logs and continues on per-field decrypt failure', async () => {
		const record = { id: 'n', title: 'Buy milk', body: 'plus eggs' };
		await encryptRecord(TEST_TABLE, record);

		// Tamper with the title's auth tag
		const lastChar = (record.title as string).charAt((record.title as string).length - 1);
		const swap = lastChar === 'A' ? 'B' : 'A';
		record.title = (record.title as string).slice(0, -1) + swap;

		const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		await decryptRecord(TEST_TABLE, record);
		expect(errSpy).toHaveBeenCalledOnce();
		// Body still decrypts
		expect(record.body).toBe('plus eggs');
		// Title stays as-is (corrupt blob)
		expect(isEncrypted(record.title)).toBe(true);
		errSpy.mockRestore();
	});

	it('passes through plaintext fields untouched', async () => {
		const record = { id: 'n', title: 'plain string', body: null };
		await decryptRecord(TEST_TABLE, record);
		expect(record.title).toBe('plain string');
		expect(record.body).toBe(null);
	});
});

describe('decryptRecords', () => {
	it('decrypts an array of records', async () => {
		const records = [
			{ id: 'a', title: 'A title', body: 'A body' },
			{ id: 'b', title: 'B title', body: 'B body' },
		];
		await Promise.all(records.map((r) => encryptRecord(TEST_TABLE, r)));
		const decrypted = await decryptRecords(TEST_TABLE, records);
		expect(decrypted).toHaveLength(2);
		expect(decrypted[0].title).toBe('A title');
		expect(decrypted[1].title).toBe('B title');
	});

	it('skips null/undefined entries from getMany-style results', async () => {
		const r = { id: 'a', title: 'A', body: 'B' };
		await encryptRecord(TEST_TABLE, r);
		const decrypted = await decryptRecords(TEST_TABLE, [r, null, undefined]);
		expect(decrypted).toHaveLength(1);
		expect(decrypted[0].title).toBe('A');
	});
});

describe('encrypt → write → read → decrypt full cycle', () => {
	it('survives a JSON.stringify/parse roundtrip in between (sync wire)', async () => {
		const original = { id: 'n', title: 'Sensitive', body: 'Even more sensitive' };
		await encryptRecord(TEST_TABLE, original);

		// Simulate sending to the server and getting it back
		const onTheWire = JSON.stringify(original);
		const fromServer = JSON.parse(onTheWire) as typeof original;

		await decryptRecord(TEST_TABLE, fromServer);
		expect(fromServer.title).toBe('Sensitive');
		expect(fromServer.body).toBe('Even more sensitive');
	});
});
