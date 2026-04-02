/**
 * Legacy Database Migration
 *
 * Migrates data from old per-app IndexedDB databases (manacore-todo,
 * manacore-calendar, etc.) into the unified `manacore` database.
 *
 * This runs once on app startup. After migration, old DBs are kept
 * (not deleted) as a safety net — they can be removed later.
 */

import Dexie from 'dexie';
import { db, SYNC_APP_MAP, TABLE_TO_SYNC_NAME } from './database';

const MIGRATION_KEY = 'manacore-unified-migrated';
const MIGRATION_VERSION = '1';

/**
 * Reverse of TABLE_TO_SYNC_NAME: for a given appId, maps
 * old DB table name → unified DB table name.
 */
function buildLegacyToUnifiedMap(): Record<string, Record<string, string>> {
	const result: Record<string, Record<string, string>> = {};

	for (const [appId, tables] of Object.entries(SYNC_APP_MAP)) {
		const map: Record<string, string> = {};
		for (const unifiedName of tables) {
			// The old DB used the backend collection name (before renaming)
			const legacyName = TABLE_TO_SYNC_NAME[unifiedName] ?? unifiedName;
			map[legacyName] = unifiedName;
		}
		result[appId] = map;
	}

	return result;
}

const LEGACY_TO_UNIFIED = buildLegacyToUnifiedMap();

/**
 * Migrate all legacy per-app databases into the unified DB.
 * Idempotent — checks if each record already exists before inserting.
 * Skips if migration was already completed.
 */
export async function migrateFromLegacyDbs(): Promise<void> {
	// Skip if already migrated
	if (typeof localStorage !== 'undefined') {
		const migrated = localStorage.getItem(MIGRATION_KEY);
		if (migrated === MIGRATION_VERSION) return;
	}

	const appIds = Object.keys(SYNC_APP_MAP);
	let migratedAny = false;

	for (const appId of appIds) {
		const legacyDbName = `manacore-${appId}`;

		// Check if legacy DB exists
		const exists = await Dexie.exists(legacyDbName);
		if (!exists) continue;

		try {
			await migrateSingleApp(appId, legacyDbName);
			migratedAny = true;
		} catch (err) {
			console.warn(`[LegacyMigration] Failed to migrate ${legacyDbName}:`, err);
			// Continue with other apps — don't block on one failure
		}
	}

	// Also migrate shared stores
	await migrateSharedStore('manacore-tags', {
		tags: 'globalTags',
		tagGroups: 'tagGroups',
	});
	await migrateSharedStore('manacore-links', {
		links: 'manaLinks',
	});

	// Mark migration as complete
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(MIGRATION_KEY, MIGRATION_VERSION);
	}

	if (migratedAny) {
		console.log('[LegacyMigration] Migration complete');
	}
}

/**
 * Migrate a single app's legacy DB into the unified DB.
 */
async function migrateSingleApp(appId: string, legacyDbName: string): Promise<void> {
	const legacyDb = new Dexie(legacyDbName);

	// Open without specifying schema — Dexie will read the existing schema
	await legacyDb.open();

	const tableMapping = LEGACY_TO_UNIFIED[appId] ?? {};
	const legacyTables = legacyDb.tables.map((t) => t.name);

	for (const legacyTableName of legacyTables) {
		// Skip internal tables
		if (legacyTableName.startsWith('_')) continue;

		// Find the unified table name
		const unifiedTableName = tableMapping[legacyTableName] ?? legacyTableName;

		// Check if this table exists in the unified DB
		try {
			db.table(unifiedTableName);
		} catch {
			// Table doesn't exist in unified DB — skip
			continue;
		}

		// Read all records from legacy table
		const records = await legacyDb.table(legacyTableName).toArray();
		if (records.length === 0) continue;

		// Batch upsert into unified DB (idempotent via bulkPut)
		const unifiedTable = db.table(unifiedTableName);
		await unifiedTable.bulkPut(records);
	}

	// Migrate sync cursors (_syncMeta)
	try {
		const syncMeta = await legacyDb.table('_syncMeta').toArray();
		for (const meta of syncMeta) {
			const collection = meta.collection;
			const unifiedCollection = tableMapping[collection] ?? collection;
			await db.table('_syncMeta').put({
				appId,
				collection: unifiedCollection,
				lastSyncedAt: meta.lastSyncedAt ?? meta.syncedUntil ?? '1970-01-01T00:00:00.000Z',
				pendingCount: 0,
			});
		}
	} catch {
		// _syncMeta may not exist in legacy DB
	}

	legacyDb.close();
}

/**
 * Migrate a shared store (tags, links) from its own legacy DB.
 */
async function migrateSharedStore(
	legacyDbName: string,
	tableMapping: Record<string, string>
): Promise<void> {
	const exists = await Dexie.exists(legacyDbName);
	if (!exists) return;

	try {
		const legacyDb = new Dexie(legacyDbName);
		await legacyDb.open();

		for (const [legacyName, unifiedName] of Object.entries(tableMapping)) {
			try {
				const records = await legacyDb.table(legacyName).toArray();
				if (records.length === 0) continue;
				await db.table(unifiedName).bulkPut(records);
			} catch {
				// Table may not exist
			}
		}

		legacyDb.close();
	} catch (err) {
		console.warn(`[LegacyMigration] Failed to migrate ${legacyDbName}:`, err);
	}
}
