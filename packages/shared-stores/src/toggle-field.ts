/**
 * Generic boolean field toggle for Dexie tables.
 *
 * Standardizes the common pattern of toggling a boolean field (isFavorite, isPinned, etc.)
 * on a record in IndexedDB. Reads current value, flips it, updates with timestamp.
 *
 * @example
 * ```typescript
 * import { toggleField } from '@mana/shared-stores';
 * import { db } from '$lib/data/database';
 *
 * // In your store:
 * async function toggleFavorite(id: string) {
 *   return toggleField(db.table('contacts'), id, 'isFavorite');
 * }
 * ```
 */

import type { IndexableType, Table, UpdateSpec } from 'dexie';

/**
 * Toggle a boolean field on a Dexie record.
 * @returns The new value of the field after toggling.
 */
export async function toggleField<T>(
	table: Table<T, IndexableType>,
	id: string,
	field: string
): Promise<boolean> {
	const record = await table.get(id);
	if (!record) throw new Error(`Record ${id} not found`);

	const current = !!(record as Record<string, unknown>)[field];
	const newValue = !current;

	await table.update(id, {
		[field]: newValue,
		updatedAt: new Date().toISOString(),
	} as unknown as UpdateSpec<T>);

	return newValue;
}
