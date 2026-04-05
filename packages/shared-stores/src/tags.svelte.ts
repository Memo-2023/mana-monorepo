/**
 * Tag Store Factory
 * Creates a tag store that uses the central mana-auth Tags API.
 * Replaces app-specific tag/label stores with a unified, cross-app implementation.
 */

import type {
	Tag,
	TagGroup,
	CreateTagInput,
	UpdateTagInput,
	CreateTagGroupInput,
	UpdateTagGroupInput,
} from '@mana/shared-tags';
import { TagsClient } from '@mana/shared-tags';

export interface TagStoreConfig {
	/** Base URL of mana-auth (e.g., 'http://localhost:3001') */
	authUrl: string;
	/** Function to get the current auth token */
	getToken: () => Promise<string | null> | string | null;
	/** Create default tags on first fetch if user has none (default: true) */
	createDefaults?: boolean;
}

export interface TagStore {
	readonly tags: Tag[];
	readonly groups: TagGroup[];
	readonly loading: boolean;
	readonly error: string | null;

	// Tags
	fetchTags(): Promise<void>;
	getById(id: string): Tag | undefined;
	getByIds(ids: string[]): Tag[];
	getColor(id: string): string;
	createTag(data: CreateTagInput): Promise<Tag>;
	updateTag(id: string, data: UpdateTagInput): Promise<Tag>;
	deleteTag(id: string): Promise<void>;

	// Groups
	fetchGroups(): Promise<void>;
	createGroup(data: CreateTagGroupInput): Promise<TagGroup>;
	updateGroup(id: string, data: UpdateTagGroupInput): Promise<TagGroup>;
	deleteGroup(id: string): Promise<void>;
	reorderGroups(ids: string[]): Promise<void>;

	// Utility
	getTagsByGroup(groupId: string | null): Tag[];
	clear(): void;
}

/**
 * Create a tag store backed by the central mana-auth Tags API.
 *
 * @example
 * ```ts
 * import { createTagStore } from '@mana/shared-stores';
 *
 * export const tagStore = createTagStore({
 *   authUrl: 'http://localhost:3001',
 *   getToken: () => authStore.getValidToken(),
 * });
 * ```
 */
export function createTagStore(config: TagStoreConfig): TagStore {
	const { createDefaults = true } = config;

	let client: TagsClient | null = null;

	function getClient(): TagsClient {
		if (!client) {
			client = new TagsClient({
				authUrl: config.authUrl,
				getToken: async () => {
					const token = await config.getToken();
					return token || '';
				},
			});
		}
		return client;
	}

	let tags = $state<Tag[]>([]);
	let groups = $state<TagGroup[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	return {
		get tags() {
			return tags;
		},
		get groups() {
			return groups;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},

		// === Tags ===

		async fetchTags() {
			loading = true;
			error = null;
			try {
				let result = await getClient().getAll();

				// Create defaults if user has no tags
				if (result.length === 0 && createDefaults) {
					result = await getClient().createDefaults();
				}

				tags = result;
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to fetch tags';
				console.error('Failed to fetch tags:', e);
			} finally {
				loading = false;
			}
		},

		getById(id: string): Tag | undefined {
			return tags.find((t) => t.id === id);
		},

		getByIds(ids: string[]): Tag[] {
			return tags.filter((t) => ids.includes(t.id));
		},

		getColor(id: string): string {
			return tags.find((t) => t.id === id)?.color || '#6b7280';
		},

		async createTag(data: CreateTagInput): Promise<Tag> {
			error = null;
			try {
				const tag = await getClient().create(data);
				tags = [...tags, tag];
				return tag;
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to create tag';
				throw e;
			}
		},

		async updateTag(id: string, data: UpdateTagInput): Promise<Tag> {
			error = null;
			try {
				const tag = await getClient().update(id, data);
				tags = tags.map((t) => (t.id === id ? tag : t));
				return tag;
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to update tag';
				throw e;
			}
		},

		async deleteTag(id: string): Promise<void> {
			error = null;
			try {
				await getClient().delete(id);
				tags = tags.filter((t) => t.id !== id);
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to delete tag';
				throw e;
			}
		},

		// === Groups ===

		async fetchGroups() {
			error = null;
			try {
				groups = await getClient().getGroups();
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to fetch tag groups';
				console.error('Failed to fetch tag groups:', e);
			}
		},

		async createGroup(data: CreateTagGroupInput): Promise<TagGroup> {
			error = null;
			try {
				const group = await getClient().createGroup(data);
				groups = [...groups, group];
				return group;
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to create tag group';
				throw e;
			}
		},

		async updateGroup(id: string, data: UpdateTagGroupInput): Promise<TagGroup> {
			error = null;
			try {
				const group = await getClient().updateGroup(id, data);
				groups = groups.map((g) => (g.id === id ? group : g));
				return group;
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to update tag group';
				throw e;
			}
		},

		async deleteGroup(id: string): Promise<void> {
			error = null;
			try {
				await getClient().deleteGroup(id);
				groups = groups.filter((g) => g.id !== id);
				// Tags in deleted group lose their groupId
				tags = tags.map((t) => (t.groupId === id ? { ...t, groupId: null } : t));
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to delete tag group';
				throw e;
			}
		},

		async reorderGroups(ids: string[]): Promise<void> {
			error = null;
			try {
				await getClient().reorderGroups(ids);
				// Re-sort local groups to match
				groups = ids
					.map((id) => groups.find((g) => g.id === id))
					.filter((g): g is TagGroup => g !== undefined);
			} catch (e) {
				error = e instanceof Error ? e.message : 'Failed to reorder groups';
				throw e;
			}
		},

		// === Utility ===

		getTagsByGroup(groupId: string | null): Tag[] {
			return tags.filter((t) => (t.groupId || null) === groupId);
		},

		clear() {
			tags = [];
			groups = [];
			loading = false;
			error = null;
			client = null;
		},
	};
}
