/**
 * Client-driven export: read Dexie tables → decrypt per-field → package
 * as `.mana` v2 archive → optional passphrase-wrap.
 *
 * Public surface: `buildClientBackup({ appIds?, passphrase?, … })`.
 * The export traverses `MODULE_CONFIGS` to decide which Dexie tables to
 * include, so a new module that registers a ModuleConfig is exported
 * automatically. Per-field decryption is delegated to the existing
 * `decryptRecords()` — that way the exporter can't accidentally emit
 * plaintext for a different field than the importer re-encrypts.
 */

import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import { MODULE_CONFIGS } from '$lib/data/module-registry';
import { authStore } from '$lib/stores/auth.svelte';
import { buildBackup, buildSealedBackup, buildSealedDataBody } from './format';
import type { BackupManifestV2, BackupScope, PassphraseWrap } from './format';
import { seal } from './passphrase';

export interface ExportOptions {
	/** AppIds to include. If omitted or empty, all registered modules
	 *  are exported (scope.type = 'full'). */
	appIds?: string[];
	/** When set, the archive is passphrase-wrapped. Min 12 chars; the UI
	 *  should enforce that before calling. */
	passphrase?: string;
	/** Called after each table so the UI can render progress. */
	onProgress?: (p: ExportProgress) => void;
	/** Override the version string embedded in the manifest. Tests set
	 *  this to keep fixtures stable. */
	producedBy?: string;
}

export interface ExportProgress {
	phase: 'collecting' | 'packaging' | 'sealing' | 'done';
	tablesProcessed: number;
	totalTables: number;
	currentTable?: string;
}

export interface ExportResult {
	blob: Blob;
	filename: string;
	rowCounts: Record<string, number>;
}

/** Small README that accompanies the archive — non-binding, informational. */
const README = `Mana Data Export

This archive was produced by Mana's "Export & Import" feature. Contents:

- manifest.json  — format version, which modules are inside, row counts,
                   optional passphrase metadata.
- data/*.jsonl   — one line per row, JSON-encoded. Encrypted fields were
                   decrypted at export time; plain strings here.
- data.sealed    — present iff the manifest declares a passphrase. An
                   AES-GCM-256 blob over the data/ payload; see the
                   manifest.passphrase block for KDF params.

Re-importing into another Mana account re-encrypts automatically using
that account's vault key. Without a vault, the plain JSONL is directly
readable in any text editor / jq / Python.
`;

export async function buildClientBackup(opts: ExportOptions = {}): Promise<ExportResult> {
	const userId = authStore.user?.id ?? 'unknown';

	// Resolve scope — either user-provided appId list (filtered) or all.
	const filter = opts.appIds && opts.appIds.length > 0 ? new Set(opts.appIds) : null;
	const scope: BackupScope = filter ? { type: 'filtered', appIds: [...filter] } : { type: 'full' };

	// Flatten the module configs into a list of { table, appId } so we
	// can walk it linearly (and get accurate progress counts).
	const tableTargets: { table: string; appId: string }[] = [];
	for (const mod of MODULE_CONFIGS) {
		if (filter && !filter.has(mod.appId)) continue;
		for (const t of mod.tables) tableTargets.push({ table: t.name, appId: mod.appId });
	}

	const totalTables = tableTargets.length;
	const tables: Record<string, Record<string, unknown>[]> = {};
	const rowCounts: Record<string, number> = {};

	for (let i = 0; i < tableTargets.length; i++) {
		const { table } = tableTargets[i];
		opts.onProgress?.({
			phase: 'collecting',
			tablesProcessed: i,
			totalTables,
			currentTable: table,
		});

		const rows = await readTable(table);
		tables[table] = rows;
		rowCounts[table] = rows.length;
	}

	// Build manifest. `fieldsPlaintext: true` is always correct for this
	// export path — we decrypted on the way in.
	const manifest: BackupManifestV2 = {
		formatVersion: 2,
		schemaVersion: getSchemaVersion(),
		producedBy: opts.producedBy ?? 'mana-web',
		exportedAt: new Date().toISOString(),
		userId,
		scope,
		rowCounts,
		fieldsPlaintext: true,
	};

	opts.onProgress?.({ phase: 'packaging', tablesProcessed: totalTables, totalTables });

	let archive: Uint8Array;
	if (opts.passphrase) {
		opts.onProgress?.({ phase: 'sealing', tablesProcessed: totalTables, totalTables });
		const innerBody = buildSealedDataBody(tables);
		const { sealed, wrap } = await seal(opts.passphrase, innerBody);
		manifest.passphrase = wrap satisfies PassphraseWrap;
		archive = buildSealedBackup(manifest, sealed, README);
	} else {
		archive = await buildBackup({ manifest, tables, readme: README });
	}

	opts.onProgress?.({ phase: 'done', tablesProcessed: totalTables, totalTables });

	const filename = defaultFilename(scope, !!opts.passphrase);
	const blob = new Blob([archive as unknown as ArrayBuffer], { type: 'application/octet-stream' });
	return { blob, filename, rowCounts };
}

/**
 * Pull every non-deleted row from a Dexie table and decrypt the fields
 * in the encryption registry. Missing tables (e.g. a module removed its
 * ModuleConfig but the registry iter still asks for it during a stale
 * build) are tolerated with an empty array — the exporter should never
 * crash on a schema drift.
 */
async function readTable(table: string): Promise<Record<string, unknown>[]> {
	let rawRows: Record<string, unknown>[];
	try {
		rawRows = (await db.table(table).toArray()) as Record<string, unknown>[];
	} catch {
		return [];
	}
	// Keep tombstoned (deletedAt) rows out of the export — the receiving
	// device has no use for them and they just balloon the file size.
	const live = rawRows.filter((row) => !(row as { deletedAt?: unknown }).deletedAt);
	return decryptRecords(table, live);
}

function defaultFilename(scope: BackupScope, sealed: boolean): string {
	const date = new Date().toISOString().slice(0, 10);
	const scopeTag = scope.type === 'full' ? 'full' : scope.appIds.join('-');
	const sealTag = sealed ? '.sealed' : '';
	return `mana-${scopeTag}-${date}${sealTag}.mana`;
}

function getSchemaVersion(): number {
	// Dexie exposes verno on the opened db. If the db isn't open yet for
	// some reason, fall back to 0 — the importer uses schemaVersion only
	// as a compat guard, 0 will just match the older-backup branch there.
	return (db.verno as number | undefined) ?? 0;
}
