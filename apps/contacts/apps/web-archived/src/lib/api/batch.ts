import { fetchWithAuth } from './client';

export interface BatchResult {
	success: number;
	failed: number;
	errors: string[];
}

export const batchApi = {
	async deleteMany(contactIds: string[]): Promise<BatchResult> {
		return fetchWithAuth('/batch/delete', {
			method: 'POST',
			body: JSON.stringify({ contactIds }),
		});
	},

	async archiveMany(contactIds: string[], archive = true): Promise<BatchResult> {
		return fetchWithAuth('/batch/archive', {
			method: 'POST',
			body: JSON.stringify({ contactIds, archive }),
		});
	},

	async favoriteMany(contactIds: string[], favorite = true): Promise<BatchResult> {
		return fetchWithAuth('/batch/favorite', {
			method: 'POST',
			body: JSON.stringify({ contactIds, favorite }),
		});
	},

	async addTags(contactIds: string[], tagIds: string[]): Promise<BatchResult> {
		return fetchWithAuth('/batch/add-tags', {
			method: 'POST',
			body: JSON.stringify({ contactIds, tagIds }),
		});
	},
};
