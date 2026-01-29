import { apiClient } from './client';
import type {
	Question,
	CreateQuestionDto,
	UpdateQuestionDto,
	PaginatedResponse,
} from '$lib/types';

export interface QuestionFilters {
	collectionId?: string;
	status?: string;
	search?: string;
	tags?: string[];
	limit?: number;
	offset?: number;
}

export const questionsApi = {
	async getAll(filters?: QuestionFilters): Promise<PaginatedResponse<Question>> {
		const params = new URLSearchParams();
		if (filters?.collectionId) params.set('collectionId', filters.collectionId);
		if (filters?.status) params.set('status', filters.status);
		if (filters?.search) params.set('search', filters.search);
		if (filters?.tags?.length) params.set('tags', filters.tags.join(','));
		if (filters?.limit) params.set('limit', filters.limit.toString());
		if (filters?.offset) params.set('offset', filters.offset.toString());

		const query = params.toString();
		return apiClient.get<PaginatedResponse<Question>>(
			`/api/v1/questions${query ? `?${query}` : ''}`,
		);
	},

	async getById(id: string): Promise<Question> {
		return apiClient.get<Question>(`/api/v1/questions/${id}`);
	},

	async create(data: CreateQuestionDto): Promise<Question> {
		return apiClient.post<Question>('/api/v1/questions', data);
	},

	async update(id: string, data: UpdateQuestionDto): Promise<Question> {
		return apiClient.put<Question>(`/api/v1/questions/${id}`, data);
	},

	async delete(id: string): Promise<void> {
		await apiClient.delete(`/api/v1/questions/${id}`);
	},

	async updateStatus(id: string, status: string): Promise<Question> {
		return apiClient.put<Question>(`/api/v1/questions/${id}/status`, { status });
	},
};
