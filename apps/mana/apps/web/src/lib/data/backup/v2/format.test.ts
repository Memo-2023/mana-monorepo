/**
 * Unit tests for the v2 `.mana` format layer. These run pure — no Dexie,
 * no per-field crypto, no SvelteKit. The goal is coverage on:
 *
 *   1. PKZIP round-trip: buildBackup → readBackup recovers manifest + rows
 *   2. The sealed-but-still-packaged path (`buildSealedBackup` →
 *      `readBackup` returns `SealedBackupV2` without trying to decrypt)
 *   3. Manifest validation rejects junk with a specific error class
 *   4. Passphrase wrap/unwrap round-trip, including the
 *      wrong-passphrase → `PassphraseError` signal
 *
 * If we regress any of these four, the export/import feature is broken
 * in a way that the UI-level tests wouldn't catch (because they'd just
 * see "archive invalid" without pinpointing which layer failed).
 */

import { describe, it, expect } from 'vitest';
import {
	BACKUP_FORMAT_VERSION,
	BackupParseError,
	buildBackup,
	buildSealedBackup,
	buildSealedDataBody,
	parseManifest,
	parseSealedData,
	readBackup,
	type BackupManifestV2,
} from './format';
import { PassphraseError, seal, unseal } from './passphrase';

function sampleManifest(overrides: Partial<BackupManifestV2> = {}): BackupManifestV2 {
	return {
		formatVersion: 2,
		schemaVersion: 33,
		producedBy: 'mana-web/test',
		exportedAt: '2026-04-22T12:00:00.000Z',
		userId: 'user-1',
		scope: { type: 'full' },
		rowCounts: { todos: 2, notes: 1 },
		fieldsPlaintext: true,
		...overrides,
	};
}

const sampleTables = {
	todos: [
		{ id: 'a', title: 'walk the dog', done: false },
		{ id: 'b', title: 'buy coffee', done: true },
	],
	notes: [{ id: 'n-1', body: 'hello world' }],
};

describe('format: unsealed round-trip', () => {
	it('recovers manifest + tables through buildBackup → readBackup', async () => {
		const manifest = sampleManifest();
		const archive = await buildBackup({ manifest, tables: sampleTables, readme: 'hi' });
		const blob = new Blob([archive as unknown as ArrayBuffer]);

		const parsed = await readBackup(blob);
		if ('sealedData' in parsed) throw new Error('expected unsealed');

		expect(parsed.manifest.formatVersion).toBe(BACKUP_FORMAT_VERSION);
		expect(parsed.manifest.userId).toBe('user-1');
		expect(parsed.tables.todos).toEqual(sampleTables.todos);
		expect(parsed.tables.notes).toEqual(sampleTables.notes);
	});

	it('tolerates an empty table', async () => {
		const manifest = sampleManifest({ rowCounts: { todos: 0 } });
		const archive = await buildBackup({ manifest, tables: { todos: [] } });
		const parsed = await readBackup(new Blob([archive as unknown as ArrayBuffer]));
		if ('sealedData' in parsed) throw new Error('expected unsealed');
		expect(parsed.tables.todos).toEqual([]);
	});
});

describe('format: parseManifest', () => {
	it('rejects non-JSON', () => {
		expect(() => parseManifest('{ not json')).toThrow(BackupParseError);
	});

	it('rejects formatVersion !== 2', () => {
		expect(() => parseManifest(JSON.stringify({ ...sampleManifest(), formatVersion: 1 }))).toThrow(
			/unsupported backup formatVersion/
		);
	});

	it('rejects missing userId', () => {
		const m: Record<string, unknown> = { ...sampleManifest() };
		delete m.userId;
		expect(() => parseManifest(JSON.stringify(m))).toThrow(BackupParseError);
	});
});

describe('format: sealed path', () => {
	it('readBackup returns SealedBackupV2 for passphrase-wrapped archives', async () => {
		const plainBody = buildSealedDataBody(sampleTables);
		const { sealed, wrap } = await seal('correct-horse-battery', plainBody);
		const manifest = sampleManifest({ passphrase: wrap });
		const outer = buildSealedBackup(manifest, sealed);

		const parsed = await readBackup(new Blob([outer as unknown as ArrayBuffer]));
		if (!('sealedData' in parsed)) throw new Error('expected sealed');
		expect(parsed.manifest.passphrase).toBeDefined();
		expect(parsed.sealedData.byteLength).toBe(sealed.byteLength);
	});

	it('round-trips through seal → unseal → parseSealedData', async () => {
		const plainBody = buildSealedDataBody(sampleTables);
		const pass = 'correct-horse-battery-staple';
		const { sealed, wrap } = await seal(pass, plainBody);
		const manifest = sampleManifest({ passphrase: wrap });
		const unsealedBody = await unseal(pass, sealed, wrap);
		const parsed = await parseSealedData(manifest, unsealedBody);
		expect(parsed.tables.todos).toEqual(sampleTables.todos);
		expect(parsed.tables.notes).toEqual(sampleTables.notes);
	});
});

describe('passphrase: failure modes', () => {
	it('throws PassphraseError on wrong passphrase', async () => {
		const plainBody = buildSealedDataBody(sampleTables);
		const { sealed, wrap } = await seal('right-one', plainBody);
		await expect(unseal('wrong-one', sealed, wrap)).rejects.toBeInstanceOf(PassphraseError);
	});

	it('throws PassphraseError on integrity mismatch after correct decrypt', async () => {
		const plainBody = buildSealedDataBody(sampleTables);
		const { sealed, wrap } = await seal('p', plainBody);
		// Manifest claims a different plaintext hash than what we actually
		// have — simulates a tampered archive where the attacker kept the
		// ciphertext valid but swapped the manifest.
		const tamperedWrap = { ...wrap, plaintextSha256: 'a'.repeat(64) };
		await expect(unseal('p', sealed, tamperedWrap)).rejects.toBeInstanceOf(PassphraseError);
	});

	it('throws PassphraseError on empty passphrase', async () => {
		await expect(seal('', new Uint8Array([1, 2, 3]))).rejects.toBeInstanceOf(PassphraseError);
	});
});
