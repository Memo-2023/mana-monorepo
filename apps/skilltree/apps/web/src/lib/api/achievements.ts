import { apiClient } from './client';
import type { AchievementWithStatus, Achievement } from '$lib/types';

interface AchievementsResponse {
	achievements: AchievementWithStatus[];
}

interface UnlockedResponse {
	achievements: Achievement[];
}

interface AchievementStatsResponse {
	stats: { total: number; unlocked: number };
}

export async function getAchievements(): Promise<AchievementWithStatus[]> {
	const response = await apiClient.get<AchievementsResponse>('/api/v1/achievements');
	return response.achievements;
}

export async function getUnlockedAchievements(): Promise<Achievement[]> {
	const response = await apiClient.get<UnlockedResponse>('/api/v1/achievements/unlocked');
	return response.achievements;
}

export async function getAchievementStats(): Promise<{ total: number; unlocked: number }> {
	const response = await apiClient.get<AchievementStatsResponse>('/api/v1/achievements/stats');
	return response.stats;
}
