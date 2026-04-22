/**
 * .mana v2 format — snapshot-based client-driven backup.
 *
 * v2 breaks from v1 (event-stream from mana-sync) and instead packages
 * the current-state rows of selected Dexie tables as one `.jsonl` per
 * table, wrapped in a tiny ZIP container. Optional passphrase-wrapping
 * folds the `data/` portion into a single AES-GCM blob under a
 * PBKDF2-derived key — see `passphrase.ts`.
 *
 * This file owns:
 *   - the type surface (`BackupManifestV2`, `ParsedBackupV2`, …)
 *   - CRC32 + SHA-256 integrity helpers
 *   - the ZIP reader + writer
 *   - a narrow public API: `buildZip`, `readZip`, `parseManifest`
 *
 * It deliberately does NOT know about Dexie tables, per-field crypto,
 * or module registry. Those concerns live in `export.ts` + `import.ts`
 * — keeping this file as a pure byte-and-bit layer makes it trivial
 * to unit-test.
 */

import { inflateRaw, deflateRaw } from 'pako';

export const BACKUP_FORMAT_VERSION = 2;
export const BACKUP_FILENAME_EXT = '.mana';

// ─── Manifest types ───────────────────────────────────────────────

export type BackupScope = { type: 'full' } | { type: 'filtered'; appIds: string[] };

export interface PassphraseWrap {
	kdf: 'PBKDF2-SHA256';
	/** OWASP 2023 recommendation: 600k. */
	kdfIterations: number;
	/** 16 random bytes, base64-url. */
	kdfSaltBase64: string;
	cipher: 'AES-GCM-256';
	/** 12 random bytes, base64-url. */
	ivBase64: string;
	/** SHA-256 hex of the plaintext body (= deflate-compressed `data.tar`).
	 *  Lets the importer detect passphrase-typo failures even though the
	 *  AEAD tag already does — we surface a clear "wrong passphrase" vs.
	 *  "corrupted file" distinction by comparing the hash AFTER successful
	 *  decrypt. */
	plaintextSha256: string;
}

export interface BackupManifestV2 {
	formatVersion: 2;
	/** Dexie schema version at export time. */
	schemaVersion: number;
	/** "mana-web/1.2.3" or similar. Informational. */
	producedBy: string;
	exportedAt: string;
	userId: string;
	scope: BackupScope;
	/** rowCounts[tableName] = number. Non-authoritative; the actual jsonl
	 *  content wins if there's a discrepancy. Used for quick UI summary. */
	rowCounts: Record<string, number>;
	/** true = the `data/` jsonls contain plaintext values (Mana's per-field
	 *  crypto already reversed). false is reserved for a future flag where a
	 *  client emits cipher-preserving dumps (not built yet). */
	fieldsPlaintext: boolean;
	/** Present iff the archive is passphrase-wrapped. */
	passphrase?: PassphraseWrap;
}

/** Unpacked archive ready for the importer to chew on. */
export interface ParsedBackupV2 {
	manifest: BackupManifestV2;
	/** Map from table name → array of row objects. Present when the archive
	 *  is unencrypted OR has been unwrapped by the caller. */
	tables: Record<string, Record<string, unknown>[]>;
}

/** Intermediate when the archive is passphrase-wrapped and not yet unlocked. */
export interface SealedBackupV2 {
	manifest: BackupManifestV2;
	/** The encrypted tarball — to be decrypted by `passphrase.ts` */
	sealedData: Uint8Array;
}

// ─── Public API ──────────────────────────────────────────────────

export class BackupParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'BackupParseError';
	}
}

/**
 * Read a `.mana` v2 blob. Returns either the fully-parsed tables (when
 * unencrypted) or a `SealedBackupV2` that the caller must decrypt via
 * `passphrase.ts` and then feed back in through `parseSealedData`.
 */
export async function readBackup(file: Blob): Promise<ParsedBackupV2 | SealedBackupV2> {
	const buf = new Uint8Array(await file.arrayBuffer());
	const entries = readZipEntries(buf);

	const manifestEntry = entries.get('manifest.json');
	if (!manifestEntry) throw new BackupParseError('missing manifest.json');
	const manifest = parseManifest(new TextDecoder().decode(inflateEntry(manifestEntry)));

	if (manifest.passphrase) {
		const sealed = entries.get('data.sealed');
		if (!sealed)
			throw new BackupParseError('manifest declares passphrase but data.sealed is missing');
		return { manifest, sealedData: inflateEntry(sealed) };
	}

	const tables = await collectTables(entries);
	return { manifest, tables };
}

/**
 * Parse the raw plaintext bytes produced by `passphrase.unseal()` into a
 * ParsedBackupV2. Only called by the import pipeline after a successful
 * passphrase unwrap.
 */
