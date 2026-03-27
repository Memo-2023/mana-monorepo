/**
 * SyncEngine — orchestrates bidirectional sync between IndexedDB and the server.
 *
 * Push: Collects PendingChanges → sends as Changeset → clears on success
 * Pull: Fetches server delta since last cursor → applies to local collections
 * WebSocket: Listens for push notifications → triggers immediate pull
 *
 * The engine is designed to be resilient:
 * - Offline: queues changes, retries when online
 * - Partial failure: individual collection syncs are independent
 * - Duplicate safety: pending changes are only cleared after server confirms
 */

import type { LocalDatabase } from '../database.js';
import type { LocalCollection } from '../collection.js';
import type {
	BaseRecord,
	Change,
	Changeset,
	SyncConfig,
	SyncResponse,
	SyncStatus,
} from '../types.js';

export class SyncEngine {
	private readonly _db: LocalDatabase;
	private readonly _config: SyncConfig;
	private readonly _collections: Map<string, LocalCollection<BaseRecord>> = new Map();

	private _status: SyncStatus = 'idle';
	private _statusListeners: Set<(status: SyncStatus) => void> = new Set();
	private _pushTimer: ReturnType<typeof setTimeout> | null = null;
	private _pullTimer: ReturnType<typeof setInterval> | null = null;
	private _ws: WebSocket | null = null;
	private _enabled = false;
	private _online = true;

	constructor(db: LocalDatabase, config: SyncConfig) {
		this._db = db;
		this._config = {
			conflictStrategy: 'field-level-lww',
			pushDebounce: 1000,
			pullInterval: 30_000,
			...config,
		};
	}

	// ─── Public API ─────────────────────────────────────────────

	/** Current sync status. */
	get status(): SyncStatus {
		return this._status;
	}

	/** Whether the sync engine is enabled (user is authenticated). */
	get enabled(): boolean {
		return this._enabled;
	}

	/**
	 * Register a collection with the sync engine.
	 */
	registerCollection(collection: LocalCollection<BaseRecord>): void {
		this._collections.set(collection.name, collection);
	}

	/**
	 * Start the sync engine. Call this after user authenticates.
	 */
	start(): void {
		if (this._enabled) return;
		this._enabled = true;

		// Listen for online/offline events
		if (typeof window !== 'undefined') {
			window.addEventListener('online', this._handleOnline);
			window.addEventListener('offline', this._handleOffline);
			this._online = navigator.onLine;
		}

		// Initial sync
		this._doSync();

		// Start pull interval (fallback to WebSocket)
		this._pullTimer = setInterval(() => {
			if (this._online) this._doPull();
		}, this._config.pullInterval!);

		// Connect WebSocket
		this._connectWebSocket();
	}

	/**
	 * Stop the sync engine. Call this on sign-out.
	 */
	stop(): void {
		this._enabled = false;

		if (typeof window !== 'undefined') {
			window.removeEventListener('online', this._handleOnline);
			window.removeEventListener('offline', this._handleOffline);
		}

		if (this._pushTimer) {
			clearTimeout(this._pushTimer);
			this._pushTimer = null;
		}
		if (this._pullTimer) {
			clearInterval(this._pullTimer);
			this._pullTimer = null;
		}
		this._disconnectWebSocket();
		this._setStatus('idle');
	}

	/**
	 * Schedule a push of local changes. Debounced to avoid hammering the server.
	 */
	schedulePush(): void {
		if (!this._enabled || !this._online) return;

		if (this._pushTimer) {
			clearTimeout(this._pushTimer);
		}
		this._pushTimer = setTimeout(() => {
			this._doPush();
		}, this._config.pushDebounce!);
	}

	/**
	 * Trigger an immediate full sync (push + pull).
	 */
	async sync(): Promise<void> {
		if (!this._enabled) return;
		await this._doSync();
	}

	/**
	 * Listen for sync status changes.
	 */
	onStatusChange(listener: (status: SyncStatus) => void): () => void {
		this._statusListeners.add(listener);
		return () => this._statusListeners.delete(listener);
	}

	/**
	 * Get the total number of pending changes.
	 */
	async getPendingCount(): Promise<number> {
		return this._db.getPendingCount();
	}

	// ─── Internal: Sync Operations ──────────────────────────────

	private async _doSync(): Promise<void> {
		if (!this._online) {
			this._setStatus('offline');
			return;
		}

		this._setStatus('syncing');

		try {
			await this._doPush();
			await this._doPull();
			this._setStatus('synced');
		} catch (err) {
			console.error('[SyncEngine] sync failed:', err);
			this._setStatus('error');
		}
	}

