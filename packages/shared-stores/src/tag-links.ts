/**
 * Tag Link Factory — Reusable junction table operations for modules.
 *
 * Each module has its own junction table (memoTags, fileTags, imageTags, etc.)
 * linking entities to global tags. This factory provides standard CRUD for those junctions.
 *
 * @example
 * ```typescript
 * import { createTagLinkOps } from '@mana/shared-stores';
 * import { db } from '$lib/data/database';
 *
 * export const memoTagOps = createTagLinkOps({
 *   table: () => db.table('memoTags'),
 *   entityIdField: 'memoId',
 * });
 *
 * // Usage:
 * await memoTagOps.addTag('memo-123', 'tag-456');
 * await memoTagOps.setTags('memo-123', ['tag-1', 'tag-2']);
 * const tagIds = await memoTagOps.getTagIds('memo-123');
 * ```
 */

import type { Table } from 'dexie';

interface BaseTagLink {
	id: string;
	tagId: string;
	createdAt?: string;
	updatedAt?: string;
	deletedAt?: string;
	[key: string]: unknown;
}

export interface TagLinkOpsConfig {
	/** Dexie table accessor (lazy to avoid import-order issues) */
	table: () => Table<BaseTagLink, string>;
	/** Entity ID field name on the junction record (e.g. 'memoId', 'fileId') */
	entityIdField: string;
}

export interface TagLinkOps {
	/** Get all tag IDs linked to an entity */
	getTagIds(entityId: string): Promise<string[]>;
	/** Add a tag to an entity (no-op if already linked) */
	addTag(entityId: string, tagId: string): Promise<void>;
	/** Remove a tag from an entity (soft-delete) */
	removeTag(entityId: string, tagId: string): Promise<void>;
	/** Replace all tags for an entity */
	setTags(entityId: string, tagIds: string[]): Promise<void>;
	/** Check if entity has a specific tag */
	hasTag(entityId: string, tagId: string): Promise<boolean>;
}

export function createTagLinkOps(config: TagLinkOpsConfig): TagLinkOps {
	const { entityIdField } = config;

	async function getActive(entityId: string): Promise<BaseTagLink[]> {
		const all = await config.table().where(entityIdField).equals(entityId).toArray();
		return all.filter((r) => !r.deletedAt);
	}

	return {
		async getTagIds(entityId: string): Promise<string[]> {
			const links = await getActive(entityId);
			return links.map((l) => l.tagId);
		},

		async addTag(entityId: string, tagId: string): Promise<void> {
			const existing = await getActive(entityId);
			if (existing.some((l) => l.tagId === tagId)) return;

			const now = new Date().toISOString();
			await config.table().add({
				id: crypto.randomUUID(),
				[entityIdField]: entityId,
				tagId,
				createdAt: now,
				updatedAt: now,
			} as BaseTagLink);
		},

		async removeTag(entityId: string, tagId: string): Promise<void> {
			const links = await getActive(entityId);
			const link = links.find((l) => l.tagId === tagId);
			if (!link) return;

			const now = new Date().toISOString();
			await config.table().update(link.id, { deletedAt: now, updatedAt: now });
		},

		async setTags(entityId: string, tagIds: string[]): Promise<void> {
			const now = new Date().toISOString();
			const existing = await getActive(entityId);
			const existingTagIds = new Set(existing.map((l) => l.tagId));
			const desiredTagIds = new Set(tagIds);

			// Remove tags no longer desired
			for (const link of existing) {
				if (!desiredTagIds.has(link.tagId)) {
					await config.table().update(link.id, { deletedAt: now, updatedAt: now });
				}
			}

			// Add new tags
			for (const tagId of tagIds) {
				if (!existingTagIds.has(tagId)) {
					await config.table().add({
						id: crypto.randomUUID(),
						[entityIdField]: entityId,
						tagId,
						createdAt: now,
						updatedAt: now,
					} as BaseTagLink);
				}
			}
		},

		async hasTag(entityId: string, tagId: string): Promise<boolean> {
			const links = await getActive(entityId);
			return links.some((l) => l.tagId === tagId);
		},
	};
}
