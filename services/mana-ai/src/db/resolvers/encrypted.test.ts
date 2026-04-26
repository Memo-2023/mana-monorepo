/**
 * Encrypted resolver — unit tests with a stubbed Sql driver.
 *
 * We don't spin up Postgres; instead we mount a fake `sql` tag that
 * returns canned rows for `replayRecord` and collects INSERT calls for
 * the audit writer. This exercises the allowlist check, the decrypt
 * path, and the audit bookkeeping without needing a real DB.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { createEncryptedResolver } from './encrypted';
import type { Sql } from '../connection';

const ENC_PREFIX = 'enc:1:';

async function freshKey(): Promise<CryptoKey> {
	return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

/** Webapp-side wrap; we emulate so tests can produce ciphertext the
 *  resolver then unwraps. */
async function wrap(value: unknown, key: CryptoKey): Promise<string> {
	const json = JSON.stringify(value);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ct = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv: iv.buffer.slice(0) as ArrayBuffer },
		key,
		new TextEncoder().encode(json)
	);
	return ENC_PREFIX + b64(iv) + '.' + b64(new Uint8Array(ct));
}

interface Capture {
	queries: Array<{ text: string; values: unknown[] }>;
	rows: Record<string, unknown[]>;
}

/** Build a stub Sql tag. Matches the calls made by replayRecord + audit
 *  writer. Responses are keyed by whether the query is SELECT (pulls
 *  from capture.rows) or INSERT/SET (no-op + captured for assertions).
 *  Template literal quirks: postgres.js calls the tag with
 *  (strings: string[], ...values: unknown[]). */
function stubSql(capture: Capture): Sql {
	const tag = ((strings: TemplateStringsArray, ...values: unknown[]) => {
		const text = strings.join('?');
		capture.queries.push({ text, values });
		const promise: Promise<unknown> = Promise.resolve(
			text.includes('FROM sync_changes') ? (capture.rows.replay ?? []) : []
		);
		// postgres.js query objects also support .begin etc.; we only
		// need the promise interface for these tests.
		return promise;
	}) as unknown as Sql;
	// begin = transactional callback; we inline-run it against the same
	// tag so the same query log is captured.
	(tag as unknown as { begin: (fn: (tx: Sql) => Promise<unknown>) => Promise<unknown> }).begin =
		async (fn) => fn(tag);
	return tag;
}

beforeEach(() => {
	// nothing global; fresh capture per test
});

describe('encrypted resolver', () => {
	it('returns null when the mission has no grant (no mdk in context)', async () => {
		const resolver = createEncryptedResolver({
			module: 'notes',
			appId: 'notes',
			label: 'Notiz',
			formatContent: (r) => String(r.content ?? ''),
		});
		const capture: Capture = { queries: [], rows: {} };
		const out = await resolver(
			stubSql(capture),
			{ module: 'notes', table: 'notes', id: 'n1' },
			'user-1',
			{ missionId: 'm' } // no mdk, no allowlist
		);
		expect(out).toBe(null);
		// No DB work at all — we bailed before replay.
		expect(capture.queries).toEqual([]);
	});

	it('writes scope-violation audit when record is not on the allowlist', async () => {
		const key = await freshKey();
		const resolver = createEncryptedResolver({
			module: 'notes',
			appId: 'notes',
			label: 'Notiz',
			formatContent: (r) => String(r.content ?? ''),
		});
		const capture: Capture = { queries: [], rows: {} };
		const out = await resolver(
			stubSql(capture),
			{ module: 'notes', table: 'notes', id: 'n-other' },
			'user-1',
			{ missionId: 'm1', mdk: key, allowlist: new Set(['notes:n1']) }
		);
		expect(out).toBe(null);
		// Audit insert recorded.
		const auditInsert = capture.queries.find((q) =>
			q.text.includes('INSERT INTO mana_ai.decrypt_audit')
		);
		expect(auditInsert).toBeDefined();
		expect(auditInsert!.values).toContain('scope-violation');
		expect(auditInsert!.values).toContain('record-not-in-grant-allowlist');
	});

	it('decrypts allowlisted records and writes ok audit', async () => {
		const key = await freshKey();
		const encTitle = await wrap('Private Titel', key);
		const encContent = await wrap('geheimer inhalt', key);
		const capture: Capture = {
			queries: [],
			rows: {
				replay: [
					{
						op: 'insert',
						data: { title: encTitle, content: encContent, createdAt: '2026-04-15' },
						field_meta: null,
						created_at: new Date(0),
					},
				],
			},
		};
		const resolver = createEncryptedResolver({
			module: 'notes',
			appId: 'notes',
			label: 'Notiz',
			formatContent: (r) => String(r.content ?? ''),
		});

		const out = await resolver(
			stubSql(capture),
			{ module: 'notes', table: 'notes', id: 'n1' },
			'user-1',
			{ missionId: 'm1', mdk: key, allowlist: new Set(['notes:n1']) }
		);

		expect(out).not.toBe(null);
		expect(out!.title).toBe('Private Titel');
		expect(out!.content).toBe('geheimer inhalt');

		const audit = capture.queries.find((q) => q.text.includes('INSERT INTO mana_ai.decrypt_audit'));
		expect(audit!.values).toContain('ok');
	});

	it('writes failed audit when decrypt throws (wrong key)', async () => {
		const wrapperKey = await freshKey();
		const runnerKey = await freshKey(); // different → ciphertext won't decrypt
		const enc = await wrap('x', wrapperKey);
		const capture: Capture = {
			queries: [],
			rows: {
				replay: [
					{
						op: 'insert',
						data: { title: enc },
						field_meta: null,
						created_at: new Date(0),
					},
				],
			},
		};
		const resolver = createEncryptedResolver({
			module: 'notes',
			appId: 'notes',
			label: 'Notiz',
			formatContent: (r) => String(r.title ?? ''),
		});
		const out = await resolver(
			stubSql(capture),
			{ module: 'notes', table: 'notes', id: 'n1' },
			'user-1',
			{ missionId: 'm1', mdk: runnerKey, allowlist: new Set(['notes:n1']) }
		);
		expect(out).toBe(null);
		const audit = capture.queries.find((q) => q.text.includes('INSERT INTO mana_ai.decrypt_audit'));
		expect(audit!.values).toContain('failed');
	});
});

function b64(bytes: Uint8Array): string {
	let bin = '';
	for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
	return btoa(bin);
}
