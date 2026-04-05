import type {
	Tag,
	TagResponse,
	CreateTagInput,
	UpdateTagInput,
	TagGroup,
	TagGroupResponse,
	CreateTagGroupInput,
	UpdateTagGroupInput,
	TagLink,
	TagLinkResponse,
	CreateTagLinkInput,
	SyncTagLinksInput,
} from './types';

/**
 * Configuration for TagsClient
 */
export interface TagsClientConfig {
	/**
	 * Base URL of mana-auth service (e.g., 'http://localhost:3001')
	 */
	authUrl: string;

	/**
	 * Function to get the current auth token
	 */
	getToken: () => Promise<string> | string;
}

/**
 * Client for interacting with the central Tags API in mana-auth.
 * Used by all Manacore apps to manage user tags.
 */
export class TagsClient {
	private authUrl: string;
	private getToken: () => Promise<string> | string;

	constructor(config: TagsClientConfig) {
		this.authUrl = config.authUrl.replace(/\/$/, ''); // Remove trailing slash
		this.getToken = config.getToken;
	}

	private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
		const token = await this.getToken();

		if (!token) {
			throw new Error('No authentication token available');
		}

		const response = await fetch(`${this.authUrl}/api/v1${path}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
				...options.headers,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || `Request failed: ${response.status}`);
		}

		// Handle 204 No Content
		if (response.status === 204) {
			return undefined as T;
		}

		return response.json();
	}

	/**
	 * Get all tags for the current user
	 */
	async getAll(): Promise<Tag[]> {
		const tags = await this.request<TagResponse[]>('/tags');
		return tags.map(this.normalizeTag);
	}

	/**
	 * Get a single tag by ID
	 */
	async getById(id: string): Promise<Tag | null> {
		try {
			const tag = await this.request<TagResponse>(`/tags/${id}`);
			return tag ? this.normalizeTag(tag) : null;
		} catch {
			return null;
		}
	}

	/**
	 * Get multiple tags by their IDs.
	 * Useful for resolving tagIds stored in junction tables.
	 */
	async getByIds(ids: string[]): Promise<Tag[]> {
		if (ids.length === 0) return [];

		const tags = await this.request<TagResponse[]>(`/tags/by-ids?ids=${ids.join(',')}`);
		return tags.map(this.normalizeTag);
	}

	/**
	 * Create a new tag
	 */
	async create(data: CreateTagInput): Promise<Tag> {
		const tag = await this.request<TagResponse>('/tags', {
			method: 'POST',
			body: JSON.stringify(data),
		});
		return this.normalizeTag(tag);
	}

	/**
	 * Update an existing tag
	 */
	async update(id: string, data: UpdateTagInput): Promise<Tag> {
		const tag = await this.request<TagResponse>(`/tags/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
		return this.normalizeTag(tag);
	}

	/**
	 * Delete a tag
	 */
	async delete(id: string): Promise<void> {
		await this.request(`/tags/${id}`, {
			method: 'DELETE',
		});
	}

	/**
	 * Create default tags for the user (if not already created)
	 */
	async createDefaults(): Promise<Tag[]> {
		const tags = await this.request<TagResponse[]>('/tags/defaults', {
			method: 'POST',
		});
		return tags.map(this.normalizeTag);
	}

	// ── Tag Groups ──────────────────────────────────────────

	/**
	 * Get all tag groups for the current user
	 */
	async getGroups(): Promise<TagGroup[]> {
		const groups = await this.request<TagGroupResponse[]>('/tag-groups');
		return groups.map(this.normalizeTagGroup);
	}

	/**
	 * Create a new tag group
	 */
	async createGroup(data: CreateTagGroupInput): Promise<TagGroup> {
		const group = await this.request<TagGroupResponse>('/tag-groups', {
			method: 'POST',
			body: JSON.stringify(data),
		});
		return this.normalizeTagGroup(group);
	}

