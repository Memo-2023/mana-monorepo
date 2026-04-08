/**
 * Unified Sync Manager — orchestrates sync across all apps in one DB.
 *
 * Each appId gets its own sync "channel" to the mana-sync server,
 * but all share one Dexie database and one _pendingChanges table.
 *
 * Architecture:
 *   Unified DB → PendingChange (tagged with appId) → SyncChannel per appId → mana-sync /sync/{appId}
 *   mana-sync /sync/{appId} → WebSocket push → SyncChannel → applies to Unified DB
 *
 * Backend protocol (mana-sync Go):
 *   Push:  POST /sync/{appId}  — body: { clientId, since, changes: [{ table, id, op, fields, data }] }
 *   Pull:  GET  /sync/{appId}/pull?collection={name}&since={cursor}
 *   WS:    GET  /ws/{appId}    — auth: { type: "auth", token: "..." }
 */

import {
	db,
	SYNC_APP_MAP,
	toSyncName,
	fromSyncName,
	beginApplyingTables,
	FIELD_TIMESTAMPS_KEY,
} from './database';
import { isQuotaError, cleanupTombstones, notifyQuotaExceeded } from './quota';
import { emitSyncTelemetry, categorizeSyncError } from './sync-telemetry';

// ─── Types ────────────────────────────────────────────────────

/** Operations the sync protocol supports. */
export type SyncOp = 'insert' | 'update' | 'delete';

/** A single field-level change carrying its own LWW timestamp. */
export interface FieldChange {
	value: unknown;
	updatedAt: string;
}

/**
 * One row of a changeset on the wire. Pending changes (local) and server
 * changes (remote) share the same shape so the validator can be reused.
 *
 * Invariants the validator enforces:
 *   - `op === 'update'` requires `fields` (record-level `data` is ignored).
 *   - `op === 'insert'` requires `data`.
 *   - A `deletedAt` flag implies a soft delete regardless of `op`.
 */
export interface SyncChange {
	table: string;
	id: string;
	op: SyncOp;
	fields?: Record<string, FieldChange>;
	data?: Record<string, unknown>;
	deletedAt?: string;
}

interface PendingChange {
	id?: number;
	appId: string;
	collection: string;
	recordId: string;
	op: SyncOp;
	fields?: Record<string, FieldChange>;
	data?: Record<string, unknown>;
	deletedAt?: string;
	createdAt: string;
}

interface SyncMeta {
	appId: string;
	collection: string;
	lastSyncedAt: string;
	pendingCount: number;
}

// ─── Wire-format type guards ─────────────────────────────────
//
// Server payloads are untrusted: a malformed `serverChanges` entry must be
// rejected before it touches Dexie. Hand-rolled guards keep us free of a
// runtime-validation dependency while still narrowing types properly.

function isFieldChange(v: unknown): v is FieldChange {
	if (!v || typeof v !== 'object') return false;
	const f = v as Record<string, unknown>;
	return 'value' in f && (f.updatedAt === undefined || typeof f.updatedAt === 'string');
}

function isFieldsMap(v: unknown): v is Record<string, FieldChange> {
	if (!v || typeof v !== 'object') return false;
	for (const value of Object.values(v as Record<string, unknown>)) {
		if (!isFieldChange(value)) return false;
	}
	return true;
}

function isSyncOp(v: unknown): v is SyncOp {
	return v === 'insert' || v === 'update' || v === 'delete';
}

/**
 * Returns `true` only for objects that match the on-the-wire SyncChange
 * contract well enough to apply safely. Soft errors (missing optional
 * fields) are tolerated; structural errors (wrong types, missing id/table)
 * are not.
 */
export function isValidSyncChange(v: unknown): v is SyncChange {
	if (!v || typeof v !== 'object') return false;
	const c = v as Record<string, unknown>;
	if (typeof c.table !== 'string' || c.table === '') return false;
	if (typeof c.id !== 'string' || c.id === '') return false;
	if (!isSyncOp(c.op)) return false;
	if (c.fields !== undefined && !isFieldsMap(c.fields)) return false;
	if (c.data !== undefined && (typeof c.data !== 'object' || c.data === null)) return false;
	if (c.deletedAt !== undefined && typeof c.deletedAt !== 'string') return false;
	return true;
}

