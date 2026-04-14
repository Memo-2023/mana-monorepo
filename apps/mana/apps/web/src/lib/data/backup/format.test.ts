/**
 * Tests for the hand-rolled .mana (zip) parser.
 *
 * The parser is the only untrusted-input frontier in the backup flow — a
 * corrupt archive should raise a clear BackupParseError, never silently
 * drop events. To exercise it without running mana-sync we build synthetic
 * archives in-memory: deflate the entries with `pako` (same lib used at
 * runtime), assemble local headers + central directory + EOCD per PKZIP
 * spec, and feed the result as a Blob.
 */

import { describe, it, expect } from 'vitest';
import { deflateRaw } from 'pako';
import { BackupParseError, iterateEvents, parseBackup, type BackupManifest } from './format';

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_EOCD = 0x06054b50;

interface EntrySpec {
	name: string;
	body: Uint8Array;
	method: 0 | 8; // 0 = store, 8 = deflate
}

/**
 * Build a minimal valid PKZIP archive from the given entries. Good enough
 * to exercise parseBackup's central-directory walk. CRC32 is left zero —
 * the parser does not verify it (sha256 on the uncompressed content plays
 * that role at a higher level).
 */
function buildZip(entries: EntrySpec[]): Uint8Array<ArrayBuffer> {
	const parts: Uint8Array[] = [];
	const central: Uint8Array[] = [];
	let offset = 0;

	for (const e of entries) {
		const nameBytes = new TextEncoder().encode(e.name);
		const data = e.method === 8 ? deflateRaw(e.body) : e.body;

		// Local file header
		const localHeader = new Uint8Array(30);
		const lv = new DataView(localHeader.buffer);
		lv.setUint32(0, SIG_LOCAL, true);
		lv.setUint16(4, 20, true); // version needed
		lv.setUint16(6, 0, true); // flags
		lv.setUint16(8, e.method, true);
		lv.setUint16(10, 0, true); // mtime
		lv.setUint16(12, 0, true); // mdate
		lv.setUint32(14, 0, true); // crc32 (ignored by parser)
		lv.setUint32(18, data.length, true); // compressed size
		lv.setUint32(22, e.body.length, true); // uncompressed size
		lv.setUint16(26, nameBytes.length, true);
		lv.setUint16(28, 0, true); // extra len

		parts.push(localHeader, nameBytes, data);
		const localHeaderOffset = offset;
		offset += localHeader.length + nameBytes.length + data.length;

		// Central directory entry
		const cdHeader = new Uint8Array(46);
		const cv = new DataView(cdHeader.buffer);
		cv.setUint32(0, SIG_CENTRAL, true);
		cv.setUint16(4, 20, true); // version made by
		cv.setUint16(6, 20, true); // version needed
		cv.setUint16(8, 0, true); // flags
		cv.setUint16(10, e.method, true);
		cv.setUint32(16, 0, true); // crc32
		cv.setUint32(20, data.length, true);
		cv.setUint32(24, e.body.length, true);
		cv.setUint16(28, nameBytes.length, true);
		cv.setUint32(42, localHeaderOffset, true);
		central.push(cdHeader, nameBytes);
	}

	const centralStart = offset;
	for (const c of central) {
		parts.push(c);
		offset += c.length;
	}
	const centralSize = offset - centralStart;

	const eocd = new Uint8Array(22);
	const ev = new DataView(eocd.buffer);
	ev.setUint32(0, SIG_EOCD, true);
	ev.setUint16(8, entries.length, true); // entries on this disk
	ev.setUint16(10, entries.length, true); // total entries
	ev.setUint32(12, centralSize, true);
	ev.setUint32(16, centralStart, true);
	parts.push(eocd);

	const total = parts.reduce((n, p) => n + p.length, 0);
	const out = new Uint8Array(total);
	let p = 0;
	for (const part of parts) {
		out.set(part, p);
		p += part.length;
	}
	return out;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
	const copy = new Uint8Array(bytes);
	const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function eventsBody(): { jsonl: string; bytes: Uint8Array } {
	const lines = [
		{
			eventId: 'e-1',
			schemaVersion: 1,
			appId: 'todo',
			table: 'tasks',
			id: 'task-1',
			op: 'insert',
			data: { title: 'Buy milk' },
			clientId: 'c-1',
			createdAt: '2026-04-14T10:00:00.000Z',
		},
		{
			eventId: 'e-2',
			schemaVersion: 1,
			appId: 'todo',
			table: 'tasks',
			id: 'task-1',
			op: 'update',
			data: { completed: true },
			fieldTimestamps: { completed: '2026-04-14T10:05:00.000Z' },
			clientId: 'c-1',
			createdAt: '2026-04-14T10:05:00.000Z',
		},
	];
	const jsonl = lines.map((l) => JSON.stringify(l)).join('\n') + '\n';
	return { jsonl, bytes: new TextEncoder().encode(jsonl) };
}

async function buildBackup(overrides: Partial<BackupManifest> = {}): Promise<Blob> {
	const { jsonl, bytes: eventsBytes } = eventsBody();
	const sha = await sha256Hex(eventsBytes);
	const manifest: BackupManifest = {
		formatVersion: 1,
		schemaVersion: 1,
		userId: 'user-123',
		createdAt: '2026-04-14T10:05:30.000Z',
		eventCount: 2,
		eventsSha256: sha,
		apps: ['todo'],
		producedBy: 'test',
		schemaVersionMin: 1,
		schemaVersionMax: 1,
		...overrides,
	};
	const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest, null, 2));
	const zip = buildZip([
		{ name: 'events.jsonl', body: eventsBytes, method: 8 },
		{ name: 'manifest.json', body: manifestBytes, method: 8 },
	]);
	// Hold the jsonl text alive so tests can also grep the raw body.
	void jsonl;
	return new Blob([zip], { type: 'application/zip' });
}

