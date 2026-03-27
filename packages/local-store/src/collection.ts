/**
 * LocalCollection — typed, reactive collection backed by IndexedDB.
 *
 * Wraps a Dexie table with:
 * - Change tracking (writes are recorded as PendingChanges for sync)
 * - Soft-delete (deletedAt instead of hard delete)
 * - Timestamp management (updatedAt per record, field_timestamps for LWW)
 *
 * All writes are synchronous from the caller's perspective — they return
 * immediately after queuing the IndexedDB write. No network call is needed.
 */

import type Dexie from 'dexie';
import type { Table } from 'dexie';
import type { LocalDatabase } from './database.js';
import type { BaseRecord, ChangeOp, FieldChange, PendingChange, QueryOptions } from './types.js';

export class LocalCollection<T extends BaseRecord> {
	readonly name: string;
	private readonly _db: LocalDatabase;
	private readonly _table: Table<T, string>;

	/** Called after every write to notify the sync engine. Set by LocalStore. */
	onWrite: (() => void) | null = null;

	constructor(db: LocalDatabase, name: string) {
		this.name = name;
		this._db = db;
		this._table = db.table(name);
	}

	/** Access the underlying Dexie table for advanced queries. */
	get table(): Table<T, string> {
		return this._table;
	}

	/** Access the parent database. */
	get db(): LocalDatabase {
		return this._db;
	}

	// ─── Reads ──────────────────────────────────────────────────

	/**
	 * Get a single record by ID. Returns undefined if not found or soft-deleted.
	 */
	async get(id: string): Promise<T | undefined> {
		const record = await this._table.get(id);
		if (!record || record.deletedAt) return undefined;
		return record;
	}

	/**
	 * Get all non-deleted records, optionally filtered and sorted.
	 */
	async getAll(filter?: Partial<T>, options?: QueryOptions<T>): Promise<T[]> {
		let collection: Dexie.Collection<T, string>;

		if (filter && Object.keys(filter).length > 0) {
			// Use the first filter key as an indexed where clause
			const entries = Object.entries(filter);
			const [firstKey, firstValue] = entries[0];
			collection = this._table.where(firstKey).equals(firstValue as string);

			// Apply remaining filters as JS filters
			for (let i = 1; i < entries.length; i++) {
				const [key, value] = entries[i];
				collection = collection.and((item) => (item as Record<string, unknown>)[key] === value);
			}
		} else {
			collection = this._table.toCollection();
		}

		// Exclude soft-deleted
		collection = collection.filter((item) => !item.deletedAt);

		let results: T[];

		if (options?.sortBy) {
			// Dexie doesn't support sorting on filtered collections directly,
			// so we get all matching, then sort in JS
			results = await collection.toArray();
			const key = options.sortBy as string;
			const dir = options.sortDirection === 'desc' ? -1 : 1;
			results.sort((a, b) => {
				const aVal = (a as Record<string, unknown>)[key];
				const bVal = (b as Record<string, unknown>)[key];
				if (aVal == null && bVal == null) return 0;
				if (aVal == null) return dir;
				if (bVal == null) return -dir;
				return aVal < bVal ? -dir : aVal > bVal ? dir : 0;
			});
		} else {
			results = await collection.toArray();
		}

		if (options?.offset) {
			results = results.slice(options.offset);
		}
		if (options?.limit) {
			results = results.slice(0, options.limit);
		}

		return results;
	}

	/**
	 * Count non-deleted records matching an optional filter.
	 */
	async count(filter?: Partial<T>): Promise<number> {
		if (!filter) {
			return this._table.filter((item) => !item.deletedAt).count();
		}
		const results = await this.getAll(filter);
		return results.length;
	}

	// ─── Writes ─────────────────────────────────────────────────

	/**
	 * Insert a new record. Generates timestamps and tracks the change.
	 */
	async insert(record: T): Promise<T> {
		const now = new Date().toISOString();
		const withMeta: T = {
			...record,
			createdAt: record.createdAt ?? now,
			updatedAt: now,
			deletedAt: null,
		};

		await this._db.transaction('rw', [this._table, this._db._pendingChanges], async () => {
			await this._table.put(withMeta);
			await this._trackChange(record.id, 'insert', undefined, withMeta);
		});

		this.onWrite?.();
		return withMeta;
	}

	/**
	 * Insert multiple records in a single transaction.
	 */
	async bulkInsert(records: T[]): Promise<T[]> {
		const now = new Date().toISOString();
		const withMeta = records.map((r) => ({
			...r,
			createdAt: r.createdAt ?? now,
			updatedAt: now,
			deletedAt: null,
		}));

		await this._db.transaction('rw', [this._table, this._db._pendingChanges], async () => {
			await this._table.bulkPut(withMeta);
			for (const record of withMeta) {
				await this._trackChange(record.id, 'insert', undefined, record);
			}
		});

		this.onWrite?.();
		return withMeta;
	}

