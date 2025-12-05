import { fetchApi } from './client';

export interface Label {
	id: string;
	userId: string;
	accountId: string | null;
	name: string;
	color: string;
	createdAt: string;
}

export interface CreateLabelDto {
	name: string;
	color: string;
	accountId?: string;
}

export interface UpdateLabelDto {
	name?: string;
	color?: string;
}

export const labelsApi = {
	async list(accountId?: string) {
		const query = accountId ? `?accountId=${accountId}` : '';
		return fetchApi<{ labels: Label[] }>(`/labels${query}`);
	},

	async get(id: string) {
		return fetchApi<{ label: Label }>(`/labels/${id}`);
	},

	async create(data: CreateLabelDto) {
		return fetchApi<{ label: Label }>('/labels', {
			method: 'POST',
			body: data,
		});
	},

	async update(id: string, data: UpdateLabelDto) {
		return fetchApi<{ label: Label }>(`/labels/${id}`, {
			method: 'PATCH',
			body: data,
		});
	},

	async delete(id: string) {
		return fetchApi<{ success: boolean }>(`/labels/${id}`, {
			method: 'DELETE',
		});
	},

	// Email-Label associations
	async getEmailLabels(emailId: string) {
		return fetchApi<{ labels: Label[] }>(`/labels/email/${emailId}`);
	},

	async addToEmail(emailId: string, labelIds: string[]) {
		return fetchApi<{ success: boolean }>(`/labels/email/${emailId}/add`, {
			method: 'POST',
			body: { labelIds },
		});
	},

	async removeFromEmail(emailId: string, labelIds: string[]) {
		return fetchApi<{ success: boolean }>(`/labels/email/${emailId}/remove`, {
			method: 'POST',
			body: { labelIds },
		});
	},

	async setEmailLabels(emailId: string, labelIds: string[]) {
		return fetchApi<{ success: boolean }>(`/labels/email/${emailId}/set`, {
			method: 'POST',
			body: { labelIds },
		});
	},
};