describe('parseBackup', () => {
	it('round-trips a two-event archive and matches sha256', async () => {
		const blob = await buildBackup();
		const parsed = await parseBackup(blob);

		expect(parsed.manifest.userId).toBe('user-123');
		expect(parsed.manifest.eventCount).toBe(2);
		expect(parsed.manifest.apps).toEqual(['todo']);
		expect(parsed.computedEventsSha256).toBe(parsed.manifest.eventsSha256);

		const events = [...iterateEvents(parsed.eventsJsonl)];
		expect(events).toHaveLength(2);
		expect(events[0].op).toBe('insert');
		expect(events[1].op).toBe('update');
		expect(events[1].fieldTimestamps?.completed).toBe('2026-04-14T10:05:00.000Z');
	});

	it('rejects archive with wrong formatVersion', async () => {
		const blob = await buildBackup({ formatVersion: 99 });
		await expect(parseBackup(blob)).rejects.toThrow(BackupParseError);
		await expect(parseBackup(blob)).rejects.toThrow(/formatVersion/);
	});

	it('rejects archive missing events.jsonl', async () => {
		const manifest = new TextEncoder().encode(JSON.stringify({ formatVersion: 1 }));
		const zip = buildZip([{ name: 'manifest.json', body: manifest, method: 8 }]);
		await expect(parseBackup(new Blob([zip]))).rejects.toThrow(/events\.jsonl/);
	});

	it('rejects archive missing manifest.json', async () => {
		const { bytes } = eventsBody();
		const zip = buildZip([{ name: 'events.jsonl', body: bytes, method: 8 }]);
		await expect(parseBackup(new Blob([zip]))).rejects.toThrow(/manifest\.json/);
	});

	it('rejects non-zip input', async () => {
		await expect(parseBackup(new Blob([new Uint8Array([1, 2, 3, 4])]))).rejects.toThrow(
			/valid zip/
		);
	});

	it('surfaces sha mismatch by returning a different computed hash', async () => {
		// Mutating the manifest's claimed sha should not mutate the computed
		// one — the importer compares the two and fails loudly. Here we just
		// verify the parser reports both so the comparison is possible.
		const blob = await buildBackup({ eventsSha256: 'deadbeef' });
		const parsed = await parseBackup(blob);
		expect(parsed.manifest.eventsSha256).toBe('deadbeef');
		expect(parsed.computedEventsSha256).not.toBe('deadbeef');
	});
});

describe('iterateEvents', () => {
	it('skips blank lines and parses each row', () => {
		const jsonl =
			'{"eventId":"a","schemaVersion":1,"appId":"x","table":"t","id":"1","op":"insert","clientId":"c","createdAt":"2026-04-14T00:00:00Z"}\n' +
			'\n' +
			'{"eventId":"b","schemaVersion":1,"appId":"x","table":"t","id":"2","op":"insert","clientId":"c","createdAt":"2026-04-14T00:00:01Z"}\n';
		const events = [...iterateEvents(jsonl)];
		expect(events).toHaveLength(2);
		expect(events[0].eventId).toBe('a');
		expect(events[1].eventId).toBe('b');
	});

	it('throws on malformed JSON', () => {
		expect(() => [...iterateEvents('{broken\n')]).toThrow(/parse failed/);
	});
});
