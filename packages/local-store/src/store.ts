/**
 * LocalStore — the main entry point for apps.
 *
 * Creates a complete local-first data layer for an app:
 * - IndexedDB database (via Dexie.js)
 * - Typed collections with change tracking
 * - Sync engine (started/stopped based on auth state)
 *
 * @example
 * ```ts
 * import { createLocalStore } from '@mana/local-store';
 *
 * const store = createLocalStore({
 *   appId: 'todo',
 *   collections: [
 *     { name: 'tasks', indexes: ['projectId', 'dueDate'] },
 *     { name: 'projects', indexes: ['order'] },
 *     { name: 'labels' },
 *   ],
 *   sync: {
 *     serverUrl: 'http://localhost:3050',
 *   },
 * });
 *
 * // Get typed collections
 * const tasks = store.collection<Task>('tasks');
 * const projects = store.collection<Project>('projects');
 *
 * // Guest mode: just use collections, no sync
 * await tasks.insert({ id: crypto.randomUUID(), title: 'Hello', ... });
 *
 * // After login: start sync
 * store.startSync(() => authStore.getValidToken());
 *
 * // On logout: stop sync
 * store.stopSync();
 * ```
 */

import { LocalCollection } from './collection.js';
import { createDatabase, type LocalDatabase } from './database.js';
import { SyncEngine } from './sync/engine.js';
import type { BaseRecord, CollectionConfig, SyncStatus } from './types.js';

/** Client ID persisted in localStorage for device identification. */
function getOrCreateClientId(): string {
	const key = 'mana-client-id';
	if (typeof localStorage === 'undefined') return 'ssr-' + Math.random().toString(36).slice(2);

	let clientId = localStorage.getItem(key);
	if (!clientId) {
		clientId = crypto.randomUUID();
		localStorage.setItem(key, clientId);
	}
	return clientId;
}

export interface LocalStoreConfig {
	/** App identifier (e.g. 'todo', 'contacts'). Used as IndexedDB database name. */
	appId: string;
	/** Collection (table) definitions. */
	collections: CollectionConfig<BaseRecord>[];
	/** Sync server configuration. If omitted, sync is disabled (pure offline). */
	sync?: {
		/** Sync server base URL (e.g. 'http://localhost:3050'). */
		serverUrl: string;
		/** Debounce before pushing changes. Default: 1000ms. */
		pushDebounce?: number;
		/** Pull interval. Default: 30000ms. */
		pullInterval?: number;
		/** WebSocket URL (defaults to serverUrl with ws:// protocol). */
		wsUrl?: string;
	};
}

export class LocalStore {
	readonly db: LocalDatabase;
	readonly appId: string;

	private readonly _collections: Map<string, LocalCollection<BaseRecord>> = new Map();
	private _syncEngine: SyncEngine | null = null;
	private readonly _syncConfig: LocalStoreConfig['sync'];

	constructor(config: LocalStoreConfig) {
		this.appId = config.appId;
		this._syncConfig = config.sync;

		// Create database
		this.db = createDatabase(config.appId, config.collections);

		// Create collections with write notifications
		for (const colConfig of config.collections) {
			const collection = new LocalCollection(this.db, colConfig.name);
			collection.onWrite = () => this.schedulePush();
			this._collections.set(colConfig.name, collection);
		}
	}

	/**
	 * Initialize the store: open database and seed guest data.
	 * Call this once on app startup.
	 */
	async initialize(): Promise<void> {
		await this.db.open();
		await this.db.seedGuestData();
	}

	/**
	 * Get a typed collection by name.
	 */
	collection<T extends BaseRecord>(name: string): LocalCollection<T> {
		const col = this._collections.get(name);
		if (!col) {
			throw new Error(`[LocalStore] Collection "${name}" not found in app "${this.appId}"`);
		}
		return col as unknown as LocalCollection<T>;
	}

	/**
	 * Start syncing to the server. Call after user authenticates.
	 *
	 * @param getAuthToken — function that returns a valid JWT (or null).
	 */
	startSync(getAuthToken: () => Promise<string | null>): void {
		if (!this._syncConfig) {
			console.warn('[LocalStore] Sync not configured. Skipping startSync().');
			return;
		}

		if (this._syncEngine) {
			// Already running
			return;
		}

		this._syncEngine = new SyncEngine(this.db, {
			serverUrl: this._syncConfig.serverUrl,
			appId: this.appId,
			clientId: getOrCreateClientId(),
			getAuthToken,
			pushDebounce: this._syncConfig.pushDebounce,
			pullInterval: this._syncConfig.pullInterval,
			wsUrl: this._syncConfig.wsUrl,
		});

		// Register all collections
		for (const col of this._collections.values()) {
			this._syncEngine.registerCollection(col);
		}

		// Queue existing local data for initial sync (guest → authenticated transition)
		this._queueInitialSync().then(() => {
			this._syncEngine?.start();
		});
	}

	/**
	 * Stop syncing. Call on sign-out.
	 */
	stopSync(): void {
		this._syncEngine?.stop();
		this._syncEngine = null;
	}

	/**
	 * Get the sync engine (or null if not syncing).
	 * Used by useSyncStatus() Svelte hook.
	 */
	get syncEngine(): SyncEngine | null {
		return this._syncEngine;
	}

	/**
	 * Current sync status.
	 */
	get syncStatus(): SyncStatus {
		return this._syncEngine?.status ?? 'idle';
	}

	/**
	 * Whether the sync engine is running.
	 */
	get isSyncing(): boolean {
		return this._syncEngine?.enabled ?? false;
	}

	/**
	 * Schedule a push of local changes to the server.
	 * Called automatically by collections on write, but can be triggered manually.
	 */
	schedulePush(): void {
		this._syncEngine?.schedulePush();
	}

	/**
	 * Trigger an immediate full sync.
	 */
	async sync(): Promise<void> {
		await this._syncEngine?.sync();
	}

	/**
	 * Wipe all local data and re-seed. Use for recovery or sign-out cleanup.
	 */
	async reset(): Promise<void> {
		this.stopSync();
		await this.db.reset();
	}

	/**
	 * Queue all existing local records for sync if this is the first sync.
	 * Handles the guest→authenticated transition: local data gets pushed to server.
	 */
	private async _queueInitialSync(): Promise<void> {
		// Check if we've synced before — if any collection has a cursor, skip
		for (const [name] of this._collections) {
			const cursor = await this.db.getSyncCursor(name);
			if (cursor !== '1970-01-01T00:00:00.000Z') {
				// Already synced before — pending changes from writes will handle it
				return;
			}
		}

		// First sync: queue all local records as pending inserts
		let total = 0;
		for (const col of this._collections.values()) {
			const count = await col.queueAllForSync();
			total += count;
		}

		if (total > 0) {
			// eslint-disable-next-line no-console
			console.log(`[LocalStore] Queued ${total} local records for initial sync`);
		}
	}

	/**
	 * Close the database connection.
	 */
	close(): void {
		this.stopSync();
		this.db.close();
	}
}

/**
 * Create a LocalStore instance.
 */
export function createLocalStore(config: LocalStoreConfig): LocalStore {
	return new LocalStore(config);
}