export async function parseSealedData(
	manifest: BackupManifestV2,
	plaintextBody: Uint8Array
): Promise<ParsedBackupV2> {
	const entries = readZipEntries(plaintextBody);
	const tables = await collectTables(entries);
	return { manifest, tables };
}

export interface BuildInput {
	manifest: BackupManifestV2;
	/** Map from table name → array of row objects. Rows should already have
	 *  their encrypted fields decrypted (the export pipeline handles that). */
	tables: Record<string, Record<string, unknown>[]>;
	readme?: string;
}

/**
 * Build an unencrypted `.mana` v2 archive. Caller-side callers pass
 * already-decrypted rows. For passphrase-wrapped archives, call this to
 * get the inner zip, then hand it to `passphrase.seal()` to produce the
 * outer wrapper.
 */
export async function buildBackup(input: BuildInput): Promise<Uint8Array> {
	const enc = new TextEncoder();
	const entries: EntrySpec[] = [];

	// manifest.json first so the reader can short-circuit on malformed
	// archives without decompressing the data payload.
	entries.push({
		name: 'manifest.json',
		body: enc.encode(JSON.stringify(input.manifest, null, 2)),
	});

	for (const [table, rows] of Object.entries(input.tables)) {
		const jsonl = rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length > 0 ? '\n' : '');
		entries.push({ name: `data/${table}.jsonl`, body: enc.encode(jsonl) });
	}

	if (input.readme) {
		entries.push({ name: 'README.md', body: enc.encode(input.readme) });
	}

	return buildZip(entries);
}

/**
 * Build the *inner* data-only zip — used by the passphrase path to
 * produce the blob that gets encrypted into `data.sealed`. Same row
 * format as the unsealed archive, just without the manifest or README.
 */
export function buildSealedDataBody(tables: Record<string, Record<string, unknown>[]>): Uint8Array {
	const enc = new TextEncoder();
	const entries: EntrySpec[] = [];
	for (const [table, rows] of Object.entries(tables)) {
		const jsonl = rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length > 0 ? '\n' : '');
		entries.push({ name: `data/${table}.jsonl`, body: enc.encode(jsonl) });
	}
	return buildZip(entries);
}

/**
 * Assemble the outer archive when the inner body is passphrase-wrapped.
 * The wrapped bytes get stored as `data.sealed` (uncompressed — already
 * high-entropy ciphertext, deflate gains nothing).
 */
export function buildSealedBackup(
	manifest: BackupManifestV2,
	sealedData: Uint8Array,
	readme?: string
): Uint8Array {
	const enc = new TextEncoder();
	const entries: EntrySpec[] = [
		{
			name: 'manifest.json',
			body: enc.encode(JSON.stringify(manifest, null, 2)),
		},
		{ name: 'data.sealed', body: sealedData, method: STORED },
	];
	if (readme) entries.push({ name: 'README.md', body: enc.encode(readme) });
	return buildZip(entries);
}

export function parseManifest(json: string): BackupManifestV2 {
	let raw: unknown;
	try {
		raw = JSON.parse(json);
	} catch (e) {
		throw new BackupParseError(`manifest.json is not valid JSON: ${(e as Error).message}`);
	}
	if (!raw || typeof raw !== 'object') {
		throw new BackupParseError('manifest must be an object');
	}
	const o = raw as Record<string, unknown>;
	if (o.formatVersion !== 2) {
		throw new BackupParseError(
			`unsupported backup formatVersion ${String(o.formatVersion)} (this build supports v${BACKUP_FORMAT_VERSION})`
		);
	}
	if (typeof o.schemaVersion !== 'number')
		throw new BackupParseError('manifest.schemaVersion missing');
	if (typeof o.userId !== 'string' || !o.userId)
		throw new BackupParseError('manifest.userId missing');
	if (typeof o.exportedAt !== 'string') throw new BackupParseError('manifest.exportedAt missing');
	if (!o.scope || typeof o.scope !== 'object') throw new BackupParseError('manifest.scope missing');
	if (!o.rowCounts || typeof o.rowCounts !== 'object')
		throw new BackupParseError('manifest.rowCounts missing');
	if (typeof o.fieldsPlaintext !== 'boolean')
		throw new BackupParseError('manifest.fieldsPlaintext missing');
	return raw as BackupManifestV2;
}

// ─── Hashes ──────────────────────────────────────────────────────

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
	// Copy so subtle.digest gets a plain ArrayBuffer (DOM typings reject
	// SharedArrayBuffer-backed views even though runtime accepts them).
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	const digest = await crypto.subtle.digest('SHA-256', copy.buffer);
	return bytesToHex(new Uint8Array(digest));
}

function bytesToHex(bytes: Uint8Array): string {
	const out: string[] = [];
	for (let i = 0; i < bytes.length; i++) out.push(bytes[i].toString(16).padStart(2, '0'));
	return out.join('');
}

