import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface StorageFile {
	id: string;
	name: string;
	originalName: string;
	mimeType: string;
	size: number;
	parentFolderId?: string;
	isFavorite: boolean;
	isDeleted: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Folder {
	id: string;
	name: string;
	color?: string;
	description?: string;
	parentFolderId?: string;
	path: string;
	depth: number;
	isFavorite: boolean;
	isDeleted: boolean;
	createdAt: string;
}

export interface ShareLink {
	id: string;
	fileId?: string;
	folderId?: string;
	shareType: 'file' | 'folder';
	shareToken: string;
	accessLevel: 'view' | 'edit' | 'download';
	password?: string;
	maxDownloads?: number;
	downloadCount: number;
	expiresAt?: string;
	isActive: boolean;
	createdAt: string;
}

export interface TrashItem {
	id: string;
	name: string;
	type: 'file' | 'folder';
	deletedAt: string;
}

@Injectable()
export class StorageService {
	private readonly logger = new Logger(StorageService.name);
	private backendUrl: string;
	private apiPrefix: string;

	constructor(private configService: ConfigService) {
		this.backendUrl = this.configService.get<string>('storage.backendUrl') || 'http://localhost:3016';
		this.apiPrefix = this.configService.get<string>('storage.apiPrefix') || '/api/v1';
	}

	private async request<T>(
		token: string,
		endpoint: string,
		options: RequestInit = {}
	): Promise<{ data?: T; error?: string }> {
		try {
			const url = `${this.backendUrl}${this.apiPrefix}${endpoint}`;
			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					...options.headers,
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return { error: errorData.message || `Fehler: ${response.status}` };
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			this.logger.error(`Request failed: ${endpoint}`, error);
			return { error: 'Verbindung zum Backend fehlgeschlagen' };
		}
	}

	// File operations
	async getFiles(token: string, parentFolderId?: string): Promise<{ data?: StorageFile[]; error?: string }> {
		const query = parentFolderId ? `?parentFolderId=${parentFolderId}` : '';
		return this.request<StorageFile[]>(token, `/files${query}`);
	}

	async getFile(token: string, fileId: string): Promise<{ data?: StorageFile; error?: string }> {
		return this.request<StorageFile>(token, `/files/${fileId}`);
	}

	async getDownloadUrl(token: string, fileId: string): Promise<{ data?: { url: string }; error?: string }> {
		return this.request<{ url: string }>(token, `/files/${fileId}/download?url=true`);
	}

	async deleteFile(token: string, fileId: string): Promise<{ error?: string }> {
		return this.request(token, `/files/${fileId}`, { method: 'DELETE' });
	}

	async renameFile(token: string, fileId: string, name: string): Promise<{ data?: StorageFile; error?: string }> {
		return this.request<StorageFile>(token, `/files/${fileId}`, {
			method: 'PATCH',
			body: JSON.stringify({ name }),
		});
	}

	async moveFile(token: string, fileId: string, parentFolderId: string | null): Promise<{ data?: StorageFile; error?: string }> {
		return this.request<StorageFile>(token, `/files/${fileId}/move`, {
			method: 'PATCH',
			body: JSON.stringify({ parentFolderId }),
		});
	}

	async toggleFileFavorite(token: string, fileId: string): Promise<{ data?: StorageFile; error?: string }> {
		return this.request<StorageFile>(token, `/files/${fileId}/favorite`, { method: 'POST' });
	}

	// Folder operations
	async getFolders(token: string, parentFolderId?: string): Promise<{ data?: Folder[]; error?: string }> {
		const query = parentFolderId ? `?parentFolderId=${parentFolderId}` : '';
		return this.request<Folder[]>(token, `/folders${query}`);
	}

	async getFolder(token: string, folderId: string): Promise<{ data?: Folder; error?: string }> {
		return this.request<Folder>(token, `/folders/${folderId}`);
	}

	async createFolder(
		token: string,
		name: string,
		parentFolderId?: string
	): Promise<{ data?: Folder; error?: string }> {
		return this.request<Folder>(token, '/folders', {
			method: 'POST',
			body: JSON.stringify({ name, parentFolderId }),
		});
	}

	async deleteFolder(token: string, folderId: string): Promise<{ error?: string }> {
		return this.request(token, `/folders/${folderId}`, { method: 'DELETE' });
	}

	async toggleFolderFavorite(token: string, folderId: string): Promise<{ data?: Folder; error?: string }> {
		return this.request<Folder>(token, `/folders/${folderId}/favorite`, { method: 'POST' });
	}

	// Share operations
	async getShares(token: string): Promise<{ data?: ShareLink[]; error?: string }> {
		return this.request<ShareLink[]>(token, '/shares');
	}

	async createShare(
		token: string,
		fileId: string,
		options: { expiresInDays?: number; password?: string; maxDownloads?: number } = {}
	): Promise<{ data?: ShareLink; error?: string }> {
		return this.request<ShareLink>(token, '/shares', {
			method: 'POST',
			body: JSON.stringify({ fileId, accessLevel: 'download', ...options }),
		});
	}

	async deleteShare(token: string, shareId: string): Promise<{ error?: string }> {
		return this.request(token, `/shares/${shareId}`, { method: 'DELETE' });
	}

	// Search
	async search(token: string, query: string): Promise<{ data?: { files: StorageFile[]; folders: Folder[] }; error?: string }> {
		return this.request<{ files: StorageFile[]; folders: Folder[] }>(token, `/search?q=${encodeURIComponent(query)}`);
	}

	// Favorites
	async getFavorites(token: string): Promise<{ data?: { files: StorageFile[]; folders: Folder[] }; error?: string }> {
		return this.request<{ files: StorageFile[]; folders: Folder[] }>(token, '/favorites');
	}

	// Trash
	async getTrash(token: string): Promise<{ data?: TrashItem[]; error?: string }> {
		return this.request<TrashItem[]>(token, '/trash');
	}

	async restoreFromTrash(token: string, id: string, type: 'file' | 'folder'): Promise<{ error?: string }> {
		return this.request(token, `/trash/${id}/restore?type=${type}`, { method: 'POST' });
	}

	async emptyTrash(token: string): Promise<{ error?: string }> {
		return this.request(token, '/trash', { method: 'DELETE' });
	}

	async checkHealth(): Promise<boolean> {
		try {
			const response = await fetch(`${this.backendUrl}${this.apiPrefix}/health`);
			return response.ok;
		} catch {
			return false;
		}
	}
}
