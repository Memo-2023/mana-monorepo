/**
 * One-shot at-rest encryption sweep.
 *
 * The Phase 2e encryption flip (docs/plans/space-scoped-data-model.md
 * §2e) turned `enabled: true` on globalTags / tagGroups /
 * workbenchScenes / aiMissions. Because `decryptRecords` is lenient
 * (it skips fields that aren't already encrypted), rows written BEFORE
 * the flip stay readable but remain plaintext at rest — a weakened
 * security posture if the user's IndexedDB is ever inspected.
 *
 * This sweep closes that gap: after login (when the vault is
 * unlocked) we iterate every row in every table that currently has
 * encryption enabled AND hasn't been swept before, re-save it through
 * `encryptRecord`, and mark the table done via a localStorage
 * sentinel.
 *
 * Key design points:
 *
 * - **Per-table sentinel**: if a new table flips to enabled:true in
 *   the future, only that table is swept on the next run. Already-
 *   swept tables aren't touched.
 * - **Change-tracking suppression**: writes inside the sweep go
 *   through `beginApplyingTables()` so the Dexie hook skips the
 *   `_pendingChanges` insert — we don't want to fire 100+ sync pushes
 *   for a re-encryption that never changed field values.
 * - **Idempotent inside each row**: `encryptRecord` checks
 *   `isEncrypted(value)` before wrapping, so a row with 2 of 3
 *   designated fields already encrypted (partial prior sweep, mixed
 *   boot state) gets only the remaining field wrapped.
 * - **Fire-and-forget at call site**: the sweep is async and logs
 *   its progress; callers don't await it. A failed sweep is never
 *   fatal to the boot path.
 */

import Dexie from 'dexie';
import { db, beginApplyingTables } from '../database';
import { isVaultUnlocked } from './key-provider';
import { ENCRYPTION_REGISTRY } from './registry';
import { encryptRecord } from './record-helpers';

const SENTINEL_PREFIX = 'mana:crypto:at-rest-sweep';
const SENTINEL_VERSION = 'v1';

function sentinelKey(tableName: string): string {
	return `${SENTINEL_PREFIX}:${tableName}:${SENTINEL_VERSION}:done`;
}

function hasSwept(tableName: string): boolean {
	if (typeof localStorage === 'undefined') return true; // SSR or test env — skip
	try {
		return localStorage.getItem(sentinelKey(tableName)) !== null;
	} catch {
		return true;
	}
}

function markSwept(tableName: string, rowCount: number): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(
			sentinelKey(tableName),
			JSON.stringify({ at: new Date().toISOString(), rows: rowCount })
		);
	} catch {
		/* storage quota — the sweep is a one-time optimisation, not load-bearing */
	}
}

/**
 * Sweep a single table: re-save every non-deleted row through
 * `encryptRecord` so any plaintext fields from before the encryption
 * flip get wrapped. Returns the number of rows touched.
 */
async function sweepTable(tableName: string): Promise<number> {
	const rows = (await db.table(tableName).toArray()) as Record<string, unknown>[];
	if (rows.length === 0) return 0;

	const dispose = beginApplyingTables([tableName]);
	try {
		let touched = 0;
		for (const row of rows) {
			if (row.deletedAt) continue;
			// encryptRecord mutates in place; isEncrypted() gate inside
			// means fields already encrypted stay untouched.
			await encryptRecord(tableName, row);
			// put() overwrites the row — safe because we just mutated the
			// same primary key. Dexie's default keyPath is 'id'; every
			// Mana record schema uses that.
			await db.table(tableName).put(row);
			touched++;
		}
		return touched;
	} finally {
		dispose();
	}
}

/**
 * Run the sweep across every currently-enabled encryption target that
 * hasn't been swept on this device before. Safe to call on every
 * unlock — already-swept tables short-circuit via their localStorage
 * sentinel.
 */
export async function runAtRestEncryptSweep(): Promise<void> {
	if (!isVaultUnlocked()) {
		console.warn('[mana-crypto:at-rest-sweep] vault locked, skipping — re-run after unlock');
		return;
	}

	const targets = Object.entries(ENCRYPTION_REGISTRY)
		.filter(([, cfg]) => cfg.enabled && cfg.fields.length > 0)
		.map(([tableName]) => tableName)
		.filter((tableName) => !hasSwept(tableName));

	if (targets.length === 0) return; // everything swept already

	console.info(
		`[mana-crypto:at-rest-sweep] starting for ${targets.length} table(s): ${targets.join(', ')}`
	);

	for (const tableName of targets) {
		try {
			const touched = await sweepTable(tableName);
			markSwept(tableName, touched);
			if (touched > 0) {
				console.info(`[mana-crypto:at-rest-sweep] ${tableName}: re-saved ${touched} row(s)`);
			}
		} catch (err) {
			if (err instanceof Dexie.DexieError) {
				console.error(`[mana-crypto:at-rest-sweep] ${tableName} failed (Dexie): ${err.message}`);
			} else {
				console.error(`[mana-crypto:at-rest-sweep] ${tableName} failed:`, err);
			}
			// Don't mark swept — the next unlock will retry this table.
		}
	}
}

/**
 * Test / recovery helper: clears every sweep sentinel so the next
 * `runAtRestEncryptSweep()` re-processes all enabled tables. No UI
 * hooks this up; exported for integration tests + manual recovery
 * via the browser console.
 */
export function resetSweepSentinels(): void {
	if (typeof localStorage === 'undefined') return;
	const prefix = `${SENTINEL_PREFIX}:`;
	try {
		const keys: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const k = localStorage.key(i);
			if (k && k.startsWith(prefix)) keys.push(k);
		}
		for (const k of keys) localStorage.removeItem(k);
	} catch {
		/* ignore */
	}
}
