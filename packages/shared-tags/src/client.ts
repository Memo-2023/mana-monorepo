import type { Tag, TagResponse, CreateTagInput, UpdateTagInput } from './types';

/**
 * Configuration for TagsClient
 */
export interface TagsClientConfig {
	/**
	 * Base URL of mana-core-auth service (e.g., 'http://localhost:3001')
	 */
	authUrl: string;

	/**
	 * Function to get the current auth token
	 */
	getToken: () => Promise<string> | string;
}

/**
 * Client for interacting with the central Tags API in mana-core-auth.
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
}

/**
 * Create a TagsClient instance
 */
export function createTagsClient(config: TagsClientConfig): TagsClient {
	return new TagsClient(config);
}
