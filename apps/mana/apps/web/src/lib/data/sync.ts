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

import { db, SYNC_APP_MAP, toSyncName, fromSyncName, setApplyingServerChanges } from './database';

// ─── Types ────────────────────────────────────────────────────

interface PendingChange {
	id?: number;
	appId: string;
	collection: string;
	recordId: string;
	op: 'insert' | 'update' | 'delete';
	fields?: Record<string, { value: unknown; updatedAt: string }>;
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

		try {
			// Get oldest sync cursor for the `since` field
			const oldestCursor = await getOldestSyncCursor(appId);

			// Build changeset in backend protocol format
			const changeset = buildChangeset(pending, clientId, oldestCursor);

			const res = await fetch(`${serverUrl}/sync/${appId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					'X-Client-Id': clientId,
				},
				body: JSON.stringify(changeset),
			});

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
		} catch (err) {
			channel.lastError = err instanceof Error ? err.message : 'Push failed';
			setStatus('error');
		}
	}

	// ─── Pull: Server → Local ───────────────────────────────

	async function pull(appId: string): Promise<void> {
		const channel = channels.get(appId);
		if (!channel || !online) return;

		const token = await getToken();
		if (!token) return;

		setStatus('syncing');

		try {
			for (const tableName of channel.tables) {
				const syncName = toSyncName(tableName);
				let cursor = await getSyncCursor(appId, tableName);
				let hasMore = true;

				// Paginated pull: continue fetching until server signals no more data
				while (hasMore) {
					const res = await fetch(
						`${serverUrl}/sync/${appId}/pull?collection=${encodeURIComponent(syncName)}&since=${encodeURIComponent(cursor)}`,
						{
							headers: {
								Authorization: `Bearer ${token}`,
								'X-Client-Id': clientId,
							},
						}
					);

					if (!res.ok) break;

					const data = await res.json();
					hasMore = data.hasMore ?? false;

					if (data.serverChanges && data.serverChanges.length > 0) {
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
		} catch (err) {
			channel.lastError = err instanceof Error ? err.message : 'Pull failed';
			setStatus('error');
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

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });

				// Parse SSE events from buffer
				const events = buffer.split('\n\n');
				buffer = events.pop() ?? ''; // Keep incomplete last event

				for (const eventBlock of events) {
					if (!eventBlock.trim()) continue;

					let eventType = '';
					let eventData = '';

					for (const line of eventBlock.split('\n')) {
						if (line.startsWith('event: ')) {
							eventType = line.slice(7);
						} else if (line.startsWith('data: ')) {
							eventData = line.slice(6);
						}
					}

					if (eventType === 'changes' && eventData) {
						try {
							const data = JSON.parse(eventData);
							if (data.changes?.length > 0) {
								await applyServerChanges(appId, data.changes);
							}
							if (data.syncedUntil && data.table) {
								// Map backend table name to unified name for cursor storage
								const unifiedTable = fromSyncName(appId, data.table);
								await setSyncCursor(appId, unifiedTable, data.syncedUntil);
							}
						} catch {
							// Ignore malformed event data
						}
					}
					// heartbeat events are no-ops (keep connection alive)
				}
			}
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

	// ─── Apply Server Changes ───────────────────────────────

	async function applyServerChanges(appId: string, changes: any[]): Promise<void> {
		setApplyingServerChanges(true);
		try {
			// Group changes by table (server returns backend collection names)
			const byTable = new Map<string, any[]>();
			for (const change of changes) {
				const serverTable = change.table;
				// Map backend collection name → unified table name
				const unifiedTable = fromSyncName(appId, serverTable);
				if (!byTable.has(unifiedTable)) byTable.set(unifiedTable, []);
				byTable.get(unifiedTable)!.push(change);
			}

			for (const [tableName, tableChanges] of byTable) {
				const table = db.table(tableName);

				await db.transaction('rw', table, async () => {
					for (const change of tableChanges) {
						const recordId = change.id;

						if (change.deletedAt || change.op === 'delete') {
							// Soft delete or hard delete
							const existing = await table.get(recordId);
							if (existing) {
								if (change.deletedAt) {
									await table.update(recordId, {
										deletedAt: change.deletedAt,
										updatedAt: change.deletedAt,
									});
								} else {
									await table.delete(recordId);
								}
							}
						} else if (change.op === 'insert') {
							// Upsert for inserts
							const existing = await table.get(recordId);
							if (!existing) {
								await table.put(change.data ?? { id: recordId, ...change });
							} else {
								// Record exists — merge with LWW
								const updates: Record<string, unknown> = {};
								const changeData = change.data ?? change;
								for (const [key, val] of Object.entries(changeData)) {
									if (key === 'id') continue;
									updates[key] = val;
								}
								if (Object.keys(updates).length > 0) {
									await table.update(recordId, updates);
								}
							}
						} else if (change.op === 'update' && change.fields) {
							// Field-level LWW update
							const existing = await table.get(recordId);
							if (!existing) {
								// Record doesn't exist locally — reconstruct from fields
								const record: Record<string, unknown> = { id: recordId };
								for (const [key, fc] of Object.entries(change.fields as Record<string, any>)) {
									record[key] = fc.value;
								}
								await table.put(record);
							} else {
								// Merge — only update fields that are newer
								const updates: Record<string, unknown> = {};
								for (const [key, fc] of Object.entries(change.fields as Record<string, any>)) {
									const serverTime = fc.updatedAt ?? '';
									const localTime = (existing as any).updatedAt ?? '';
									if (serverTime >= localTime) {
										updates[key] = fc.value;
									}
								}
								if (Object.keys(updates).length > 0) {
									await table.update(recordId, updates);
								}
							}
						}
					}
				});
			}
		} finally {
			setApplyingServerChanges(false);
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
