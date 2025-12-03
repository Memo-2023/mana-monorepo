import { fetchApi } from './client';

export interface Folder {
	id: string;
	accountId: string;
	userId: string;
	name: string;
	type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom';
	path: string;
	unreadCount: number;
	totalCount: number;
	isSystem: boolean;
	isHidden: boolean;
	createdAt: string;
}

export interface CreateFolderDto {
	accountId: string;
	name: string;
	type?: string;
}

export interface UpdateFolderDto {
	name?: string;
}

export const foldersApi = {
	async list(accountId?: string) {
		const query = accountId ? `?accountId=${accountId}` : '';
		return fetchApi<{ folders: Folder[] }>(`/folders${query}`);
	},

	async get(id: string) {
		return fetchApi<{ folder: Folder }>(`/folders/${id}`);
	},

	async create(data: CreateFolderDto) {
		return fetchApi<{ folder: Folder }>('/folders', {
			method: 'POST',
			body: data,
		});
	},

	async update(id: string, data: UpdateFolderDto) {
		return fetchApi<{ folder: Folder }>(`/folders/${id}`, {
			method: 'PATCH',
			body: data,
		});
	},

	async delete(id: string) {
		return fetchApi<{ success: boolean }>(`/folders/${id}`, {
			method: 'DELETE',
		});
	},

	async toggleHide(id: string) {
		return fetchApi<{ folder: Folder }>(`/folders/${id}/hide`, {
			method: 'POST',
		});
	},

	async sync(accountId: string, folderId: string) {
		return fetchApi<{ emails: number }>(`/sync/accounts/${accountId}/folders/${folderId}`, {
			method: 'POST',
		});
	},
};
