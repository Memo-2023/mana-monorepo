import { apiClient } from './client';
import type { Source } from '$lib/types';

export const sourcesApi = {
	async getByResearchResult(researchResultId: string): Promise<Source[]> {
		return apiClient.get<Source[]>(`/api/v1/sources/research/${researchResultId}`);
	},

	async getByQuestion(questionId: string): Promise<Source[]> {
		return apiClient.get<Source[]>(`/api/v1/sources/question/${questionId}`);
	},

	async getById(id: string): Promise<Source> {
		return apiClient.get<Source>(`/api/v1/sources/${id}`);
	},

	async getContent(id: string): Promise<{ text: string; markdown?: string }> {
		return apiClient.get(`/api/v1/sources/${id}/content`);
	},
};
