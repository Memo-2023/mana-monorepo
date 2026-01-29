import { apiClient } from './client';
import type { Answer } from '$lib/types';

export interface RateAnswerDto {
	rating: number;
	feedback?: string;
}

export const answersApi = {
	async getByQuestion(questionId: string): Promise<Answer[]> {
		return apiClient.get<Answer[]>(`/api/v1/answers/question/${questionId}`);
	},

	async getAccepted(questionId: string): Promise<Answer | null> {
		return apiClient.get<Answer | null>(`/api/v1/answers/question/${questionId}/accepted`);
	},

	async getById(id: string): Promise<Answer> {
		return apiClient.get<Answer>(`/api/v1/answers/${id}`);
	},

	async rate(id: string, data: RateAnswerDto): Promise<Answer> {
		return apiClient.post<Answer>(`/api/v1/answers/${id}/rate`, data);
	},

	async accept(id: string, isAccepted: boolean): Promise<Answer> {
		return apiClient.post<Answer>(`/api/v1/answers/${id}/accept`, { isAccepted });
	},

	async delete(id: string): Promise<void> {
		await apiClient.delete(`/api/v1/answers/${id}`);
	},
};
