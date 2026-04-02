import { apiClient } from './client';
import type { Activity } from '$lib/types';

interface ActivitiesResponse {
	activities: Activity[];
}

export async function getActivities(skillId?: string, limit?: number): Promise<Activity[]> {
	const params = new URLSearchParams();
	if (skillId) params.append('skillId', skillId);
	if (limit) params.append('limit', String(limit));
	const queryString = params.toString() ? `?${params.toString()}` : '';
	const response = await apiClient.get<ActivitiesResponse>(`/api/v1/activities${queryString}`);
	return response.activities;
}

export async function getRecentActivities(limit = 10): Promise<Activity[]> {
	return getActivities(undefined, limit);
}

export async function getSkillActivities(skillId: string): Promise<Activity[]> {
	return getActivities(skillId);
}
