/**
 * Change Tracker — records local writes to _pendingChanges with appId routing.
 *
 * Usage in mutation stores:
 *   import { trackChange } from '$lib/data/change-tracker';
 *   await taskTable.put(task);
 *   await trackChange('tasks', task.id, 'insert', task);
 */

import { db, TABLE_TO_APP } from './database';

interface PendingChange {
	appId: string;
	collection: string;
	recordId: string;
	op: 'insert' | 'update' | 'delete';
	fields?: Record<string, { value: unknown; updatedAt: string }>;
	data?: Record<string, unknown>;
	deletedAt?: string;
	createdAt: string;
}

/**
 * Record a local change to _pendingChanges for later sync.
 */
export async function trackChange(
	collection: string,
	recordId: string,
	op: 'insert' | 'update' | 'delete',
	data?: Record<string, unknown>,
	fields?: Record<string, { value: unknown; updatedAt: string }>
): Promise<void> {
	const appId = TABLE_TO_APP[collection];
	if (!appId) {
		console.warn(`[ChangeTracker] No appId mapping for collection "${collection}"`);
		return;
	}

	const now = new Date().toISOString();

	const change: PendingChange = {
		appId,
		collection,
		recordId,
		op,
		createdAt: now,
	};

	if (fields) change.fields = fields;
	if (data) change.data = data;
	if (op === 'delete') change.deletedAt = now;

	await db.table('_pendingChanges').add(change);
}

/**
 * Record a field-level update change (LWW).
 * Only the changed fields are tracked, not the entire record.
 */
export async function trackFieldUpdate(
	collection: string,
	recordId: string,
	updatedFields: Record<string, unknown>
): Promise<void> {
	const now = new Date().toISOString();
	const fields: Record<string, { value: unknown; updatedAt: string }> = {};

	for (const [key, value] of Object.entries(updatedFields)) {
		fields[key] = { value, updatedAt: now };
	}

	await trackChange(collection, recordId, 'update', undefined, fields);
}

/**
 * Record a soft-delete change.
 */
export async function trackDelete(collection: string, recordId: string): Promise<void> {
	await trackChange(collection, recordId, 'delete');
}