// ─── Apply Server Changes (top-level so unit tests can import directly) ──

/**
 * Reads the per-field LWW timestamps off a record. Returns an empty map for
 * legacy records that pre-date __fieldTimestamps so callers can fall back to
 * record-level `updatedAt`.
 */
export function readFieldTimestamps(record: unknown): Record<string, string> {
	if (!record || typeof record !== 'object') return {};
	const ft = (record as Record<string, unknown>)[FIELD_TIMESTAMPS_KEY];
	return ft && typeof ft === 'object' ? (ft as Record<string, string>) : {};
}

/**
 * Applies a batch of server changes to the local Dexie database with
 * field-level Last-Write-Wins conflict resolution.
 *
 * Three branches based on the change op:
 *   - delete / deletedAt → soft delete (LWW-guarded) or hard delete
 *   - insert             → upsert with LWW merge against per-field timestamps
 *   - update + fields    → field-level LWW merge using server field timestamps
 *
 * Hooks are suppressed for the touched tables only (via beginApplyingTables)
 * so server-applied changes do NOT generate new pending-changes — but
 * concurrent user writes to OTHER tables continue tracking normally.
 * Malformed entries are dropped before any DB work happens.
 */
/**
 * Per-conflict event payload — emitted when applyServerChanges field-LWW
 * overwrites a local field value with a strictly newer server value.
 *
 * `wasLocal` is the value the user had typed before the sync overwrite.
 * `nowServer` is what the row holds now. The conflict store reads both
 * to give the user a "restore my version" option, which writes wasLocal
 * back with a fresh updatedAt so it wins on the next sync round.
 *
 * Conflicts are NOT raised when the local field was empty (no edit to
 * lose), when the values are identical, or when the timestamps are
 * exactly equal (LWW lets the server win on ties but there's nothing
 * meaningful to surface — both clients agreed at the same moment).
 */
export interface SyncConflictPayload {
	tableName: string;
	recordId: string;
	field: string;
	wasLocal: unknown;
	nowServer: unknown;
	localTime: string;
	serverTime: string;
}

/** Identifier kept around for legacy callers + readable telemetry —
 *  the conflict bus is a plain in-module pub/sub (see below) so it
 *  works the same way in browser and node test envs. */
export const SYNC_CONFLICT_EVENT = 'mana-sync-conflict';

/** Subscriber callback shape. */
export type SyncConflictListener = (payload: SyncConflictPayload) => void;

/** Active subscribers. Set so dedup is automatic and unsubscribe is O(1). */
const conflictListeners = new Set<SyncConflictListener>();

/**
 * Subscribe to sync-conflict events. Returns an unsubscribe function.
 *
 * Why a custom registry instead of CustomEvent + window.dispatchEvent?
 *   - Works in node-based vitest envs where `window` doesn't exist
 *   - No accidental coupling to the DOM EventTarget surface
 *   - Lighter than spinning up an EventTarget polyfill in tests
 *
 * The conflict-store module installs exactly one subscriber per app
 * lifecycle. The test file installs a temporary one per test case
 * via this same API.
 */
export function subscribeSyncConflicts(listener: SyncConflictListener): () => void {
	conflictListeners.add(listener);
	return () => {
		conflictListeners.delete(listener);
	};
}

function notifyConflict(payload: SyncConflictPayload): void {
	// Fan out to every subscriber. Errors in one listener don't break
	// the rest — sync detection is best-effort and we don't want a
	// broken UI handler to corrupt the apply path.
	for (const listener of conflictListeners) {
		try {
			listener(payload);
		} catch (err) {
			console.error('[mana-sync] conflict listener threw:', err);
		}
	}
}

/** Cheap structural equality for sync-conflict comparison. We don't
 *  need a deep diff here — `===` for primitives, JSON-string compare
 *  for objects (including encrypted-blob strings, which compare as
 *  raw strings). Hot path is rare so the JSON serialise cost is fine. */
function valuesEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (typeof a !== typeof b) return false;
	try {
		return JSON.stringify(a) === JSON.stringify(b);
	} catch {
		return false;
	}
}

export async function applyServerChanges(appId: string, changes: unknown[]): Promise<void> {
	// Reject malformed entries up-front so a single bad row from the server
	// can never write garbage into IndexedDB. Drops are logged once and the
	// good entries proceed — partial degradation beats a hard crash on a
	// payload we can't fix from the client.
	const validChanges: SyncChange[] = [];
	let dropped = 0;
	for (const c of changes) {
		if (isValidSyncChange(c)) validChanges.push(c);
		else dropped++;
	}
	if (dropped > 0) {
		console.warn(
			`[mana-sync] dropped ${dropped}/${changes.length} malformed server changes for app=${appId}`
		);
		emitSyncTelemetry({ kind: 'apply:malformed-drop', appId, count: dropped });
	}
	if (validChanges.length === 0) return;

	// Group changes by table first so we can scope the apply-lock to exactly
	// the tables we're about to touch. A previous global flag locked every
	// table for the duration of the apply, silently swallowing concurrent
	// user writes to unrelated modules.
	const byTable = new Map<string, SyncChange[]>();
	for (const change of validChanges) {
		const unifiedTable = fromSyncName(appId, change.table);
		if (!byTable.has(unifiedTable)) byTable.set(unifiedTable, []);
		byTable.get(unifiedTable)!.push(change);
	}

	const releaseApplyLock = beginApplyingTables(byTable.keys());
	try {
		for (const [tableName, tableChanges] of byTable) {
			const table = db.table(tableName);

			// Wraps the per-table transaction in a quota recovery loop: if the
			// browser rejects a write because the IndexedDB quota is full, we
			// hard-delete old tombstones and retry once before giving up.
			let attempts = 0;
			let recovered = false;
			while (true) {
				try {
					await db.transaction('rw', table, async () => {
						for (const change of tableChanges) {
							const recordId = change.id;

							if (change.deletedAt || change.op === 'delete') {
								const existing = await table.get(recordId);
								if (!existing) continue;
								if (change.deletedAt) {
									const localFT = readFieldTimestamps(existing);
									const serverTime = change.deletedAt;
									const localDeletedAtTime =
										localFT.deletedAt ??
										((existing as Record<string, unknown>).deletedAt as string | undefined) ??
										'';
									if (serverTime >= localDeletedAtTime) {
										await table.update(recordId, {
											deletedAt: serverTime,
											updatedAt: serverTime,
											[FIELD_TIMESTAMPS_KEY]: {
												...localFT,
												deletedAt: serverTime,
												updatedAt: serverTime,
											},
										});
									}
								} else {
									await table.delete(recordId);
								}
							} else if (change.op === 'insert') {
								// Upsert. `change.data` is the canonical payload; fall back to
								// the change envelope only for older flattened formats.
								const existing = await table.get(recordId);
								const changeData = change.data ?? (change as unknown as Record<string, unknown>);
								const recordTime =
									(changeData.updatedAt as string | undefined) ??
									(changeData.createdAt as string | undefined) ??
									new Date().toISOString();

								if (!existing) {
									const ft: Record<string, string> = {};
									for (const key of Object.keys(changeData)) {
										if (key === 'id' || key === FIELD_TIMESTAMPS_KEY) continue;
										ft[key] = recordTime;
									}
									await table.put({
										...changeData,
										id: recordId,
										[FIELD_TIMESTAMPS_KEY]: ft,
									});
								} else {
									const localFT = readFieldTimestamps(existing);
									const localUpdatedAt =
										((existing as Record<string, unknown>).updatedAt as string | undefined) ?? '';
									const updates: Record<string, unknown> = {};
									const newFT: Record<string, string> = { ...localFT };

									for (const [key, val] of Object.entries(changeData)) {
										if (key === 'id' || key === FIELD_TIMESTAMPS_KEY) continue;
										const localFieldTime = localFT[key] ?? localUpdatedAt;
										if (recordTime >= localFieldTime) {
											// Conflict signal: server STRICTLY wins (>) and the local
											// field had a non-empty value that differs from the new
											// one. Equal-time ties don't fire because there's no
											// edit to lose.
											const localValue = (existing as Record<string, unknown>)[key];
											if (
												recordTime > localFieldTime &&
												localValue != null &&
												!valuesEqual(localValue, val)
											) {
												notifyConflict({
													tableName,
													recordId,
													field: key,
													wasLocal: localValue,
													nowServer: val,
													localTime: localFieldTime,
													serverTime: recordTime,
												});
											}
											updates[key] = val;
											newFT[key] = recordTime;
										}
									}
									if (Object.keys(updates).length > 0) {
										updates[FIELD_TIMESTAMPS_KEY] = newFT;
										await table.update(recordId, updates);
									}
								}
							} else if (change.op === 'update' && change.fields) {
								// Field-level LWW update — the canonical conflict-resolution path.
								const existing = await table.get(recordId);
								const serverFields = change.fields;

								if (!existing) {
									// Reconstruct from fields. Other clients only see this if the
									// record was deleted locally — recreate it under the server's
									// authority.
									const record: Record<string, unknown> = { id: recordId };
									const ft: Record<string, string> = {};
									const fallback = new Date().toISOString();
									for (const [key, fc] of Object.entries(serverFields)) {
										record[key] = fc.value;
										ft[key] = fc.updatedAt ?? fallback;
									}
									record[FIELD_TIMESTAMPS_KEY] = ft;
									await table.put(record);
								} else {
									// Per-field comparison. Falls back to record-level updatedAt
									// only for legacy records that pre-date __fieldTimestamps.
									const localFT = readFieldTimestamps(existing);
									const localUpdatedAt =
										((existing as Record<string, unknown>).updatedAt as string | undefined) ?? '';
									const updates: Record<string, unknown> = {};
									const newFT: Record<string, string> = { ...localFT };

									for (const [key, fc] of Object.entries(serverFields)) {
										const serverTime = fc.updatedAt ?? '';
										const localFieldTime = localFT[key] ?? localUpdatedAt;
										if (serverTime >= localFieldTime) {
											// Same conflict criteria as the insert-as-update path:
											// strictly newer + non-empty local + actually different.
											const localValue = (existing as Record<string, unknown>)[key];
											if (
												serverTime > localFieldTime &&
												localValue != null &&
												!valuesEqual(localValue, fc.value)
											) {
												notifyConflict({
													tableName,
													recordId,
													field: key,
													wasLocal: localValue,
													nowServer: fc.value,
													localTime: localFieldTime,
													serverTime,
												});
											}
											updates[key] = fc.value;
											newFT[key] = serverTime;
										}
									}
									if (Object.keys(updates).length > 0) {
										updates[FIELD_TIMESTAMPS_KEY] = newFT;
										await table.update(recordId, updates);
									}
								}
							}
						}
					});
					break; // transaction succeeded
				} catch (err) {
					if (!isQuotaError(err) || attempts >= 1) {
						if (isQuotaError(err)) {
							notifyQuotaExceeded({
								table: tableName,
								op: 'apply',
								cleaned: 0,
								recovered,
							});
						}
						throw err;
					}
					attempts++;
					const cleaned = await cleanupTombstones();
					recovered = cleaned > 0;
					if (cleaned === 0) {
						notifyQuotaExceeded({ table: tableName, op: 'apply', cleaned: 0, recovered: false });
						throw err;
					}
				}
			}
		}
		emitSyncTelemetry({ kind: 'apply:done', appId, count: validChanges.length });
	} finally {
		releaseApplyLock();
	}
}