	/**
	 * Update an existing tag group
	 */
	async updateGroup(id: string, data: UpdateTagGroupInput): Promise<TagGroup> {
		const group = await this.request<TagGroupResponse>(`/tag-groups/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
		return this.normalizeTagGroup(group);
	}

	/**
	 * Delete a tag group
	 */
	async deleteGroup(id: string): Promise<void> {
		await this.request(`/tag-groups/${id}`, {
			method: 'DELETE',
		});
	}

	/**
	 * Reorder tag groups by providing an ordered array of IDs
	 */
	async reorderGroups(ids: string[]): Promise<void> {
		await this.request('/tag-groups/reorder', {
			method: 'PUT',
			body: JSON.stringify({ ids }),
		});
	}

	// ── Tag Links ───────────────────────────────────────────

	/**
	 * Link a tag to an entity
	 */
	async linkTag(data: CreateTagLinkInput): Promise<TagLink> {
		const link = await this.request<TagLinkResponse>('/tag-links', {
			method: 'POST',
			body: JSON.stringify(data),
		});
		return this.normalizeTagLink(link);
	}

	/**
	 * Bulk link multiple tags to entities
	 */
	async bulkLinkTags(links: CreateTagLinkInput[]): Promise<TagLink[]> {
		const result = await this.request<TagLinkResponse[]>('/tag-links/bulk', {
			method: 'POST',
			body: JSON.stringify({ links }),
		});
		return result.map(this.normalizeTagLink);
	}

	/**
	 * Remove a tag link
	 */
	async unlinkTag(linkId: string): Promise<void> {
		await this.request(`/tag-links/${linkId}`, {
			method: 'DELETE',
		});
	}

	/**
	 * Get all tag links for a specific entity
	 */
	async getLinksForEntity(appId: string, entityId: string): Promise<TagLink[]> {
		const links = await this.request<TagLinkResponse[]>(
			`/tag-links?appId=${encodeURIComponent(appId)}&entityId=${encodeURIComponent(entityId)}`
		);
		return links.map(this.normalizeTagLink);
	}

	/**
	 * Get all tags for a specific entity (resolved Tag objects)
	 */
	async getTagsForEntity(appId: string, entityId: string): Promise<Tag[]> {
		const tags = await this.request<TagResponse[]>(
			`/tag-links/tags-for-entity?appId=${encodeURIComponent(appId)}&entityId=${encodeURIComponent(entityId)}`
		);
		return tags.map(this.normalizeTag);
	}

	/**
	 * Get all links for a specific tag
	 */
	async getLinksForTag(tagId: string): Promise<TagLink[]> {
		const links = await this.request<TagLinkResponse[]>(
			`/tag-links?tagId=${encodeURIComponent(tagId)}`
		);
		return links.map(this.normalizeTagLink);
	}

	/**
	 * Sync tags for an entity (add missing, remove extra)
	 */
	async syncEntityTags(data: SyncTagLinksInput): Promise<{ added: TagLink[]; removed: string[] }> {
		const result = await this.request<{ added: TagLinkResponse[]; removed: string[] }>(
			'/tag-links/sync',
			{
				method: 'POST',
				body: JSON.stringify(data),
			}
		);
		return {
			added: result.added.map(this.normalizeTagLink),
			removed: result.removed,
		};
	}

	// ── Normalizers ─────────────────────────────────────────

	/**
	 * Normalize API response to Tag type
	 */
	private normalizeTag(tag: TagResponse): Tag {
		return {
			...tag,
			createdAt: new Date(tag.createdAt),
			updatedAt: new Date(tag.updatedAt),
		};
	}

	/**
	 * Normalize API response to TagGroup type
	 */
	private normalizeTagGroup(group: TagGroupResponse): TagGroup {
		return {
			...group,
			createdAt: new Date(group.createdAt),
			updatedAt: new Date(group.updatedAt),
		};
	}

	/**
	 * Normalize API response to TagLink type
	 */
	private normalizeTagLink(link: TagLinkResponse): TagLink {
		return {
			...link,
			createdAt: new Date(link.createdAt),
		};
	}
}

/**
 * Create a TagsClient instance
 */
export function createTagsClient(config: TagsClientConfig): TagsClient {
	return new TagsClient(config);
}
