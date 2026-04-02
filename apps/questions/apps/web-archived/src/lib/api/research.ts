import { apiClient } from './client';
import type { ResearchResult, StartResearchDto } from '$lib/types';

export const researchApi = {
	async start(data: StartResearchDto): Promise<ResearchResult> {
		return apiClient.post<ResearchResult>('/api/v1/research/start', data);
	},

	async getByQuestion(questionId: string): Promise<ResearchResult[]> {
		return apiClient.get<ResearchResult[]>(`/api/v1/research/question/${questionId}`);
	},

	async getById(id: string): Promise<ResearchResult> {
		return apiClient.get<ResearchResult>(`/api/v1/research/${id}`);
	},

	async checkHealth(): Promise<{ service: string; status: string }> {
		return apiClient.get('/api/v1/research/health/search');
	},
};
