/**
 * Local database management via Dexie.js.
 *
 * Each app gets its own IndexedDB database with:
 * - App-specific collections (tables)
 * - A shared _pendingChanges table for sync tracking
 * - A shared _syncMeta table for sync cursors
 */

import Dexie from 'dexie';
import type { BaseRecord, CollectionConfig, PendingChange, SyncMeta } from './types.js';

/**
 * Creates a Dexie database for an app with the given collections.
 *
 * @example
 * ```ts
 * const db = createDatabase('todo', [
 *   { name: 'tasks', indexes: ['projectId', 'dueDate', '[isCompleted+dueDate]'] },
 *   { name: 'projects', indexes: ['order'] },
 *   { name: 'labels', indexes: [] },
 * ]);
 * ```
 */
export function createDatabase(
	appId: string,
	collections: CollectionConfig<BaseRecord>[]
): LocalDatabase {
	const db = new LocalDatabase(appId, collections);
	return db;
}

export class LocalDatabase extends Dexie {
	/** Pending changes waiting to be synced to the server. */
	_pendingChanges!: Dexie.Table<PendingChange, number>;

	/** Sync metadata per collection (last sync timestamp, etc.). */
	_syncMeta!: Dexie.Table<SyncMeta, string>;

	private readonly _appId: string;
	private readonly _collections: CollectionConfig<BaseRecord>[];
	private _seeded = false;

	constructor(appId: string, collections: CollectionConfig<BaseRecord>[]) {
		super(`mana-${appId}`);
		this._appId = appId;
		this._collections = collections;

		// Build Dexie schema from collection configs
		const schema: Record<string, string> = {
			// Internal tables
			_pendingChanges: '++id, collection, recordId, createdAt',
			_syncMeta: 'collection',
		};

		for (const col of collections) {
			// Primary key is always 'id', plus any additional indexes
			const indexes = ['id', ...(col.indexes ?? [])];
			// Add updatedAt and deletedAt for sync queries
			indexes.push('updatedAt', 'deletedAt');
			schema[col.name] = indexes.join(', ');
		}

		this.version(1).stores(schema);
	}

	get appId(): string {
		return this._appId;
	}

	/**
	 * Load guest seed data into empty collections.
	 * Only runs once per database lifetime.
	 */
	async seedGuestData(): Promise<void> {
		if (this._seeded) return;
		this._seeded = true;

		for (const col of this._collections) {
			if (!col.guestSeed || col.guestSeed.length === 0) continue;

			const table = this.table(col.name);
			const count = await table.count();

			if (count === 0) {
				const now = new Date().toISOString();
				const records = col.guestSeed.map((record) => ({
					...record,
					createdAt: record.createdAt ?? now,
					updatedAt: record.updatedAt ?? now,
					deletedAt: null,
				}));
				await table.bulkPut(records);
			}
		}
	}

	/**
	 * Get the sync cursor (last synced timestamp) for a collection.
	 */
	async getSyncCursor(collection: string): Promise<string> {
		const meta = await this._syncMeta.get(collection);
		// Default: epoch — pull everything on first sync
		return meta?.lastSyncedAt ?? '1970-01-01T00:00:00.000Z';
	}

	/**
	 * Update the sync cursor after a successful sync.
	 */
	async setSyncCursor(collection: string, syncedUntil: string): Promise<void> {
		const pendingCount = await this._pendingChanges.where('collection').equals(collection).count();

		await this._syncMeta.put({
			collection,
			lastSyncedAt: syncedUntil,
			pendingCount,
		});
	}

	/**
	 * Get the number of pending (un-synced) changes across all collections.
	 */
	async getPendingCount(): Promise<number> {
		return this._pendingChanges.count();
	}

	/**
	 * Get pending changes for a specific collection, ordered by creation time.
	 */
	async getPendingChanges(collection: string): Promise<PendingChange[]> {
		return this._pendingChanges.where('collection').equals(collection).sortBy('createdAt');
	}

	/**
	 * Clear pending changes that have been successfully synced.
	 */
	async clearPendingChanges(ids: number[]): Promise<void> {
		await this._pendingChanges.bulkDelete(ids);
	}

	/**
	 * Wipe all data and re-seed. Used for recovery from corruption.
	 */
	async reset(): Promise<void> {
		for (const col of this._collections) {
			await this.table(col.name).clear();
		}
		await this._pendingChanges.clear();
		await this._syncMeta.clear();
		this._seeded = false;
		await this.seedGuestData();
	}
}