interface SyncChannelState {
	appId: string;
	tables: string[];
	pushTimer: ReturnType<typeof setTimeout> | null;
	pullTimer: ReturnType<typeof setInterval> | null;
	lastError: string | null;
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

// ─── Config ───────────────────────────────────────────────────

const PUSH_DEBOUNCE = 1000;
const PULL_INTERVAL = 30_000;
const WS_RECONNECT_DELAY = 5000;

// Retry config for transient sync failures (network drops, 5xx).
// 4xx (auth, validation) is treated as permanent and not retried.
const RETRY_MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 8_000;

function isRetriableStatus(status: number): boolean {
	return status === 0 || status === 408 || status === 429 || status >= 500;
}

function backoffDelay(attempt: number): number {
	const exp = Math.min(RETRY_MAX_DELAY_MS, RETRY_BASE_DELAY_MS * 2 ** attempt);
	// Full jitter to avoid thundering herd when many clients reconnect together.
	return Math.floor(Math.random() * exp);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Wraps a fetch call with exponential backoff. Re-throws after the final
 * attempt or immediately for non-retriable HTTP errors.
 */
async function fetchWithRetry(
	input: RequestInfo | URL,
	init: RequestInit,
	label: string
): Promise<Response> {
	let lastError: unknown = null;
	for (let attempt = 0; attempt < RETRY_MAX_ATTEMPTS; attempt++) {
		try {
			const res = await fetch(input, init);
			if (res.ok) return res;
			if (!isRetriableStatus(res.status)) return res; // permanent — let caller handle
			lastError = new Error(`${label} failed: HTTP ${res.status}`);
		} catch (err) {
			// AbortError must propagate immediately (caller-initiated cancel).
			if (err instanceof Error && err.name === 'AbortError') throw err;
			lastError = err;
		}
		if (attempt < RETRY_MAX_ATTEMPTS - 1) {
			await sleep(backoffDelay(attempt));
		}
	}
	throw lastError instanceof Error ? lastError : new Error(`${label} failed`);
}

/**
 * Eager apps are synced at startup (needed for dashboard widgets).
 * Lazy apps are synced on first module visit via ensureAppSynced().
 */
const EAGER_APPS = new Set([
	'mana', // User settings, dashboard config
	'todo', // Dashboard: tasks today widget
	'calendar', // Dashboard: upcoming events widget
	'contacts', // Dashboard: favorites widget
	'tags', // Global tags used everywhere
	'links', // Shared links
]);
// ─── Unified Sync Manager ─────────────────────────────────────

export function createUnifiedSync(serverUrl: string, getToken: () => Promise<string | null>) {
	const channels = new Map<string, SyncChannelState>();
	const clientId = getOrCreateClientId();
	let status: SyncStatus = 'idle';
	let online = typeof navigator !== 'undefined' ? navigator.onLine : true;
	let _statusListeners: Array<(s: SyncStatus) => void> = [];
	const sseAbortControllers = new Map<string, AbortController>();

	// ─── Lifecycle ──────────────────────────────────────────

	function startAll(): void {
		// Register all channels
		for (const [appId, tables] of Object.entries(SYNC_APP_MAP)) {
			const channel: SyncChannelState = {
				appId,
				tables,
				pushTimer: null,
				pullTimer: null,
				lastError: null,
			};
			channels.set(appId, channel);

			if (EAGER_APPS.has(appId)) {
				// Eager apps: use HTTP polling (SSE would exhaust browser's 6-connection limit)
				pull(appId).catch(() => {});
				channel.pullTimer = setInterval(() => pull(appId).catch(() => {}), PULL_INTERVAL);
			}
			// Lazy apps: no pull until ensureAppSynced() is called
		}

		// Listen for online/offline
		if (typeof window !== 'undefined') {
			window.addEventListener('online', handleOnline);
			window.addEventListener('offline', handleOffline);
		}
	}

	function stopAll(): void {
		for (const [, channel] of channels) {
			if (channel.pushTimer) clearTimeout(channel.pushTimer);
			if (channel.pullTimer) clearInterval(channel.pullTimer);
		}
		// Abort all SSE connections
		for (const [, controller] of sseAbortControllers) {
			controller.abort();
		}
		sseAbortControllers.clear();
		channels.clear();
		_statusListeners = [];

		if (typeof window !== 'undefined') {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		}
	}

	// ─── Push: Local → Server ───────────────────────────────

	function schedulePush(appId: string): void {
		const channel = channels.get(appId);
		if (!channel || !online) return;

		if (channel.pushTimer) clearTimeout(channel.pushTimer);
		channel.pushTimer = setTimeout(() => push(appId).catch(() => {}), PUSH_DEBOUNCE);
	}

	/** Called from Dexie hooks when a pending change is recorded. */
	function onPendingChange(appId: string): void {
		schedulePush(appId);
	}

	async function push(appId: string): Promise<void> {
		const channel = channels.get(appId);
		if (!channel) return;

		const token = await getToken();
		if (!token) return;

		// Get pending changes for this appId
		const pending: PendingChange[] = await db
			.table('_pendingChanges')
			.where('appId')
			.equals(appId)
			.sortBy('createdAt');

		if (pending.length === 0) return;

		setStatus('syncing');
		const startedAt = Date.now();
		emitSyncTelemetry({ kind: 'push:start', appId, count: pending.length });

		try {
			// Get oldest sync cursor for the `since` field
			const oldestCursor = await getOldestSyncCursor(appId);

			// Build changeset in backend protocol format
			const changeset = buildChangeset(pending, clientId, oldestCursor);

			const res = await fetchWithRetry(
				`${serverUrl}/sync/${appId}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
						'X-Client-Id': clientId,
					},
					body: JSON.stringify(changeset),
				},
				`push[${appId}]`
			);

			if (!res.ok) throw new Error(`Push failed: ${res.status}`);

			const data = await res.json();

			// Apply server changes from the response
			if (data.serverChanges?.length > 0) {
				await applyServerChanges(appId, data.serverChanges);
			}

			// Update sync cursor
			if (data.syncedUntil) {
				for (const tableName of channel.tables) {
					await setSyncCursor(appId, tableName, data.syncedUntil);
				}
			}

			// Clear synced pending changes
			const ids = pending.map((p) => p.id).filter((id): id is number => id !== undefined);
			await db.table('_pendingChanges').bulkDelete(ids);

			channel.lastError = null;
			setStatus('idle');
			emitSyncTelemetry({
				kind: 'push:ok',
				appId,
				count: pending.length,
				durationMs: Date.now() - startedAt,
			});
		} catch (err) {
			channel.lastError = err instanceof Error ? err.message : 'Push failed';
			setStatus('error');
			emitSyncTelemetry({
				kind: 'push:error',
				appId,
				durationMs: Date.now() - startedAt,
				errorCategory: categorizeSyncError(err),
			});
		}
	}

	// ─── Pull: Server → Local ───────────────────────────────

	async function pull(appId: string): Promise<void> {
		const channel = channels.get(appId);
		if (!channel || !online) return;

		const token = await getToken();
		if (!token) return;

		setStatus('syncing');
		const startedAt = Date.now();
		emitSyncTelemetry({ kind: 'pull:start', appId });
		let totalApplied = 0;

		try {
			for (const tableName of channel.tables) {
				const syncName = toSyncName(tableName);
				let cursor = await getSyncCursor(appId, tableName);
				let hasMore = true;

				// Paginated pull: continue fetching until server signals no more data
				while (hasMore) {
					const res = await fetchWithRetry(
						`${serverUrl}/sync/${appId}/pull?collection=${encodeURIComponent(syncName)}&since=${encodeURIComponent(cursor)}`,
						{
							headers: {
								Authorization: `Bearer ${token}`,
								'X-Client-Id': clientId,
							},
						},
						`pull[${appId}/${syncName}]`
					);

					if (!res.ok) break;

					const data = await res.json();
					hasMore = data.hasMore ?? false;

					if (data.serverChanges && data.serverChanges.length > 0) {
						totalApplied += data.serverChanges.length;
						await applyServerChanges(appId, data.serverChanges);
					}

					if (data.syncedUntil) {
						cursor = data.syncedUntil;
					} else {
						break;
					}
				}

				// Update cursor after all pages fetched
				await setSyncCursor(appId, tableName, cursor);
			}

			channel.lastError = null;
			setStatus('idle');
			emitSyncTelemetry({
				kind: 'pull:ok',
				appId,
				count: totalApplied,
				durationMs: Date.now() - startedAt,
			});
		} catch (err) {
			channel.lastError = err instanceof Error ? err.message : 'Pull failed';
			setStatus('error');
			emitSyncTelemetry({
				kind: 'pull:error',
				appId,
				durationMs: Date.now() - startedAt,
				errorCategory: categorizeSyncError(err),
			});
		}
	}

	// ─── SSE Stream (one per app — replaces WebSocket + Pull) ──

	async function connectSSE(appId: string): Promise<void> {
		if (!online) return;

		const channel = channels.get(appId);
		if (!channel) return;

		// Abort existing SSE connection for this app
		sseAbortControllers.get(appId)?.abort();

		const token = await getToken();
		if (!token) return;

		// Build collections list (backend names)
		const collections = channel.tables.map(toSyncName).join(',');

		// Get oldest cursor across all collections for this app
		const since = await getOldestSyncCursor(appId);

		const controller = new AbortController();
		sseAbortControllers.set(appId, controller);

		try {
			const res = await fetch(
				`${serverUrl}/sync/${appId}/stream?collections=${encodeURIComponent(collections)}&since=${encodeURIComponent(since)}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						'X-Client-Id': clientId,
						Accept: 'text/event-stream',
					},
					signal: controller.signal,
				}
			);

			if (!res.ok || !res.body) {
				// Fallback to polling if SSE not available
				channel.pullTimer = setInterval(() => pull(appId).catch(() => {}), PULL_INTERVAL);
				return;
			}

			const reader = res.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			// Apply queue: events are parsed and apply()ed sequentially in
			// the background while the reader keeps draining the network.
			// LWW correctness still requires in-order application, so we
			// chain promises instead of running them concurrently. The win
			// is throughput — read() no longer blocks on a slow apply.
			let applyChain: Promise<void> = Promise.resolve();
			const enqueueApply = (work: () => Promise<void>) => {
				applyChain = applyChain.then(work).catch((err) => {
					console.error('[mana-sync] SSE apply failed:', err);
				});
			};

			// Streaming parser: scan the rolling buffer for complete events
			// (terminated by `\n\n`) using indexOf+slice instead of split.
			// Each event block is sub-parsed line-by-line for `event:` and
			// `data:` fields, then enqueued for application.
			const flushCompleteEvents = () => {
				while (true) {
					const boundary = buffer.indexOf('\n\n');
					if (boundary === -1) return;
					const eventBlock = buffer.slice(0, boundary);
					buffer = buffer.slice(boundary + 2);
					if (!eventBlock.trim()) continue;

					let eventType = '';
					let eventData = '';
					// Manual line walk avoids allocating an intermediate
					// string array per event block.
					let lineStart = 0;
					while (lineStart <= eventBlock.length) {
						const lineEnd = eventBlock.indexOf('\n', lineStart);
						const line =
							lineEnd === -1 ? eventBlock.slice(lineStart) : eventBlock.slice(lineStart, lineEnd);
						if (line.startsWith('event: ')) eventType = line.slice(7);
						else if (line.startsWith('data: ')) eventData = line.slice(6);
						if (lineEnd === -1) break;
						lineStart = lineEnd + 1;
					}

					if (eventType !== 'changes' || !eventData) continue;
					// Heartbeat / unknown event types fall through silently.

					let parsed: { changes?: unknown[]; syncedUntil?: string; table?: string };
					try {
						parsed = JSON.parse(eventData);
					} catch {
						continue; // malformed event data — skip
					}

					enqueueApply(async () => {
						if (parsed.changes && parsed.changes.length > 0) {
							await applyServerChanges(appId, parsed.changes);
						}
						if (parsed.syncedUntil && parsed.table) {
							const unifiedTable = fromSyncName(appId, parsed.table);
							await setSyncCursor(appId, unifiedTable, parsed.syncedUntil);
						}
					});
				}
			};

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				flushCompleteEvents();
			}

			// Drain any final apply work before letting the connection
			// settle into reconnect — otherwise the SSE state could resume
			// from a cursor that hasn't actually been written yet.
			await applyChain;
		} catch (err: unknown) {
			if (err instanceof Error && err.name === 'AbortError') return;
			channel.lastError = err instanceof Error ? err.message : 'SSE failed';
		}

