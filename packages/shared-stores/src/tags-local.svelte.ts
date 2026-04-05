/**
 * Local-First Tag Store (Shared Across All Apps)
 *
 * Uses a shared IndexedDB database ('mana-tags') that all apps read from.
 * Tags are synced to the server via mana-sync, just like any other collection.
 *
 * Architecture:
 * - Tags + TagGroups → shared IndexedDB ('mana-tags'), one DB for all apps
 * - TagLinks (junction) → stay in each app's own IndexedDB (app-specific)
 * - Guest mode → default seed tags (Arbeit, Persönlich, Familie, Wichtig)
 * - Cross-app → all apps import the same store, read from the same DB
 */

import { createLocalStore, type BaseRecord } from '@mana/local-store';
import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import type {
	Tag,
	TagGroup,
	CreateTagInput,
	UpdateTagInput,
	CreateTagGroupInput,
	UpdateTagGroupInput,
} from '@mana/shared-tags';

// ─── Local Types ───────────────────────────────────────────

export interface LocalTag extends BaseRecord {
	name: string;
	color: string;
	icon?: string | null;
	groupId?: string | null;
	userId?: string;
	sortOrder: number;
}

export interface LocalTagGroup extends BaseRecord {
	name: string;
	color: string;
	icon?: string | null;
	userId?: string;
	sortOrder: number;
}

// ─── Type Converters ───────────────────────────────────────

