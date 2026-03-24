import { apiClient } from './client';
import type { Skill, Activity, UserStats, SkillBranch, AchievementUnlockResult } from '$lib/types';

interface CreateSkillDto {
	name: string;
	description?: string;
	branch: SkillBranch;
	parentId?: string;
	icon?: string;
	color?: string;
}

interface UpdateSkillDto {
	name?: string;
	description?: string;
	branch?: SkillBranch;
	parentId?: string | null;
	icon?: string;
	color?: string | null;
}

interface AddXpDto {
	xp: number;
	description: string;
	duration?: number;
}

interface AddXpResponse {
	skill: Skill;
	activity: Activity;
	leveledUp: boolean;
	previousLevel: number;
	newLevel: number;
	newAchievements: AchievementUnlockResult[];
}

interface CreateSkillResponse {
	skill: Skill;
	newAchievements: AchievementUnlockResult[];
}

interface SkillsResponse {
	skills: Skill[];
}

interface SkillResponse {
	skill: Skill;
}

interface StatsResponse {
	stats: UserStats;
}

export async function getSkills(branch?: SkillBranch): Promise<Skill[]> {
	const queryString = branch ? `?branch=${branch}` : '';
	const response = await apiClient.get<SkillsResponse>(`/api/v1/skills${queryString}`);
	return response.skills;
}

export async function getSkill(id: string): Promise<Skill> {
	const response = await apiClient.get<SkillResponse>(`/api/v1/skills/${id}`);
	return response.skill;
}

export async function createSkill(data: CreateSkillDto): Promise<CreateSkillResponse> {
	return await apiClient.post<CreateSkillResponse>('/api/v1/skills', data);
}

export async function updateSkill(id: string, data: UpdateSkillDto): Promise<Skill> {
	const response = await apiClient.put<SkillResponse>(`/api/v1/skills/${id}`, data);
	return response.skill;
}

export async function deleteSkill(id: string): Promise<void> {
	await apiClient.delete(`/api/v1/skills/${id}`);
}

export async function addXp(skillId: string, data: AddXpDto): Promise<AddXpResponse> {
	return await apiClient.post<AddXpResponse>(`/api/v1/skills/${skillId}/xp`, data);
}

export async function getStats(): Promise<UserStats> {
	const response = await apiClient.get<StatsResponse>('/api/v1/skills/stats');
	return response.stats;
}