	/**
	 * Push local pending changes to the server.
	 */
	private async _doPush(): Promise<void> {
		const allPending = await this._db._pendingChanges.orderBy('createdAt').toArray();
		if (allPending.length === 0) return;

		// Group by collection
		const byCollection = new Map<string, typeof allPending>();
		for (const p of allPending) {
			const list = byCollection.get(p.collection) ?? [];
			list.push(p);
			byCollection.set(p.collection, list);
		}

		// Build changeset
		const changes: Change[] = [];
		for (const [collection, pending] of byCollection) {
			// Deduplicate: for the same recordId, keep only the latest change
			const latest = new Map<string, (typeof pending)[0]>();
			for (const p of pending) {
				const existing = latest.get(p.recordId);
				if (!existing || p.createdAt > existing.createdAt) {
					// Merge fields if both are updates
					if (
						existing &&
						existing.op === 'update' &&
						p.op === 'update' &&
						existing.fields &&
						p.fields
					) {
						p.fields = { ...existing.fields, ...p.fields };
					}
					latest.set(p.recordId, p);
				}
			}

			for (const [recordId, p] of latest) {
				changes.push({
					table: collection,
					id: recordId,
					op: p.op,
					fields: p.fields,
					data: p.data,
					deletedAt: p.deletedAt,
				});
			}
		}

		const since = await this._getOldestSyncCursor();

		const changeset: Changeset = {
			clientId: this._config.clientId,
			appId: this._config.appId,
			since,
			changes,
		};

		const response = await this._sendChangeset(changeset);
		if (!response) return;

		// Apply server changes
		await this._applyServerChanges(response.serverChanges);

		// Clear successfully synced pending changes
		const ids = allPending.map((p) => p.id!).filter(Boolean);
		await this._db.clearPendingChanges(ids);

		// Update sync cursors
		for (const collection of this._collections.keys()) {
			await this._db.setSyncCursor(collection, response.syncedUntil);
		}
	}

	/**
	 * Pull server changes for all collections.
	 */
	private async _doPull(): Promise<void> {
		for (const [name] of this._collections) {
			const since = await this._db.getSyncCursor(name);

			const url = new URL(`/sync/${this._config.appId}/pull`, this._config.serverUrl);
			url.searchParams.set('collection', name);
			url.searchParams.set('since', since);

			try {
				const response = await this._fetch(url.toString(), { method: 'GET' });
				if (!response.ok) continue;

				const data: SyncResponse = await response.json();
				await this._applyServerChanges(data.serverChanges);
				await this._db.setSyncCursor(name, data.syncedUntil);
			} catch {
				// Pull failures are non-critical, will retry on next interval
			}
		}
	}

	/**
	 * Send a changeset to the sync server.
	 */
	private async _sendChangeset(changeset: Changeset): Promise<SyncResponse | null> {
		const url = `${this._config.serverUrl}/sync/${this._config.appId}`;

		try {
			const response = await this._fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(changeset),
			});

			if (!response.ok) {
				console.error('[SyncEngine] push failed:', response.status, await response.text());
				return null;
			}

			return response.json();
		} catch (err) {
			console.error('[SyncEngine] push network error:', err);
			return null;
		}
	}

	/**
	 * Apply server changes to local collections.
	 */
	private async _applyServerChanges(changes: Change[]): Promise<void> {
		for (const change of changes) {
			const collection = this._collections.get(change.table);
			if (!collection) continue;

			await collection.applyServerChange(change);
		}
	}

	// ─── Internal: WebSocket ────────────────────────────────────

	private _connectWebSocket(): void {
		if (!this._online) return;

		const baseUrl = this._config.wsUrl ?? this._config.serverUrl;
		const wsUrl = baseUrl.replace(/^http/, 'ws') + `/ws/${this._config.appId}`;

		try {
			this._ws = new WebSocket(wsUrl);

			this._ws.onopen = async () => {
				// Authenticate the WebSocket connection
				const token = await this._config.getAuthToken?.();
				if (token && this._ws?.readyState === WebSocket.OPEN) {
					this._ws.send(JSON.stringify({ type: 'auth', token }));
				}
			};

			this._ws.onmessage = (event) => {
				try {
					const msg = JSON.parse(event.data);
					if (msg.type === 'sync-available') {
						// Server has new changes — trigger immediate pull
						this._doPull();
					}
				} catch {
					// Ignore malformed messages
				}
			};

			this._ws.onclose = () => {
				this._ws = null;
				// Reconnect after delay if still enabled
				if (this._enabled && this._online) {
					setTimeout(() => this._connectWebSocket(), 5000);
				}
			};

			this._ws.onerror = () => {
				this._ws?.close();
			};
		} catch {
			// WebSocket not available (e.g. SSR)
		}
	}

	private _disconnectWebSocket(): void {
		if (this._ws) {
			this._ws.onclose = null; // Prevent auto-reconnect
			this._ws.close();
			this._ws = null;
		}
	}

	// ─── Internal: Helpers ──────────────────────────────────────

	/**
	 * Fetch with auth token injection.
	 */
	private async _fetch(url: string, init: RequestInit = {}): Promise<Response> {
		const token = await this._config.getAuthToken?.();
		const headers = new Headers(init.headers);
		if (token) {
			headers.set('Authorization', `Bearer ${token}`);
		}
		headers.set('X-Client-Id', this._config.clientId);

		return fetch(url, { ...init, headers });
	}

	/**
	 * Get the oldest sync cursor across all collections.
	 */
	private async _getOldestSyncCursor(): Promise<string> {
		let oldest = new Date().toISOString();
		for (const name of this._collections.keys()) {
			const cursor = await this._db.getSyncCursor(name);
			if (cursor < oldest) oldest = cursor;
		}
		return oldest;
	}

	private _setStatus(status: SyncStatus): void {
		if (this._status === status) return;
		this._status = status;
		for (const listener of this._statusListeners) {
			listener(status);
		}
	}

	private _handleOnline = (): void => {
		this._online = true;
		this._connectWebSocket();
		this._doSync();
	};

	private _handleOffline = (): void => {
		this._online = false;
		this._disconnectWebSocket();
		this._setStatus('offline');
	};
}
