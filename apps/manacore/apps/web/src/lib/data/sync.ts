/**
 * Unified Sync Manager — orchestrates sync across all apps in one DB.
 *
 * Each appId gets its own sync "channel" to the mana-sync server,
 * but all share one Dexie database and one _pendingChanges table.
 *
 * Architecture:
 *   Unified DB → PendingChange (tagged with appId) → SyncChannel per appId → mana-sync /sync/{appId}
 *   mana-sync /sync/{appId} → WebSocket push → SyncChannel → applies to Unified DB
 */

import { db, SYNC_APP_MAP, TABLE_TO_APP } from './database';
import type Dexie from 'dexie';

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
	ws: WebSocket | null;
	pushTimer: ReturnType<typeof setTimeout> | null;
	pullTimer: ReturnType<typeof setInterval> | null;
	lastError: string | null;
}

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

// ─── Config ───────────────────────────────────────────────────

const PUSH_DEBOUNCE = 1000;
const PULL_INTERVAL = 30_000;
const WS_RECONNECT_DELAY = 5000;

// ─── Unified Sync Manager ─────────────────────────────────────

export function createUnifiedSync(serverUrl: string, getToken: () => Promise<string | null>) {
	const channels = new Map<string, SyncChannelState>();
	let clientId = getOrCreateClientId();
	let status: SyncStatus = 'idle';
	let online = typeof navigator !== 'undefined' ? navigator.onLine : true;

	// ─── Lifecycle ──────────────────────────────────────────

	function startAll(): void {
		for (const [appId, tables] of Object.entries(SYNC_APP_MAP)) {
			const channel: SyncChannelState = {
				appId,
				tables,
				ws: null,
				pushTimer: null,
				pullTimer: null,
				lastError: null,
			};
			channels.set(appId, channel);

			// Initial pull, then start periodic sync
			pull(appId).catch(() => {});
			channel.pullTimer = setInterval(() => pull(appId).catch(() => {}), PULL_INTERVAL);

			// Connect WebSocket for real-time push notifications
			connectWs(appId);
		}

		// Watch _pendingChanges for new writes
		db.table('_pendingChanges').hook('creating', (primKey, obj) => {
			// Auto-tag with appId based on collection
			if (!obj.appId && obj.collection) {
				obj.appId = TABLE_TO_APP[obj.collection] || 'manacore';
			}
			// Debounced push
			const appId = obj.appId;
			if (appId) schedulePush(appId);
		});

		// Listen for online/offline
		if (typeof window !== 'undefined') {
			window.addEventListener('online', handleOnline);
			window.addEventListener('offline', handleOffline);
		}
	}

	function stopAll(): void {
		for (const [appId, channel] of channels) {
			if (channel.pushTimer) clearTimeout(channel.pushTimer);
			if (channel.pullTimer) clearInterval(channel.pullTimer);
			if (channel.ws) {
				channel.ws.close();
				channel.ws = null;
			}
		}
		channels.clear();

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

		status = 'syncing';

		try {
			const changeset = buildChangeset(pending, clientId);
			const res = await fetch(`${serverUrl}/sync/${appId}/push`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(changeset),
			});

			if (!res.ok) throw new Error(`Push failed: ${res.status}`);

			// Clear synced pending changes
			const ids = pending.map((p) => p.id).filter((id): id is number => id !== undefined);
			await db.table('_pendingChanges').bulkDelete(ids);

			channel.lastError = null;
			status = 'idle';
		} catch (err) {
			channel.lastError = err instanceof Error ? err.message : 'Push failed';
			status = 'error';
		}
	}

	// ─── Pull: Server → Local ───────────────────────────────

	async function pull(appId: string): Promise<void> {
		const channel = channels.get(appId);
		if (!channel || !online) return;

		const token = await getToken();
		if (!token) return;

		status = 'syncing';

		try {
			for (const tableName of channel.tables) {
				const cursor = await getSyncCursor(appId, tableName);

				const res = await fetch(
					`${serverUrl}/sync/${appId}/pull?collection=${tableName}&since=${encodeURIComponent(cursor)}&clientId=${clientId}`,
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);

				if (!res.ok) continue;

				const data = await res.json();
				if (!data.changes || data.changes.length === 0) continue;

				// Apply changes to local DB
				await applyServerChanges(tableName, data.changes);

				// Update cursor
				if (data.syncedUntil) {
					await setSyncCursor(appId, tableName, data.syncedUntil);
				}
			}

			channel.lastError = null;
			status = 'idle';
		} catch (err) {
			channel.lastError = err instanceof Error ? err.message : 'Pull failed';
			status = 'error';
		}
	}

	// ─── WebSocket ──────────────────────────────────────────

	function connectWs(appId: string): void {
		const channel = channels.get(appId);
		if (!channel || !online) return;

		const wsUrl = serverUrl.replace(/^http/, 'ws') + `/sync/${appId}/ws?clientId=${clientId}`;

		try {
			const ws = new WebSocket(wsUrl);

			ws.onopen = () => {
				channel.ws = ws;
			};

			ws.onmessage = (event) => {
				try {
					const msg = JSON.parse(event.data);
					if (msg.type === 'push') {
						// Server notifies us of new changes — trigger pull
						pull(appId).catch(() => {});
					}
				} catch {}
			};

			ws.onclose = () => {
				channel.ws = null;
				// Reconnect after delay
				if (channels.has(appId) && online) {
					setTimeout(() => connectWs(appId), WS_RECONNECT_DELAY);
				}
			};

			ws.onerror = () => {
				ws.close();
			};
		} catch {
			// WebSocket not available or blocked
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

	async function applyServerChanges(tableName: string, changes: any[]): Promise<void> {
		const table = db.table(tableName);

		await db.transaction('rw', table, async () => {
			for (const change of changes) {
				if (change.deletedAt) {
					// Soft delete
					const existing = await table.get(change.id);
					if (existing) {
						await table.update(change.id, {
							deletedAt: change.deletedAt,
							updatedAt: change.updatedAt,
						});
					}
				} else if (change.op === 'delete') {
					await table.delete(change.id);
				} else {
					// Upsert — field-level LWW
					const existing = await table.get(change.id);
					if (!existing) {
						await table.put(change.data ?? change);
					} else {
						// Only update fields that are newer
						const updates: Record<string, unknown> = {};
						const changeData = change.data ?? change;
						for (const [key, val] of Object.entries(changeData)) {
							if (key === 'id') continue;
							const serverTime = change.fields?.[key]?.updatedAt ?? change.updatedAt;
							const localTime = (existing as any).updatedAt ?? '';
							if (serverTime >= localTime) {
								updates[key] = val;
							}
						}
						if (Object.keys(updates).length > 0) {
							await table.update(change.id, updates);
						}
					}
				}
			}
		});
	}

	function buildChangeset(pending: PendingChange[], cid: string) {
		return {
			clientId: cid,
			changes: pending.map((p) => ({
				collection: p.collection,
				recordId: p.recordId,
				op: p.op,
				fields: p.fields,
				data: p.data,
				deletedAt: p.deletedAt,
				createdAt: p.createdAt,
			})),
		};
	}

	function handleOnline() {
		online = true;
		status = 'idle';
		// Resume sync for all channels
		for (const appId of channels.keys()) {
			pull(appId).catch(() => {});
			connectWs(appId);
		}
	}

	function handleOffline() {
		online = false;
		status = 'offline';
		// Close all WebSockets
		for (const channel of channels.values()) {
			if (channel.ws) {
				channel.ws.close();
				channel.ws = null;
			}
		}
	}

	return {
		startAll,
		stopAll,
		get status() {
			return status;
		},
		get online() {
			return online;
		},
		getChannel: (appId: string) => channels.get(appId),
		pushNow: push,
		pullNow: pull,
	};
}

// ─── Client ID ────────────────────────────────────────────────

function getOrCreateClientId(): string {
	const key = 'manacore-sync-client-id';
	if (typeof localStorage === 'undefined') return crypto.randomUUID();
	let id = localStorage.getItem(key);
	if (!id) {
		id = crypto.randomUUID();
		localStorage.setItem(key, id);
	}
	return id;
}
