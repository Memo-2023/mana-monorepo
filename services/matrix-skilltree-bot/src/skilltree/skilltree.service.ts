import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type SkillBranch = 'intellect' | 'body' | 'creativity' | 'social' | 'practical' | 'mindset' | 'custom';

export interface Skill {
	id: string;
	name: string;
	description?: string;
	branch: SkillBranch;
	parentId?: string;
	icon: string;
	color?: string;
	currentXp: number;
	totalXp: number;
	level: number;
	createdAt: string;
	updatedAt: string;
}

export interface Activity {
	id: string;
	skillId: string;
	xpEarned: number;
	description: string;
	duration?: number;
	timestamp: string;
}

export interface UserStats {
	totalXp: number;
	totalSkills: number;
	highestLevel: number;
	streakDays: number;
	lastActivityDate?: string;
}

export interface AddXpResult {
	skill: Skill;
	leveledUp: boolean;
	newLevel: number;
}

@Injectable()
export class SkilltreeService {
	private readonly logger = new Logger(SkilltreeService.name);
	private backendUrl: string;
	private apiPrefix: string;

	constructor(private configService: ConfigService) {
		this.backendUrl = this.configService.get<string>('skilltree.backendUrl') || 'http://localhost:3024';
		this.apiPrefix = this.configService.get<string>('skilltree.apiPrefix') || '/api/v1';
	}

	private async request<T>(
		token: string,
		endpoint: string,
		options: RequestInit = {}
	): Promise<{ data?: T; error?: string }> {
		try {
			const url = `${this.backendUrl}${this.apiPrefix}${endpoint}`;
			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
					...options.headers,
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return { error: errorData.message || `Fehler: ${response.status}` };
			}

			const data = await response.json();
			return { data };
		} catch (error) {
			this.logger.error(`Request failed: ${endpoint}`, error);
			return { error: 'Verbindung zum Backend fehlgeschlagen' };
		}
	}

	// Skill operations
	async getSkills(token: string, branch?: string): Promise<{ data?: { skills: Skill[] }; error?: string }> {
		const query = branch ? `?branch=${branch}` : '';
		return this.request<{ skills: Skill[] }>(token, `/skills${query}`);
	}

	async getSkill(token: string, skillId: string): Promise<{ data?: { skill: Skill }; error?: string }> {
		return this.request<{ skill: Skill }>(token, `/skills/${skillId}`);
	}

	async createSkill(
		token: string,
		name: string,
		branch: SkillBranch,
		description?: string
	): Promise<{ data?: { skill: Skill }; error?: string }> {
		return this.request<{ skill: Skill }>(token, '/skills', {
			method: 'POST',
			body: JSON.stringify({ name, branch, description }),
		});
	}

	async deleteSkill(token: string, skillId: string): Promise<{ error?: string }> {
		return this.request(token, `/skills/${skillId}`, { method: 'DELETE' });
	}

	async addXp(
		token: string,
		skillId: string,
		xp: number,
		description: string,
		duration?: number
	): Promise<{ data?: AddXpResult; error?: string }> {
		return this.request<AddXpResult>(token, `/skills/${skillId}/xp`, {
			method: 'POST',
			body: JSON.stringify({ xp, description, duration }),
		});
	}

	// Stats
	async getStats(token: string): Promise<{ data?: { stats: UserStats }; error?: string }> {
		return this.request<{ stats: UserStats }>(token, '/skills/stats');
	}

	// Activities
	async getActivities(token: string, limit?: number): Promise<{ data?: { activities: Activity[] }; error?: string }> {
		const query = limit ? `?limit=${limit}` : '';
		return this.request<{ activities: Activity[] }>(token, `/activities${query}`);
	}

	async getRecentActivities(token: string, limit?: number): Promise<{ data?: { activities: Activity[] }; error?: string }> {
		const query = limit ? `?limit=${limit}` : '';
		return this.request<{ activities: Activity[] }>(token, `/activities/recent${query}`);
	}

	async getSkillActivities(token: string, skillId: string): Promise<{ data?: { activities: Activity[] }; error?: string }> {
		return this.request<{ activities: Activity[] }>(token, `/activities/skill/${skillId}`);
	}

	async checkHealth(): Promise<boolean> {
		try {
			const response = await fetch(`${this.backendUrl}/health`);
			return response.ok;
		} catch {
			return false;
		}
	}
}
