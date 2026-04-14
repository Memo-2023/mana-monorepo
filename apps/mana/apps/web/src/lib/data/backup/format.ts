/**
 * .mana archive parser — client side.
 *
 * mana-sync emits a small, well-defined zip (archive/zip) with exactly two
 * entries: events.jsonl and manifest.json, both DEFLATE-compressed, no
 * encryption, no multi-part, no Zip64. That narrow scope means we can hand-
 * roll the parser against the central-directory record format rather than
 * pull in a ~20KB zip dependency.
 *
 * Inflate itself runs through `pako`, which the repo already uses for
 * spiral-db and qr-export PNG compression — so no new dependency is added.
 *
 * The parser is structured so the importer can stream events.jsonl line by
 * line without materializing the entire (potentially large) decompressed
 * body, though at this file-size scale we do decompress-to-string for
 * simplicity. If users ever ship multi-GB backups we can swap the jsonl
 * entry for a chunk iterator without changing the public surface.
 */

import { inflateRaw } from 'pako';

export const BACKUP_FORMAT_VERSION = 1;
export const BACKUP_FILENAME_EXT = '.mana';

/**
 * Everything from manifest.json, plus the decoded events.jsonl body. Kept
 * tight so it round-trips cleanly through the import UI without pulling any
 * extra zip-format leakage into the rest of the app.
 */
export interface ParsedBackup {
	manifest: BackupManifest;
	eventsJsonl: string;
	/** Re-computed sha256 of the uncompressed events.jsonl; hex string. */
	computedEventsSha256: string;
}

export interface BackupManifest {
	formatVersion: number;
	schemaVersion: number;
	userId: string;
	createdAt: string;
	eventCount: number;
	eventsSha256: string;
	apps: string[];
	producedBy?: string;
	schemaVersionMin?: number;
	schemaVersionMax?: number;
}

export interface BackupEvent {
	eventId: string;
	schemaVersion: number;
	appId: string;
	table: string;
	id: string;
	op: 'insert' | 'update' | 'delete';
	data?: Record<string, unknown>;
	fieldTimestamps?: Record<string, string>;
	clientId: string;
	createdAt: string;
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Parse a .mana file into its manifest + raw events.jsonl. Also re-hashes
 * the decompressed events body with SHA-256 so the caller can compare
 * against manifest.eventsSha256 for integrity.
 */
export async function parseBackup(file: Blob): Promise<ParsedBackup> {
	const buf = new Uint8Array(await file.arrayBuffer());
	const entries = readZipEntries(buf);

	const manifestEntry = entries.get('manifest.json');
	const eventsEntry = entries.get('events.jsonl');
	if (!manifestEntry) throw new BackupParseError('missing manifest.json in archive');
	if (!eventsEntry) throw new BackupParseError('missing events.jsonl in archive');

	const manifestText = new TextDecoder().decode(inflateEntry(manifestEntry));
	let manifest: BackupManifest;
	try {
		manifest = JSON.parse(manifestText);
	} catch (e) {
		throw new BackupParseError(`manifest.json is not valid JSON: ${(e as Error).message}`);
	}
	validateManifest(manifest);

	const eventsBytes = inflateEntry(eventsEntry);
	const eventsJsonl = new TextDecoder().decode(eventsBytes);

	const computedEventsSha256 = await sha256Hex(eventsBytes);

	return { manifest, eventsJsonl, computedEventsSha256 };
}

/**
 * Yield events from the JSONL body one at a time. Skips blank lines; throws
 * on a non-parseable row so corruption is not silently masked. Returns a
 * generator so the caller can stream apply-batches without loading all
 * events into a single array.
 */
export function* iterateEvents(jsonl: string): Generator<BackupEvent> {
	let start = 0;
	while (start < jsonl.length) {
		const nl = jsonl.indexOf('\n', start);
		const end = nl === -1 ? jsonl.length : nl;
		const line = jsonl.slice(start, end).trim();
		start = end + 1;
		if (!line) continue;
		try {
			yield JSON.parse(line) as BackupEvent;
		} catch (e) {
			throw new BackupParseError(`events.jsonl line parse failed: ${(e as Error).message}`);
		}
	}
}

export class BackupParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'BackupParseError';
	}
}

// ─── Validation ─────────────────────────────────────────────────