// ─── Zip reader + writer ─────────────────────────────────────────
//
// Narrow but spec-compliant implementation: LocalFileHeader + CentralDir +
// EOCD. Supports deflate (method 8) + stored (method 0). No Zip64, no
// encryption at the zip level (we do our own AEAD above), no multi-part.
// Writes valid CRC32 so other tools (Finder, unzip, fflate) accept the
// output too — v1's test helper skipped this.

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_EOCD = 0x06054b50;
const DEFLATE = 8;
const STORED = 0;

interface EntrySpec {
	name: string;
	body: Uint8Array;
	method?: typeof DEFLATE | typeof STORED;
}

interface ZipEntry {
	nameUtf8: string;
	method: number;
	crc32: number;
	compressedSize: number;
	uncompressedSize: number;
	localHeaderOffset: number;
	source: Uint8Array;
}

export function buildZip(entries: EntrySpec[]): Uint8Array {
	const parts: Uint8Array[] = [];
	const central: Uint8Array[] = [];
	let offset = 0;

	for (const e of entries) {
		const method = e.method ?? DEFLATE;
		const nameBytes = new TextEncoder().encode(e.name);
		const data = method === DEFLATE ? deflateRaw(e.body) : e.body;
		const crc = crc32(e.body);

		// Local file header (30 bytes fixed + name + extra)
		const lh = new Uint8Array(30);
		const lv = new DataView(lh.buffer);
		lv.setUint32(0, SIG_LOCAL, true);
		lv.setUint16(4, 20, true); // version needed
		lv.setUint16(6, 0, true); // flags
		lv.setUint16(8, method, true);
		lv.setUint16(10, 0, true); // mtime
		lv.setUint16(12, 0, true); // mdate
		lv.setUint32(14, crc, true);
		lv.setUint32(18, data.length, true);
		lv.setUint32(22, e.body.length, true);
		lv.setUint16(26, nameBytes.length, true);
		lv.setUint16(28, 0, true); // extra len

		parts.push(lh, nameBytes, data);
		const localHeaderOffset = offset;
		offset += lh.length + nameBytes.length + data.length;

		// Central directory entry (46 bytes fixed + name + extra + comment)
		const cd = new Uint8Array(46);
		const cv = new DataView(cd.buffer);
		cv.setUint32(0, SIG_CENTRAL, true);
		cv.setUint16(4, 20, true); // version made by
		cv.setUint16(6, 20, true); // version needed
		cv.setUint16(8, 0, true); // flags
		cv.setUint16(10, method, true);
		cv.setUint32(16, crc, true);
		cv.setUint32(20, data.length, true);
		cv.setUint32(24, e.body.length, true);
		cv.setUint16(28, nameBytes.length, true);
		cv.setUint32(42, localHeaderOffset, true);
		central.push(cd, nameBytes);
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
	ev.setUint16(8, entries.length, true);
	ev.setUint16(10, entries.length, true);
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

function readZipEntries(buf: Uint8Array): Map<string, ZipEntry> {
	const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
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
		const crc32Val = view.getUint32(p + 16, true);
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
			crc32: crc32Val,
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
		case STORED:
			return compressed.slice();
		case DEFLATE:
			return inflateRaw(compressed);
		default:
			throw new BackupParseError(`unsupported zip compression method ${entry.method}`);
	}
}

async function collectTables(
	entries: Map<string, ZipEntry>
): Promise<Record<string, Record<string, unknown>[]>> {
	const tables: Record<string, Record<string, unknown>[]> = {};
	const dec = new TextDecoder();
	for (const [name, entry] of entries) {
		if (!name.startsWith('data/') || !name.endsWith('.jsonl')) continue;
		const tableName = name.slice('data/'.length, -'.jsonl'.length);
		if (!tableName || tableName.includes('/')) continue; // defensive: skip nested / empty
		const text = dec.decode(inflateEntry(entry));
		const rows: Record<string, unknown>[] = [];
		for (const line of text.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed) continue;
			try {
				rows.push(JSON.parse(trimmed) as Record<string, unknown>);
			} catch (e) {
				throw new BackupParseError(`data/${tableName}.jsonl parse failed: ${(e as Error).message}`);
			}
		}
		tables[tableName] = rows;
	}
	return tables;
}

// ─── CRC32 (IEEE-802.3) ──────────────────────────────────────────

const CRC32_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let i = 0; i < 256; i++) {
		let c = i;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		table[i] = c >>> 0;
	}
	return table;
})();

function crc32(bytes: Uint8Array): number {
	let crc = 0xffffffff;
	for (let i = 0; i < bytes.length; i++) {
		crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
	}
	return (crc ^ 0xffffffff) >>> 0;
}