		// Connection ended — reconnect after delay if still active
		sseAbortControllers.delete(appId);
		if (channels.has(appId) && online) {
			setTimeout(() => connectSSE(appId), WS_RECONNECT_DELAY);
		}
	}

	// ─── Helpers ─────────────────────────────────────────────

	async function getSyncCursor(appId: string, collection: string): Promise<string> {
		const meta: SyncMeta | undefined = await db.table('_syncMeta').get([appId, collection]);
		return meta?.lastSyncedAt ?? '1970-01-01T00:00:00.000Z';
	}

	async function setSyncCursor(
		appId: string,
		collection: string,
		syncedUntil: string
	): Promise<void> {
		await db.table('_syncMeta').put({
			appId,
			collection,
			lastSyncedAt: syncedUntil,
			pendingCount: 0,
		});
	}

	async function getOldestSyncCursor(appId: string): Promise<string> {
		const channel = channels.get(appId);
		if (!channel) return '1970-01-01T00:00:00.000Z';

		let oldest = new Date().toISOString();
		for (const tableName of channel.tables) {
			const cursor = await getSyncCursor(appId, tableName);
			if (cursor < oldest) oldest = cursor;
		}
		return oldest;
	}

	/**
	 * Build changeset in backend protocol format.
	 * Maps unified table names to backend collection names.
	 */
	function buildChangeset(pending: PendingChange[], cid: string, since: string) {
		return {
			clientId: cid,
			since,
			changes: pending.map((p) => ({
				table: toSyncName(p.collection),
				id: p.recordId,
				op: p.op,
				fields: p.fields,
				data: p.data,
				deletedAt: p.deletedAt,
			})),
		};
	}

	function handleOnline() {
		online = true;
		setStatus('idle');
		// Resume sync for active channels
		for (const appId of channels.keys()) {
			const channel = channels.get(appId);
			if (channel?.pullTimer || EAGER_APPS.has(appId)) {
				pull(appId).catch(() => {});
			}
		}
	}

	function handleOffline() {
		online = false;
		setStatus('offline');
	}

	function setStatus(s: SyncStatus) {
		status = s;
		for (const listener of _statusListeners) {
			listener(s);
		}
	}

	/**
	 * Ensure a lazy app's collections are synced (called on module navigation).
	 * If already synced (has pullTimer), this is a no-op.
	 */
	function ensureAppSynced(appId: string): void {
		const channel = channels.get(appId);
		if (!channel || channel.pullTimer) return;

		pull(appId).catch(() => {});
		channel.pullTimer = setInterval(() => pull(appId).catch(() => {}), PULL_INTERVAL);
	}

	return {
		startAll,
		stopAll,
		ensureAppSynced,
		onPendingChange,
		get status() {
			return status;
		},
		get online() {
			return online;
		},
		onStatusChange(listener: (s: SyncStatus) => void) {
			_statusListeners.push(listener);
			return () => {
				_statusListeners = _statusListeners.filter((l) => l !== listener);
			};
		},
		getChannel: (appId: string) => channels.get(appId),
		pushNow: push,
		pullNow: pull,
	};
}

// ─── Client ID ────────────────────────────────────────────────

function getOrCreateClientId(): string {
	const key = 'mana-sync-client-id';
	if (typeof localStorage === 'undefined') return crypto.randomUUID();
	let id = localStorage.getItem(key);
	if (!id) {
		id = crypto.randomUUID();
		localStorage.setItem(key, id);
	}
	return id;
}
