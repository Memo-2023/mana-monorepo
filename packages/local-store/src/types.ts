/**
 * Core types for the local-first data layer.
 */

/** Base record that all local-store entities must extend. */
export interface BaseRecord {
	id: string;
	createdAt?: string;
	updatedAt?: string;
	deletedAt?: string | null;
}

/** Sync status of a collection or the entire store. */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

/** A single field-level change for conflict resolution. */
export interface FieldChange {
	value: unknown;
	updatedAt: string;
}

/** Operations that can be applied to a record. */
export type ChangeOp = 'insert' | 'update' | 'delete';

/** A single change within a changeset. */
export interface Change {
	table: string;
	id: string;
	op: ChangeOp;
	/** Field-level values with timestamps (for update ops). */
	fields?: Record<string, FieldChange>;
	/** Full record data (for insert ops). */
	data?: Record<string, unknown>;
	/** Soft-delete timestamp (for delete ops). */
	deletedAt?: string;
}

/** A batch of changes sent to/from the sync server. */
export interface Changeset {
	clientId: string;
	appId: string;
	/** ISO timestamp — sync changes since this point. */
	since: string;
	changes: Change[];
}

/** Response from the sync server after processing a changeset. */
export interface SyncResponse {
	/** Changes from the server that the client doesn't have yet. */
	serverChanges: Change[];
	/** Conflicts that couldn't be auto-resolved (empty with field-level LWW). */
	conflicts: SyncConflict[];
	/** New sync cursor — use as `since` in the next request. */
	syncedUntil: string;
}

/** A conflict the server couldn't auto-resolve. */
export interface SyncConflict {
	table: string;
	id: string;
	field: string;
	clientValue: unknown;
	clientTimestamp: string;
	serverValue: unknown;
	serverTimestamp: string;
}

/** Conflict resolution strategy. */
export type ConflictStrategy = 'field-level-lww' | 'client-wins' | 'server-wins';

/** Configuration for the sync engine. */
export interface SyncConfig {
	/** Base URL of the sync server (e.g. http://localhost:3050). */
	serverUrl: string;
	/** App identifier (e.g. 'todo', 'contacts'). */
	appId: string;
	/** Unique device identifier (persisted in localStorage). */
	clientId: string;
	/** Conflict resolution strategy. Default: 'field-level-lww'. */
	conflictStrategy?: ConflictStrategy;
	/** Debounce time in ms before pushing local changes. Default: 1000. */
	pushDebounce?: number;
	/** Interval in ms for pulling server changes (fallback to WebSocket). Default: 30000. */
	pullInterval?: number;
	/** Function to get the current auth token (or null for guests). */
	getAuthToken?: () => Promise<string | null>;
	/** WebSocket URL (defaults to serverUrl with ws:// protocol). */
	wsUrl?: string;
}

/** Configuration for a single collection (table). */
export interface CollectionConfig<T extends BaseRecord> {
	/** Table/collection name (e.g. 'tasks', 'projects'). */
	name: string;
	/** Dexie index definitions (e.g. ['projectId', 'dueDate', '[isCompleted+dueDate]']). */
	indexes?: string[];
	/** Default seed data for guest mode (loaded when DB is empty). */
	guestSeed?: T[];
}

/** Metadata stored per collection for sync tracking. */
export interface SyncMeta {
	/** Collection name. */
	collection: string;
	/** Last successful sync timestamp (ISO). */
	lastSyncedAt: string;
	/** Number of pending (un-synced) changes. */
	pendingCount: number;
}

/** A pending change waiting to be synced. */
export interface PendingChange {
	/** Auto-incremented ID. */
	id?: number;
	/** Collection name. */
	collection: string;
	/** Record ID. */
	recordId: string;
	/** Operation type. */
	op: ChangeOp;
	/** Changed fields with timestamps. */
	fields?: Record<string, FieldChange>;
	/** Full record (for inserts). */
	data?: Record<string, unknown>;
	/** Soft-delete timestamp (for delete ops). */
	deletedAt?: string;
	/** When this change was made locally. */
	createdAt: string;
}

/** Sort direction for queries. */
export type SortDirection = 'asc' | 'desc';

/** Query options for collection.query(). */
export interface QueryOptions<T> {
	/** Sort by field name. */
	sortBy?: keyof T & string;
	/** Sort direction. Default: 'asc'. */
	sortDirection?: SortDirection;
	/** Maximum number of results. */
	limit?: number;
	/** Number of results to skip. */
	offset?: number;
}
