import { apiClient } from './client';
import type { Project } from '@todo/shared';

interface CreateProjectDto {
	name: string;
	description?: string;
	color?: string;
	icon?: string;
}

interface UpdateProjectDto {
	name?: string;
	description?: string;
	color?: string;
	icon?: string;
	isArchived?: boolean;
}

interface ReorderProjectsDto {
	projectIds: string[];
}

interface ProjectsResponse {
	projects: Project[];
}

interface ProjectResponse {
	project: Project;
}

export async function getProjects(): Promise<Project[]> {
	const response = await apiClient.get<ProjectsResponse>('/api/v1/projects');
	return response.projects;
}

export async function getProject(id: string): Promise<Project> {
	const response = await apiClient.get<ProjectResponse>(`/api/v1/projects/${id}`);
	return response.project;
}

export async function createProject(data: CreateProjectDto): Promise<Project> {
	const response = await apiClient.post<ProjectResponse>('/api/v1/projects', data);
	return response.project;
}

export async function updateProject(id: string, data: UpdateProjectDto): Promise<Project> {
	const response = await apiClient.put<ProjectResponse>(`/api/v1/projects/${id}`, data);
	return response.project;
}

export async function deleteProject(id: string): Promise<void> {
	await apiClient.delete(`/api/v1/projects/${id}`);
}

export async function archiveProject(id: string): Promise<Project> {
	const response = await apiClient.post<ProjectResponse>(`/api/v1/projects/${id}/archive`);
	return response.project;
}

export async function reorderProjects(projectIds: string[]): Promise<void> {
	await apiClient.put('/api/v1/projects/reorder', { projectIds } as ReorderProjectsDto);
}
