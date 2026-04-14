/**
 * Backup import — streams a .mana archive into IndexedDB.
 *
 * Flow:
 *
 *  1. parseBackup() unzips the container and re-hashes events.jsonl.
 *  2. validate manifest:
 *       - formatVersion supported (enforced inside parseBackup)
 *       - userId matches the currently signed-in user (refuse otherwise —
 *         accidental restore into someone else's account would be a privacy
 *         disaster)
 *       - eventsSha256 matches the recomputed hash (integrity)
 *  3. iterate events, group by appId, apply in batches via the existing
 *     applyServerChanges() path. That function already handles LWW, type
 *     guards, suppressed hooks, and quota recovery — reusing it means
 *     imported events can never diverge from the server's own apply logic.
 *
 * Idempotency: applyServerChanges is LWW-safe, so re-running import with
 * the same file is a no-op beyond wasted work. A future optimization will
 * write eventIds into a _appliedEventIds dedup table, but the LWW semantics
 * already make the operation safe today.
 *
 * Scope (M4a): same-account restore. Events originate from mana-sync for
 * this user; after import, IndexedDB is repopulated without re-pushing to
 * the server (server already has every event, LWW would dedupe anyway).
 * Cross-account migration requires the MK transfer path (M5).
 */

import { applyServerChanges, type SyncChange } from '$lib/data/sync';
import { authStore } from '$lib/stores/auth.svelte';
import { iterateEvents, parseBackup, type BackupEvent, type ParsedBackup } from './format';

/** Emitted periodically during import so the UI can drive a progress bar. */
export interface ImportProgress {
	phase: 'parsing' | 'validating' | 'applying' | 'done';
	applied: number;
	total: number;
	currentAppId?: string;
}

export interface ImportOptions {
	/**
	 * If true, skip the eventsSha256 integrity check. Reserved for CLI
	 * debugging — production UI should always leave this false.
	 */
	skipIntegrityCheck?: boolean;
	/**
	 * Called after each batch so the UI can render progress. Called at
	 * least once with phase='done' on successful completion.
	 */
	onProgress?: (p: ImportProgress) => void;
}

export interface ImportResult {
	manifest: ParsedBackup['manifest'];
	appliedEvents: number;
	perApp: Record<string, number>;
}

export class BackupImportError extends Error {
	constructor(
		message: string,
		public readonly kind:
			| 'parse'
			| 'user-mismatch'
			| 'integrity'
			| 'schema-too-new'
			| 'not-authenticated'
			| 'apply'
	) {
		super(message);
		this.name = 'BackupImportError';
	}
}

const APPLY_BATCH_SIZE = 300;

// Mirrors CURRENT_SCHEMA_VERSION in sync.ts. We can't import the constant
// here without pulling sync.ts into every code path, but a tiny duplicate
// keyed on the same const is easier to audit than a transitive import.
// Update in lockstep when bumping the protocol version.
const MAX_SUPPORTED_IMPORT_SCHEMA_VERSION = 1;

/**
 * Import a user-provided .mana file into IndexedDB. Throws on user-mismatch,
 * integrity failure, or unsupported schema version. Callers should catch
 * BackupImportError and surface `kind` to the UI so the user gets a
 * specific error message instead of a generic "import failed".
 */
export async function importBackup(file: File, opts: ImportOptions = {}): Promise<ImportResult> {
	const { onProgress, skipIntegrityCheck = false } = opts;

	const currentUserId = authStore.user?.id;
	if (!currentUserId) {
		throw new BackupImportError(
			'not signed in — log in before importing a backup',
			'not-authenticated'
		);
	}

	onProgress?.({ phase: 'parsing', applied: 0, total: 0 });
	let parsed: ParsedBackup;
	try {
		parsed = await parseBackup(file);
	} catch (e) {
		throw new BackupImportError(`parse failed: ${(e as Error).message}`, 'parse');
	}
	const { manifest, eventsJsonl, computedEventsSha256 } = parsed;

	onProgress?.({ phase: 'validating', applied: 0, total: manifest.eventCount });

	if (manifest.userId !== currentUserId) {
		throw new BackupImportError(
			`backup is for user ${manifest.userId}, but you are signed in as ${currentUserId}`,
			'user-mismatch'
		);
	}

	if (!skipIntegrityCheck && manifest.eventsSha256 !== computedEventsSha256) {
		throw new BackupImportError(
			`events.jsonl integrity check failed (manifest=${manifest.eventsSha256}, computed=${computedEventsSha256})`,
			'integrity'
		);
	}

	const highestSeen = manifest.schemaVersionMax ?? manifest.schemaVersion;
	if (highestSeen > MAX_SUPPORTED_IMPORT_SCHEMA_VERSION) {
		throw new BackupImportError(
			`backup contains events at schemaVersion=${highestSeen}; this build only supports up to ${MAX_SUPPORTED_IMPORT_SCHEMA_VERSION}. Update the app and try again.`,
			'schema-too-new'
		);
	}

	// ─── Replay ───────────────────────────────────────────────
	// Group by appId inside each batch so applyServerChanges can scope its
	// per-table apply lock tightly. Batches are kept small enough to stay
	// responsive (progress reports every 300 events) but large enough that
	// the per-call overhead doesn't dominate.
	const perApp: Record<string, number> = {};
	let applied = 0;

	const batch: Record<string, SyncChange[]> = {};
	let batchCount = 0;

	const flush = async () => {
		for (const [appId, changes] of Object.entries(batch)) {
			if (changes.length === 0) continue;
			onProgress?.({ phase: 'applying', applied, total: manifest.eventCount, currentAppId: appId });
			try {
				await applyServerChanges(appId, changes);
			} catch (e) {
				throw new BackupImportError(
					`apply failed for app=${appId}: ${(e as Error).message}`,
					'apply'
				);
			}
			perApp[appId] = (perApp[appId] ?? 0) + changes.length;
			applied += changes.length;
			batch[appId] = [];
		}
		batchCount = 0;
	};

	for (const event of iterateEvents(eventsJsonl)) {
		const change = toSyncChange(event);
		if (!batch[event.appId]) batch[event.appId] = [];
		batch[event.appId].push(change);
		batchCount++;
		if (batchCount >= APPLY_BATCH_SIZE) {
			await flush();
		}
	}
	if (batchCount > 0) await flush();

	onProgress?.({ phase: 'done', applied, total: manifest.eventCount });

	return { manifest, appliedEvents: applied, perApp };
}

// ─── Event → SyncChange mapping ─────────────────────────────────
// The backup JSONL stores raw-store shape (data + fieldTimestamps). The
// sync-engine's SyncChange uses folded shape (fields: { key: { value,
// updatedAt } }) for updates. This mirrors the server-side projection in
// mana-sync's changeFromRow.

function toSyncChange(event: BackupEvent): SyncChange {
	const base: SyncChange = {
		eventId: event.eventId,
		schemaVersion: event.schemaVersion,
		table: event.table,
		id: event.id,
		op: event.op,
	};

	switch (event.op) {
		case 'insert':
			base.data = event.data ?? {};
			break;
		case 'update':
			if (event.data && event.fieldTimestamps) {
				const fields: Record<string, { value: unknown; updatedAt: string }> = {};
				for (const [key, updatedAt] of Object.entries(event.fieldTimestamps)) {
					if (key in event.data) {
						fields[key] = { value: event.data[key], updatedAt };
					}
				}
				base.fields = fields;
			}
			break;
		case 'delete': {
			const deletedAt = event.data?.deletedAt;
			if (typeof deletedAt === 'string') base.deletedAt = deletedAt;
			break;
		}
	}

	return base;
}