export function toTag(local: LocalTag): Tag {
	return {
		id: local.id,
		userId: local.userId ?? 'guest',
		name: local.name,
		color: local.color,
		icon: local.icon,
		groupId: local.groupId,
		sortOrder: local.sortOrder,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toTagGroup(local: LocalTagGroup): TagGroup {
	return {
		id: local.id,
		userId: local.userId ?? 'guest',
		name: local.name,
		color: local.color,
		icon: local.icon,
		sortOrder: local.sortOrder,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Guest Seed Data ───────────────────────────────────────

const guestTags: LocalTag[] = [
	{
		id: 'tag-arbeit',
		name: 'Arbeit',
		color: '#3B82F6',
		icon: 'Briefcase',
		sortOrder: 0,
	},
	{
		id: 'tag-persoenlich',
		name: 'Persönlich',
		color: '#10B981',
		icon: 'User',
		sortOrder: 1,
	},
	{
		id: 'tag-familie',
		name: 'Familie',
		color: '#EC4899',
		icon: 'Heart',
		sortOrder: 2,
	},
	{
		id: 'tag-wichtig',
		name: 'Wichtig',
		color: '#EF4444',
		icon: 'Star',
		sortOrder: 3,
	},
];

// ─── Shared Store Instance ─────────────────────────────────

const SYNC_SERVER_URL =
	(typeof window !== 'undefined' &&
		(window as unknown as { __PUBLIC_SYNC_SERVER_URL__?: string }).__PUBLIC_SYNC_SERVER_URL__) ||
	(typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SYNC_SERVER_URL) ||
	'http://localhost:3050';

export const tagLocalStore = createLocalStore({
	appId: 'tags',
	collections: [
		{
			name: 'tags',
			indexes: ['name', 'groupId', 'sortOrder'],
			guestSeed: guestTags,
		},
		{
			name: 'tagGroups',
			indexes: ['sortOrder'],
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const tagCollection = tagLocalStore.collection<LocalTag>('tags');
export const tagGroupCollection = tagLocalStore.collection<LocalTagGroup>('tagGroups');

// ─── Live Query Hooks ──────────────────────────────────────

/** All tags, sorted by sortOrder. Auto-updates on any change. */
export function useAllTags() {
	return useLiveQueryWithDefault(async () => {
		const locals = await tagCollection.getAll(undefined, {
			sortBy: 'sortOrder',
			sortDirection: 'asc',
		});
		return locals.map(toTag);
	}, [] as Tag[]);
}

/** All tag groups, sorted by sortOrder. Auto-updates on any change. */
export function useAllTagGroups() {
	return useLiveQueryWithDefault(async () => {
		const locals = await tagGroupCollection.getAll(undefined, {
			sortBy: 'sortOrder',
			sortDirection: 'asc',
		});
		return locals.map(toTagGroup);
	}, [] as TagGroup[]);
}

// ─── Pure Query Helpers ────────────────────────────────────

export function getTagById(tags: Tag[], id: string): Tag | undefined {
	return tags.find((t) => t.id === id);
}

export function getTagsByIds(tags: Tag[], ids: string[]): Tag[] {
	return tags.filter((t) => ids.includes(t.id));
}

export function getTagColor(tags: Tag[], id: string): string {
	return tags.find((t) => t.id === id)?.color || '#6b7280';
}

export function getTagsByGroup(tags: Tag[], groupId: string | null): Tag[] {
	return tags.filter((t) => (t.groupId || null) === groupId);
}

// ─── Mutation Service ──────────────────────────────────────

let error = $state<string | null>(null);

export const tagMutations = {
	get error() {
		return error;
	},

	// === Store Lifecycle ===

	async initialize() {
		await tagLocalStore.initialize();
	},

	startSync(getToken: () => Promise<string | null>) {
		tagLocalStore.startSync(getToken);
	},

	stopSync() {
		tagLocalStore.stopSync();
	},

	// === Tags ===

	async createTag(data: CreateTagInput): Promise<Tag> {
		error = null;
		try {
			const count = await tagCollection.count();
			const newLocal: LocalTag = {
				id: crypto.randomUUID(),
				name: data.name,
				color: data.color ?? '#3B82F6',
				icon: data.icon ?? null,
				groupId: data.groupId ?? null,
				sortOrder: data.sortOrder ?? count,
			};
			const inserted = await tagCollection.insert(newLocal);
			return toTag(inserted);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create tag';
			throw e;
		}
	},

	async updateTag(id: string, data: UpdateTagInput): Promise<Tag> {
		error = null;
		try {
			const updated = await tagCollection.update(id, data as Partial<LocalTag>);
			if (updated) return toTag(updated);
			throw new Error('Tag not found');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update tag';
			throw e;
		}
	},

	async deleteTag(id: string): Promise<void> {
		error = null;
		try {
			await tagCollection.delete(id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete tag';
			throw e;
		}
	},

	// === Groups ===

	async createGroup(data: CreateTagGroupInput): Promise<TagGroup> {
		error = null;
		try {
			const count = await tagGroupCollection.count();
			const newLocal: LocalTagGroup = {
				id: crypto.randomUUID(),
				name: data.name,
				color: data.color ?? '#6b7280',
				icon: data.icon ?? null,
				sortOrder: data.sortOrder ?? count,
			};
			const inserted = await tagGroupCollection.insert(newLocal);
			return toTagGroup(inserted);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create tag group';
			throw e;
		}
	},

	async updateGroup(id: string, data: UpdateTagGroupInput): Promise<TagGroup> {
		error = null;
		try {
			const updated = await tagGroupCollection.update(id, data as Partial<LocalTagGroup>);
			if (updated) return toTagGroup(updated);
			throw new Error('Tag group not found');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update tag group';
			throw e;
		}
	},

	async deleteGroup(id: string): Promise<void> {
		error = null;
		try {
			await tagGroupCollection.delete(id);
			// Clear groupId on tags in deleted group
			const tagsInGroup = await tagCollection.getAll({ groupId: id } as Partial<LocalTag>);
			for (const tag of tagsInGroup) {
				await tagCollection.update(tag.id, { groupId: null } as Partial<LocalTag>);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete tag group';
			throw e;
		}
	},

	async reorderGroups(ids: string[]): Promise<void> {
		error = null;
		try {
			for (let i = 0; i < ids.length; i++) {
				await tagGroupCollection.update(ids[i], { sortOrder: i } as Partial<LocalTagGroup>);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reorder groups';
			throw e;
		}
	},
};