	/**
	 * Update specific fields of a record. Only changed fields are tracked.
	 */
	async update(id: string, changes: Partial<T>): Promise<T | undefined> {
		const now = new Date().toISOString();

		// Remove meta fields from changes — we manage those
		const {
			id: _id,
			createdAt: _c,
			updatedAt: _u,
			deletedAt: _d,
			...fieldChanges
		} = changes as Record<string, unknown>;

		const fields: Record<string, FieldChange> = {};
		for (const [key, value] of Object.entries(fieldChanges)) {
			fields[key] = { value, updatedAt: now };
		}

		let updated: T | undefined;

		await this._db.transaction('rw', [this._table, this._db._pendingChanges], async () => {
			const existing = await this._table.get(id);
			if (!existing || existing.deletedAt) return;

			updated = { ...existing, ...fieldChanges, updatedAt: now } as T;
			await this._table.put(updated);
			await this._trackChange(id, 'update', fields);
		});

		this.onWrite?.();
		return updated;
	}

	/**
	 * Soft-delete a record. The record stays in IndexedDB but is excluded from queries.
	 */
	async delete(id: string): Promise<void> {
		const now = new Date().toISOString();

		await this._db.transaction('rw', [this._table, this._db._pendingChanges], async () => {
			const existing = await this._table.get(id);
			if (!existing || existing.deletedAt) return;

			const deleted = { ...existing, deletedAt: now, updatedAt: now };
			await this._table.put(deleted);
			await this._trackChange(id, 'delete', undefined, undefined, now);
		});

		this.onWrite?.();
	}

	/**
	 * Hard-delete a record. Used for purging old soft-deleted records.
	 */
	async purge(id: string): Promise<void> {
		await this._table.delete(id);
	}

	// ─── Sync Helpers ───────────────────────────────────────────

	/**
	 * Apply a server change to the local collection (used by SyncEngine).
	 * Does NOT create a PendingChange (to avoid re-syncing back to server).
	 */
	async applyServerChange(change: {
		id: string;
		op: ChangeOp;
		data?: Record<string, unknown>;
		fields?: Record<string, FieldChange>;
		deletedAt?: string;
	}): Promise<void> {
		switch (change.op) {
			case 'insert': {
				if (change.data) {
					await this._table.put(change.data as T);
				}
				break;
			}
			case 'update': {
				if (change.fields) {
					const existing = await this._table.get(change.id);
					if (!existing) {
						// Record doesn't exist locally — treat as insert if we have full data
						if (change.data) {
							await this._table.put(change.data as T);
						}
						break;
					}
					const updates: Record<string, unknown> = {};
					for (const [key, fc] of Object.entries(change.fields)) {
						updates[key] = fc.value;
					}
					updates['updatedAt'] = Object.values(change.fields).reduce(
						(latest, fc) => (fc.updatedAt > latest ? fc.updatedAt : latest),
						existing.updatedAt ?? ''
					);
					await this._table.put({ ...existing, ...updates } as T);
				}
				break;
			}
			case 'delete': {
				const now = change.deletedAt ?? new Date().toISOString();
				const toDelete = await this._table.get(change.id);
				if (toDelete) {
					await this._table.put({ ...toDelete, deletedAt: now, updatedAt: now });
				}
				break;
			}
		}
	}

	/**
	 * Get all records modified since a timestamp (for building changesets).
	 */
	async getModifiedSince(since: string): Promise<T[]> {
		return this._table.where('updatedAt').above(since).toArray();
	}

	/**
	 * Queue all existing local records as pending inserts.
	 * Used for initial sync after login — ensures guest data gets pushed to server.
	 */
	async queueAllForSync(): Promise<number> {
		const allRecords = await this._table.filter((r) => !r.deletedAt).toArray();
		let count = 0;

		await this._db.transaction('rw', [this._db._pendingChanges], async () => {
			for (const record of allRecords) {
				await this._db._pendingChanges.add({
					collection: this.name,
					recordId: record.id,
					op: 'insert',
					data: record as unknown as Record<string, unknown>,
					createdAt: new Date().toISOString(),
				});
				count++;
			}
		});

		return count;
	}

	// ─── Internal ───────────────────────────────────────────────

	private async _trackChange(
		recordId: string,
		op: ChangeOp,
		fields?: Record<string, FieldChange>,
		data?: T,
		deletedAt?: string
	): Promise<void> {
		const pending: PendingChange = {
			collection: this.name,
			recordId,
			op,
			fields,
			data: data as unknown as Record<string, unknown>,
			deletedAt,
			createdAt: new Date().toISOString(),
		};
		await this._db._pendingChanges.add(pending);
	}
}
