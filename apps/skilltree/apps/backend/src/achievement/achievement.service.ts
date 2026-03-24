import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DATABASE_TOKEN } from '../db/database.module';
import { Database } from '../db/connection';
import {
	achievements,
	userAchievements,
	skills,
	activities,
	userStats,
	Achievement,
	UserAchievement,
} from '../db/schema';
import { ACHIEVEMENT_DEFINITIONS } from './achievement-definitions';

export interface AchievementWithStatus extends Achievement {
	unlocked: boolean;
	unlockedAt: Date | null;
	progress: number;
}

export interface AchievementUnlockResult {
	achievement: Achievement;
	xpReward: number;
}

@Injectable()
export class AchievementService implements OnModuleInit {
	private readonly logger = new Logger(AchievementService.name);

	constructor(@Inject(DATABASE_TOKEN) private db: Database) {}

	async onModuleInit() {
		await this.seedAchievements();
	}

	private async seedAchievements(): Promise<void> {
		for (const def of ACHIEVEMENT_DEFINITIONS) {
			await this.db
				.insert(achievements)
				.values(def)
				.onConflictDoUpdate({
					target: achievements.id,
					set: {
						name: def.name,
						description: def.description,
						icon: def.icon,
						category: def.category,
						rarity: def.rarity,
						xpReward: def.xpReward,
						sortOrder: def.sortOrder,
						condition: def.condition,
					},
				});
		}
		this.logger.log(`Seeded ${ACHIEVEMENT_DEFINITIONS.length} achievements`);
	}

	async getAllForUser(userId: string): Promise<AchievementWithStatus[]> {
		const allAchievements = await this.db
			.select()
			.from(achievements)
			.orderBy(achievements.sortOrder);

		const unlocked = await this.db
			.select()
			.from(userAchievements)
			.where(eq(userAchievements.userId, userId));

		const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u]));

		// Calculate current progress for each achievement
		const progressMap = await this.calculateProgress(userId);

		return allAchievements.map((a) => {
			const userAch = unlockedMap.get(a.id);
			return {
				...a,
				unlocked: !!userAch,
				unlockedAt: userAch?.unlockedAt ?? null,
				progress: userAch ? (a.condition as any).threshold : (progressMap.get(a.id) ?? 0),
			};
		});
	}

	async getUnlockedForUser(userId: string): Promise<Achievement[]> {
		const rows = await this.db
			.select({ achievement: achievements })
			.from(userAchievements)
			.innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
			.where(eq(userAchievements.userId, userId));

		return rows.map((r) => r.achievement);
	}

	async getStats(userId: string): Promise<{ total: number; unlocked: number }> {
		const [totalResult] = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(achievements);

		const [unlockedResult] = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(userAchievements)
			.where(eq(userAchievements.userId, userId));

		return {
			total: Number(totalResult.count),
			unlocked: Number(unlockedResult.count),
		};
	}

	/**
	 * Check all achievements for a user and unlock any newly earned ones.
	 * Called after XP gain, skill creation, activity logging, etc.
	 */
	async checkAndUnlock(userId: string, context?: { activityXp?: number }): Promise<AchievementUnlockResult[]> {
		const allAchievements = await this.db.select().from(achievements);
		const unlocked = await this.db
			.select()
			.from(userAchievements)
			.where(eq(userAchievements.userId, userId));
		const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

		// Get user data for condition evaluation
		const userData = await this.getUserData(userId);
		if (context?.activityXp) {
			userData.lastActivityXp = context.activityXp;
		}

		const newlyUnlocked: AchievementUnlockResult[] = [];

		for (const achievement of allAchievements) {
			if (unlockedIds.has(achievement.id)) continue;

			const condition = achievement.condition as { type: string; threshold: number };
			if (this.evaluateCondition(condition, userData)) {
				await this.db.insert(userAchievements).values({
					userId,
					achievementId: achievement.id,
					progress: condition.threshold,
				});
				newlyUnlocked.push({
					achievement,
					xpReward: achievement.xpReward,
				});
			}
		}

		return newlyUnlocked;
	}

	private async getUserData(userId: string): Promise<UserData> {
		const userSkills = await this.db.select().from(skills).where(eq(skills.userId, userId));
		const [activityCount] = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(activities)
			.where(eq(activities.userId, userId));
		const [stats] = await this.db.select().from(userStats).where(eq(userStats.userId, userId));

		const uniqueBranches = new Set(userSkills.map((s) => s.branch).filter((b) => b !== 'custom'));

		// Check min level per branch (for all_branches_min_level)
		const branchMinLevels = new Map<string, number>();
		const mainBranches = ['intellect', 'body', 'creativity', 'social', 'practical', 'mindset'];
		for (const branch of mainBranches) {
			const branchSkills = userSkills.filter((s) => s.branch === branch);
			if (branchSkills.length > 0) {
				branchMinLevels.set(branch, Math.max(...branchSkills.map((s) => s.level)));
			}
		}
		const allBranchesMinLevel =
			branchMinLevels.size === 6 ? Math.min(...branchMinLevels.values()) : 0;

		return {
			totalXp: stats?.totalXp ?? 0,
			totalSkills: userSkills.length,
			highestLevel: stats?.highestLevel ?? 0,
			totalActivities: Number(activityCount.count),
			streakDays: stats?.streakDays ?? 0,
			uniqueBranches: uniqueBranches.size,
			allBranchesMinLevel,
			lastActivityXp: 0,
		};
	}

	private evaluateCondition(
		condition: { type: string; threshold: number },
		data: UserData
	): boolean {
		switch (condition.type) {
			case 'total_xp':
				return data.totalXp >= condition.threshold;
			case 'total_skills':
				return data.totalSkills >= condition.threshold;
			case 'highest_level':
				return data.highestLevel >= condition.threshold;
			case 'total_activities':
				return data.totalActivities >= condition.threshold;
			case 'streak_days':
				return data.streakDays >= condition.threshold;
			case 'unique_branches':
				return data.uniqueBranches >= condition.threshold;
			case 'single_activity_xp':
				return data.lastActivityXp >= condition.threshold;
			case 'all_branches_min_level':
				return data.allBranchesMinLevel >= condition.threshold;
			default:
				return false;
		}
	}

	private async calculateProgress(userId: string): Promise<Map<string, number>> {
		const userData = await this.getUserData(userId);
		const allAchievements = await this.db.select().from(achievements);
		const progressMap = new Map<string, number>();

		for (const achievement of allAchievements) {
			const condition = achievement.condition as { type: string; threshold: number };
			let current = 0;

			switch (condition.type) {
				case 'total_xp':
					current = userData.totalXp;
					break;
				case 'total_skills':
					current = userData.totalSkills;
					break;
				case 'highest_level':
					current = userData.highestLevel;
					break;
				case 'total_activities':
					current = userData.totalActivities;
					break;
				case 'streak_days':
					current = userData.streakDays;
					break;
				case 'unique_branches':
					current = userData.uniqueBranches;
					break;
				case 'single_activity_xp':
					current = 0; // Can't track historical max
					break;
				case 'all_branches_min_level':
					current = userData.allBranchesMinLevel;
					break;
			}

			progressMap.set(achievement.id, Math.min(current, condition.threshold));
		}

		return progressMap;
	}
}

interface UserData {
	totalXp: number;
	totalSkills: number;
	highestLevel: number;
	totalActivities: number;
	streakDays: number;
	uniqueBranches: number;
	allBranchesMinLevel: number;
	lastActivityXp: number;
}
