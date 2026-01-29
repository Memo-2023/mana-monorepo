/**
 * API Client for Storage Backend
 * Uses @manacore/shared-api-client for consistent error handling
 */

import { createApiClient, type ApiResult } from '@manacore/shared-api-client';
import { authStore } from '$lib/stores/auth.svelte';

const API_URL = 'http://localhost:3016';

/**
 * Storage API client instance
 * - Auto token handling via authStore.getValidToken()
 * - Consistent ApiResult<T> response format
 */
const api = createApiClient({
	baseUrl: API_URL,
	apiPrefix: '/api/v1',
	getAuthToken: () => authStore.getAccessToken(),
	timeout: 30000,
	debug: import.meta.env.DEV,
});

// Legacy type alias for backward compatibility
export interface ApiResponse<T> {
	data?: T;
	error?: string;
}

/**
 * Convert ApiResult to legacy ApiResponse format
 */
function toLegacyResponse<T>(result: ApiResult<T>): ApiResponse<T> {
	if (result.error) {
		return { error: result.error.message };
	}
	return { data: result.data ?? undefined };
}

/**
 * Legacy request wrapper for backward compatibility
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
	const method = options.method || 'GET';
	const body = options.body ? JSON.parse(options.body as string) : undefined;

	let result: ApiResult<T>;
	switch (method) {
		case 'POST':
			result = await api.post<T>(endpoint, body);
			break;
		case 'PUT':
			result = await api.put<T>(endpoint, body);
			break;
		case 'PATCH':
			result = await api.patch<T>(endpoint, body);
			break;
		case 'DELETE':
			result = await api.delete<T>(endpoint);
			break;
		default:
			result = await api.get<T>(endpoint);
	}

	return toLegacyResponse(result);
}

// File Types
export interface StorageFile {
	id: string;
	userId: string;
	name: string;
	originalName: string;
	mimeType: string;
	size: number;
	storagePath: string;
	storageKey: string;
	parentFolderId: string | null;
	currentVersion: number;
	isFavorite: boolean;
	isDeleted: boolean;
	deletedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface StorageFolder {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	color: string | null;
	parentFolderId: string | null;
	path: string;
	depth: number;
	isFavorite: boolean;
	isDeleted: boolean;
	deletedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Share {
	id: string;
	userId: string;
	fileId: string | null;
	folderId: string | null;
	shareType: 'file' | 'folder';
	shareToken: string;
	accessLevel: 'view' | 'edit' | 'download';
	password: string | null;
	maxDownloads: number | null;
	downloadCount: number;
	expiresAt: string | null;
	isActive: boolean;
	createdAt: string;
}

export interface Tag {
	id: string;
	userId: string;
	name: string;
	color: string | null;
	createdAt: string;
}

// Files API
export const filesApi = {
	list: (folderId?: string) =>
		request<StorageFile[]>(`/files${folderId ? `?folderId=${folderId}` : ''}`),

	get: (id: string) => request<StorageFile>(`/files/${id}`),

	upload: async (file: File, folderId?: string): Promise<ApiResponse<StorageFile>> => {
		const formData = new FormData();
		formData.append('file', file);
		if (folderId) {
			formData.append('parentFolderId', folderId);
		}

		const result = await api.upload<StorageFile>('/files/upload', formData);
		return toLegacyResponse(result);
	},

	download: async (id: string): Promise<Blob | null> => {
		const token = await authStore.getAccessToken();
		try {
			const response = await fetch(`${API_URL}/api/v1/files/${id}/download`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			if (!response.ok) return null;
			return await response.blob();
		} catch {
			return null;
		}
	},

	rename: (id: string, name: string) =>
		request<StorageFile>(`/files/${id}`, {
			method: 'PATCH',
			body: JSON.stringify({ name }),
		}),

	move: (id: string, parentFolderId: string | null) =>
		request<StorageFile>(`/files/${id}/move`, {
			method: 'PATCH',
			body: JSON.stringify({ parentFolderId }),
		}),

	delete: (id: string) => request<{ success: boolean }>(`/files/${id}`, { method: 'DELETE' }),

	toggleFavorite: (id: string) => request<StorageFile>(`/files/${id}/favorite`, { method: 'POST' }),
};

// Folders API
export const foldersApi = {
	list: (parentId?: string) =>
		request<StorageFolder[]>(`/folders${parentId ? `?parentId=${parentId}` : ''}`),

	get: (id: string) =>
		request<{ folder: StorageFolder; files: StorageFile[]; subfolders: StorageFolder[] }>(
			`/folders/${id}`
		),

	create: (name: string, parentFolderId?: string, color?: string) =>
		request<StorageFolder>('/folders', {
			method: 'POST',
			body: JSON.stringify({ name, parentFolderId, color }),
		}),

	rename: (id: string, name: string) =>
		request<StorageFolder>(`/folders/${id}`, {
			method: 'PATCH',
			body: JSON.stringify({ name }),
		}),

	move: (id: string, parentFolderId: string | null) =>
		request<StorageFolder>(`/folders/${id}/move`, {
			method: 'PATCH',
			body: JSON.stringify({ parentFolderId }),
		}),

	delete: (id: string) => request<{ success: boolean }>(`/folders/${id}`, { method: 'DELETE' }),

	toggleFavorite: (id: string) =>
		request<StorageFolder>(`/folders/${id}/favorite`, { method: 'POST' }),
};

// Shares API
export const sharesApi = {
	list: () => request<Share[]>('/shares'),

	get: (token: string) =>
		request<{ share: Share; file?: StorageFile; folder?: StorageFolder }>(`/shares/${token}`),

	create: (data: {
		fileId?: string;
		folderId?: string;
		accessLevel?: 'view' | 'edit' | 'download';
		password?: string;
		maxDownloads?: number;
		expiresAt?: string;
	}) =>
		request<Share>('/shares', {
			method: 'POST',
			body: JSON.stringify(data),
		}),

	delete: (id: string) => request<{ success: boolean }>(`/shares/${id}`, { method: 'DELETE' }),
};

// Tags API
export const tagsApi = {
	list: () => request<Tag[]>('/tags'),

	create: (name: string, color?: string) =>
		request<Tag>('/tags', {
			method: 'POST',
			body: JSON.stringify({ name, color }),
		}),

	update: (id: string, data: { name?: string; color?: string }) =>
		request<Tag>(`/tags/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
		}),

	delete: (id: string) => request<{ success: boolean }>(`/tags/${id}`, { method: 'DELETE' }),
};

// Trash API
export const trashApi = {
	list: () => request<{ files: StorageFile[]; folders: StorageFolder[] }>('/trash'),

	restore: (id: string, type: 'file' | 'folder') =>
		request<StorageFile | StorageFolder>(`/trash/${id}/restore?type=${type}`, {
			method: 'POST',
		}),

	permanentDelete: (id: string, type: 'file' | 'folder') =>
		request<{ success: boolean }>(`/trash/${id}?type=${type}`, { method: 'DELETE' }),

	empty: () => request<{ success: boolean }>('/trash', { method: 'DELETE' }),
};

// Search API
export const searchApi = {
	search: (query: string) =>
		request<{ files: StorageFile[]; folders: StorageFolder[] }>(
			`/search?q=${encodeURIComponent(query)}`
		),

	favorites: () => request<{ files: StorageFile[]; folders: StorageFolder[] }>('/favorites'),
};
