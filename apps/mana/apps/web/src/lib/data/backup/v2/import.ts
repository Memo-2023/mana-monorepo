/**
 * Client-driven import: unseal (if needed) → re-encrypt per field →
 * `bulkPut` into Dexie.
 *
 * The reverse of `export.ts`. A few non-obvious decisions:
 *
 * - **Per-row re-encryption uses `encryptRecord(table, row)`**. That
 *   walks `ENCRYPTION_REGISTRY[table].fields` and wraps each listed
 *   field. Because the exporter fully decrypted the fields, the
 *   importer sees them as plain strings regardless of which key they
 *   were encrypted under before — which is exactly what enables
 *   cross-account migration.
 *
 * - **bulkPut, not bulkAdd**. Same-id rows overwrite the local copy.
 *   That matches LWW semantics for the common "restore over a fresh
 *   install" case. If the user imports into an account that already
 *   has some content, they might lose unseen-on-this-device edits —
 *   we surface that in the confirmation UI, not the import logic.
 *
 * - **Unknown tables are skipped, not fatal**. A backup might carry
 *   a `wisekeep` table from when that module existed; if the current
 *   build dropped it, we silently ignore the rows rather than block
 *   the restore.
 *
 * - **ownerId is NOT overwritten**. Dexie's creating-hook stamps the
 *   current session's userId onto any row that doesn't carry one. We
 *   delete `userId` from the incoming rows to force that stamp — so
 *   cross-account restores don't leak the source userId.
 */

import { db } from '$lib/data/database';
import { encryptRecord } from '$lib/data/crypto';
import { MODULE_CONFIGS } from '$lib/data/module-registry';
import {
	BackupParseError,
	parseSealedData,
	readBackup,
	type BackupManifestV2,
	type ParsedBackupV2,
} from './format';
import { PassphraseError, unseal } from './passphrase';

export interface ImportOptions {
	/** Required if the manifest declares a passphrase-wrap. */
	passphrase?: string;
	/** Progress callback — fires per table. */
	onProgress?: (p: ImportProgress) => void;
}

export interface ImportProgress {
	phase: 'parsing' | 'unsealing' | 'applying' | 'done';
	tablesProcessed: number;
	totalTables: number;
	currentTable?: string;
}

export interface ImportResult {
	manifest: BackupManifestV2;
	/** Rows actually applied, by table. Skipped tables not listed. */
	appliedPerTable: Record<string, number>;
	totalApplied: number;
	/** Tables that were in the archive but aren't in the current build. */
	skippedTables: string[];
}

export async function applyClientBackup(
	file: Blob,
	opts: ImportOptions = {}
): Promise<ImportResult> {
	opts.onProgress?.({ phase: 'parsing', tablesProcessed: 0, totalTables: 0 });

	const parsed = await readBackup(file);

	// Unwrap passphrase-sealed archives.
	let data: ParsedBackupV2;
	if ('sealedData' in parsed) {
		if (!parsed.manifest.passphrase) {
			throw new BackupParseError('archive contains data.sealed but manifest.passphrase is missing');
		}
		if (!opts.passphrase) {
			throw new PassphraseError('archive is passphrase-protected but no passphrase was provided');
		}
		opts.onProgress?.({ phase: 'unsealing', tablesProcessed: 0, totalTables: 0 });
		const inner = await unseal(opts.passphrase, parsed.sealedData, parsed.manifest.passphrase);
		data = await parseSealedData(parsed.manifest, inner);
	} else {
		data = parsed;
	}

	// Compat-check. formatVersion was already checked in parseManifest;
	// guard against schema drift here.
	if (!isSchemaCompatible(data.manifest.schemaVersion)) {
		throw new BackupParseError(
			`archive schema v${data.manifest.schemaVersion} is not compatible with this build — ` +
				`update Mana or re-export from a matching version`
		);
	}

	const knownTables = collectKnownTables();
	const entries = Object.entries(data.tables);
	const totalTables = entries.length;
	const appliedPerTable: Record<string, number> = {};
	const skippedTables: string[] = [];
	let totalApplied = 0;

	for (let i = 0; i < entries.length; i++) {
		const [table, rows] = entries[i];
		opts.onProgress?.({
			phase: 'applying',
			tablesProcessed: i,
			totalTables,
			currentTable: table,
		});

		if (!knownTables.has(table)) {
			skippedTables.push(table);
			continue;
		}

		if (rows.length === 0) {
			appliedPerTable[table] = 0;
			continue;
		}

		const prepared: Record<string, unknown>[] = [];
		for (const row of rows) {
			// Strip the source user's id so the Dexie creating-hook stamps
			// the current session's userId. This is what makes cross-account
			// restores work correctly — the imported rows are "adopted" by
			// the importing user.
			const clone = { ...row } as Record<string, unknown>;
			delete clone.userId;
			await encryptRecord(table, clone);
			prepared.push(clone);
		}

		await db.table(table).bulkPut(prepared);
		appliedPerTable[table] = prepared.length;
		totalApplied += prepared.length;
	}

	opts.onProgress?.({ phase: 'done', tablesProcessed: totalTables, totalTables });

	return {
		manifest: data.manifest,
		appliedPerTable,
		totalApplied,
		skippedTables,
	};
}

/**
 * Collect every table name declared by the currently-built modules.
 * Rows for tables NOT in this set are skipped (logged, not crashed).
 */
function collectKnownTables(): Set<string> {
	const out = new Set<string>();
	for (const mod of MODULE_CONFIGS) for (const t of mod.tables) out.add(t.name);
	return out;
}

/**
 * Minimal schema-compat gate. Policy: accept exports from the current
 * Dexie version and up to two versions older. Two rationale points:
 *   1. Anything older has likely had a destructive migration step we
 *      can't replay client-side.
 *   2. Exports from the FUTURE (user downgraded Mana) are outright
 *      refused — we have no idea what fields might have been added.
 */
function isSchemaCompatible(schemaVersion: number): boolean {
	const current = (db.verno as number | undefined) ?? 0;
	if (schemaVersion > current) return false;
	if (schemaVersion === 0) return true; // producedBy reported 'unknown' — be lenient
	return current - schemaVersion <= 2;
}
