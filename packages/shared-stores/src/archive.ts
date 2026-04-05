/**
 * Archive & Soft-Delete Utilities
 *
 * Standardizes the two-stage deletion pattern used across all modules:
 * 1. Archive (isArchived: true) — user-initiated "put away", reversible
 * 2. Soft-delete (deletedAt: timestamp) — trash, reversible but hidden deeper
 *
 * @example
 * ```typescript
 * import { createArchiveOps } from '@mana/shared-stores';
 * import { db } from '$lib/data/database';
 *
 * export const memoArchive = createArchiveOps({
 *   table: () => db.table('memos'),
 * });
 *
 * // Usage:
 * await memoArchive.archive('memo-123');
 * await memoArchive.unarchive('memo-123');
 * await memoArchive.softDelete('memo-123');
 * await memoArchive.restore('memo-123');
 * ```
 */

import type { Table } from 'dexie';

// ─── Types ────────────────────────────────────────────────

/** Mixin interface for archivable records. */
export interface Archivable {
	isArchived?: boolean;
	deletedAt?: string | null;
}

/** Mixin interface for soft-deletable records. */
export interface SoftDeletable {
	deletedAt?: string | null;
}

// ─── Query Helpers (pure functions) ───────────────────────

/** Filter to only active (non-archived, non-deleted) records. */
export function filterActive<T extends Archivable & SoftDeletable>(items: T[]): T[] {
	return items.filter((item) => !item.isArchived && !item.deletedAt);
}

/** Filter to only archived (but not deleted) records. */
export function filterArchived<T extends Archivable & SoftDeletable>(items: T[]): T[] {
	return items.filter((item) => item.isArchived && !item.deletedAt);
}

/** Filter to exclude soft-deleted records (regardless of archive status). */
export function filterNotDeleted<T extends SoftDeletable>(items: T[]): T[] {
	return items.filter((item) => !item.deletedAt);
}

// ─── Archive Ops Factory ──────────────────────────────────

export interface ArchiveOpsConfig {
	/** Dexie table accessor (lazy to avoid import-order issues) */
	table: () => Table;
	/** Archive field name (default: 'isArchived') */
	archiveField?: string;
}

export interface ArchiveOps {
	/** Set isArchived = true */
	archive(id: string): Promise<void>;
	/** Set isArchived = false */
	unarchive(id: string): Promise<void>;
	/** Toggle isArchived */
	toggleArchive(id: string): Promise<boolean>;
	/** Set deletedAt = now (soft-delete) */
	softDelete(id: string): Promise<void>;
	/** Clear deletedAt (restore from trash) */
	restore(id: string): Promise<void>;
}

export function createArchiveOps(config: ArchiveOpsConfig): ArchiveOps {
	const field = config.archiveField ?? 'isArchived';

	return {
		async archive(id: string) {
			await config.table().update(id, {
				[field]: true,
				updatedAt: new Date().toISOString(),
			});
		},

		async unarchive(id: string) {
			await config.table().update(id, {
				[field]: false,
				updatedAt: new Date().toISOString(),
			});
		},

		async toggleArchive(id: string): Promise<boolean> {
			const record = await config.table().get(id);
			if (!record) throw new Error(`Record ${id} not found`);
			const current = !!(record as Record<string, unknown>)[field];
			const newValue = !current;
			await config.table().update(id, {
				[field]: newValue,
				updatedAt: new Date().toISOString(),
			});
			return newValue;
		},

		async softDelete(id: string) {
			const now = new Date().toISOString();
			await config.table().update(id, {
				deletedAt: now,
				updatedAt: now,
			});
		},

		async restore(id: string) {
			await config.table().update(id, {
				deletedAt: null,
				updatedAt: new Date().toISOString(),
			});
		},
	};
}
