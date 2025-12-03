import { apiClient } from './client';
import type { Label } from '@todo/shared';

interface CreateLabelDto {
	name: string;
	color?: string;
}

interface UpdateLabelDto {
	name?: string;
	color?: string;
}

interface LabelsResponse {
	labels: Label[];
}

interface LabelResponse {
	label: Label;
}

export async function getLabels(): Promise<Label[]> {
	const response = await apiClient.get<LabelsResponse>('/api/v1/labels');
	return response.labels;
}

export async function createLabel(data: CreateLabelDto): Promise<Label> {
	const response = await apiClient.post<LabelResponse>('/api/v1/labels', data);
	return response.label;
}

export async function updateLabel(id: string, data: UpdateLabelDto): Promise<Label> {
	const response = await apiClient.put<LabelResponse>(`/api/v1/labels/${id}`, data);
	return response.label;
}

export async function deleteLabel(id: string): Promise<void> {
	await apiClient.delete(`/api/v1/labels/${id}`);
}