function validateManifest(m: unknown): asserts m is BackupManifest {
	if (!m || typeof m !== 'object') throw new BackupParseError('manifest must be an object');
	const o = m as Record<string, unknown>;
	if (typeof o.formatVersion !== 'number')
		throw new BackupParseError('manifest.formatVersion missing');
	if (o.formatVersion !== BACKUP_FORMAT_VERSION) {
		throw new BackupParseError(
			`unsupported backup formatVersion ${o.formatVersion} (this build supports ${BACKUP_FORMAT_VERSION})`
		);
	}
	if (typeof o.userId !== 'string' || !o.userId)
		throw new BackupParseError('manifest.userId missing');
	if (typeof o.eventsSha256 !== 'string' || !o.eventsSha256)
		throw new BackupParseError('manifest.eventsSha256 missing');
	if (typeof o.eventCount !== 'number') throw new BackupParseError('manifest.eventCount missing');
	if (!Array.isArray(o.apps)) throw new BackupParseError('manifest.apps missing');
}

// ─── Zip parser (central directory only) ───────────────────────
//
// ZIP structure we rely on:
//   End Of Central Directory Record (EOCD) at the tail
//   Central Directory entries (one per file)
//   Local File Header + data for each file, earlier in the stream
//
// We locate EOCD, walk the central directory, and for each entry seek to
// the local header to read the actual compressed payload. This is the
// standard "seek-by-central-dir" approach and matches what libraries like
// fflate and jszip do internally.

interface ZipEntry {
	nameUtf8: string;
	method: number; // 0 = stored, 8 = deflate
	crc32: number;
	compressedSize: number;
	uncompressedSize: number;
	localHeaderOffset: number;
	source: Uint8Array; // full archive buffer, held so inflate can seek
}

const SIG_EOCD = 0x06054b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_LOCAL = 0x04034b50;

function readZipEntries(buf: Uint8Array): Map<string, ZipEntry> {
	const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

	// Find EOCD by scanning backward from the tail. The comment field is up
	// to 65535 bytes, so in the worst case we scan 65557 bytes — fine.
	const eocdOffset = findEOCD(view);
	if (eocdOffset < 0) throw new BackupParseError('not a valid zip archive (no EOCD)');

	const entryCount = view.getUint16(eocdOffset + 10, true);
	const cdOffset = view.getUint32(eocdOffset + 16, true);

	const entries = new Map<string, ZipEntry>();
	let p = cdOffset;
	for (let i = 0; i < entryCount; i++) {
		if (view.getUint32(p, true) !== SIG_CENTRAL) {
			throw new BackupParseError('central directory entry signature mismatch');
		}
		const method = view.getUint16(p + 10, true);
		const crc32 = view.getUint32(p + 16, true);
		const compressedSize = view.getUint32(p + 20, true);
		const uncompressedSize = view.getUint32(p + 24, true);
		const nameLen = view.getUint16(p + 28, true);
		const extraLen = view.getUint16(p + 30, true);
		const commentLen = view.getUint16(p + 32, true);
		const localHeaderOffset = view.getUint32(p + 42, true);
		const nameUtf8 = new TextDecoder('utf-8').decode(buf.subarray(p + 46, p + 46 + nameLen));

		entries.set(nameUtf8, {
			nameUtf8,
			method,
			crc32,
			compressedSize,
			uncompressedSize,
			localHeaderOffset,
			source: buf,
		});

		p += 46 + nameLen + extraLen + commentLen;
	}
	return entries;
}

function findEOCD(view: DataView): number {
	const maxCommentLen = 65535;
	const minOffset = Math.max(0, view.byteLength - 22 - maxCommentLen);
	for (let i = view.byteLength - 22; i >= minOffset; i--) {
		if (view.getUint32(i, true) === SIG_EOCD) return i;
	}
	return -1;
}

function inflateEntry(entry: ZipEntry): Uint8Array {
	const buf = entry.source;
	const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
	const p = entry.localHeaderOffset;
	if (view.getUint32(p, true) !== SIG_LOCAL) {
		throw new BackupParseError(`local header signature mismatch for ${entry.nameUtf8}`);
	}
	const nameLen = view.getUint16(p + 26, true);
	const extraLen = view.getUint16(p + 28, true);
	const dataStart = p + 30 + nameLen + extraLen;
	const compressed = buf.subarray(dataStart, dataStart + entry.compressedSize);

	switch (entry.method) {
		case 0:
			return compressed.slice();
		case 8:
			return inflateRaw(compressed);
		default:
			throw new BackupParseError(`unsupported zip compression method ${entry.method}`);
	}
}

// ─── SHA-256 ────────────────────────────────────────────────────

async function sha256Hex(bytes: Uint8Array): Promise<string> {
	// Copy into a fresh ArrayBuffer so subtle.digest is happy regardless of
	// whether the input is backed by SharedArrayBuffer — the DOM typings
	// refuse ArrayBufferLike unions even though runtime accepts them.
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
	const hex: string[] = [];
	const view = new Uint8Array(digest);
	for (let i = 0; i < view.length; i++) {
		hex.push(view[i].toString(16).padStart(2, '0'));
	}
	return hex.join('');
}
