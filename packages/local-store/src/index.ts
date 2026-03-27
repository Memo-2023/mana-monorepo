// Core
export { createLocalStore, LocalStore } from './store.js';
export type { LocalStoreConfig } from './store.js';

// Database
export { createDatabase, LocalDatabase } from './database.js';

// Collection
export { LocalCollection } from './collection.js';

// Types
export type {
	BaseRecord,
	Change,
	ChangeOp,
	Changeset,
	CollectionConfig,
	ConflictStrategy,
	FieldChange,
	PendingChange,
	QueryOptions,
	SortDirection,
	SyncConfig,
	SyncConflict,
	SyncMeta,
	SyncResponse,
	SyncStatus,
} from './types.js';
