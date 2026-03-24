import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_TOKEN } from '../db/database.module';
import { Database } from '../db/connection';
import { skills, activities, userStats, Skill, NewSkill } from '../db/schema';
import { CreateSkillDto, UpdateSkillDto, AddXpDto } from './dto';
import { AchievementService, AchievementUnlockResult } from '../achievement/achievement.service';

// Level thresholds
const LEVEL_THRESHOLDS = [0, 100, 500, 1500, 4000, 10000];

function calculateLevel(xp: number): number {
	for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
		if (xp >= LEVEL_THRESHOLDS[i]) {
			return i;
		}
	}
	return 0;
}

@Injectable()
export class SkillService {
	constructor(
		@Inject(DATABASE_TOKEN) private db: Database,
		private readonly achievementService: AchievementService
	) {}

	async findAll(userId: string): Promise<Skill[]> {
		return this.db
			.select()
			.from(skills)
			.where(eq(skills.userId, userId))
			.orderBy(desc(skills.totalXp));
	}

	async findByBranch(userId: string, branch: string): Promise<Skill[]> {
		return this.db
			.select()
			.from(skills)
			.where(and(eq(skills.userId, userId), eq(skills.branch, branch as any)))
			.orderBy(desc(skills.totalXp));
	}

	async findById(id: string, userId: string): Promise<Skill | null> {
		const [skill] = await this.db
			.select()
			.from(skills)
			.where(and(eq(skills.id, id), eq(skills.userId, userId)));
		return skill ?? null;
	}

	async findByIdOrThrow(id: string, userId: string): Promise<Skill> {
		const skill = await this.findById(id, userId);
		if (!skill) {
			throw new NotFoundException(`Skill with id ${id} not found`);
		}
		return skill;
	}

	async create(
		userId: string,
		dto: CreateSkillDto
	): Promise<{ skill: Skill; newAchievements: AchievementUnlockResult[] }> {
		const newSkill: NewSkill = {
			userId,
			name: dto.name,
			description: dto.description,
			branch: dto.branch,
			parentId: dto.parentId,
			icon: dto.icon ?? 'star',
			color: dto.color,
			currentXp: 0,
			totalXp: 0,
			level: 0,
		};

		const [skill] = await this.db.insert(skills).values(newSkill).returning();

		// Update user stats
		await this.updateUserStats(userId);

		// Check achievements
		const newAchievements = await this.achievementService.checkAndUnlock(userId);

		return { skill, newAchievements };
	}

	async update(id: string, userId: string, dto: UpdateSkillDto): Promise<Skill> {
		await this.findByIdOrThrow(id, userId);

		const [updated] = await this.db
			.update(skills)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(and(eq(skills.id, id), eq(skills.userId, userId)))
			.returning();

		return updated;
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.findByIdOrThrow(id, userId);

		await this.db.delete(skills).where(and(eq(skills.id, id), eq(skills.userId, userId)));

		// Update user stats
		await this.updateUserStats(userId);
	}

	async addXp(
		id: string,
		userId: string,
		dto: AddXpDto
	): Promise<{
		skill: Skill;
		leveledUp: boolean;
		newLevel: number;
		newAchievements: AchievementUnlockResult[];
	}> {
		const skill = await this.findByIdOrThrow(id, userId);

		const newTotalXp = skill.totalXp + dto.xp;
		const newCurrentXp = skill.currentXp + dto.xp;
		const newLevel = calculateLevel(newTotalXp);
		const leveledUp = newLevel > skill.level;

		// Update skill
		const [updated] = await this.db
			.update(skills)
			.set({
				totalXp: newTotalXp,
				currentXp: newCurrentXp,
				level: newLevel,
				updatedAt: new Date(),
			})
			.where(and(eq(skills.id, id), eq(skills.userId, userId)))
			.returning();

		// Create activity
		await this.db.insert(activities).values({
			userId,
			skillId: id,
			xpEarned: dto.xp,
			description: dto.description,
			duration: dto.duration,
		});

		// Update user stats
		await this.updateUserStats(userId);

		// Check achievements
		const newAchievements = await this.achievementService.checkAndUnlock(userId, {
			activityXp: dto.xp,
		});

		return { skill: updated, leveledUp, newLevel, newAchievements };
	}

	private async updateUserStats(userId: string): Promise<void> {
		// Get aggregated stats
		const userSkills = await this.db.select().from(skills).where(eq(skills.userId, userId));

		const totalXp = userSkills.reduce((sum, s) => sum + s.totalXp, 0);
		const totalSkills = userSkills.length;
		const highestLevel = userSkills.reduce((max, s) => Math.max(max, s.level), 0);

		// Get last activity date
		const [lastActivity] = await this.db
			.select()
			.from(activities)
			.where(eq(activities.userId, userId))
			.orderBy(desc(activities.timestamp))
			.limit(1);

		const lastActivityDate = lastActivity?.timestamp
			? lastActivity.timestamp.toISOString().split('T')[0]
			: null;

		// Calculate streak
		const streakDays = await this.calculateStreak(userId);

		// Upsert user stats
		await this.db
			.insert(userStats)
			.values({
				userId,
				totalXp,
				totalSkills,
				highestLevel,
				streakDays,
				lastActivityDate,
			})
			.onConflictDoUpdate({
				target: userStats.userId,
				set: {
					totalXp,
					totalSkills,
					highestLevel,
					streakDays,
					lastActivityDate,
					updatedAt: new Date(),
				},
			});
	}

	private async calculateStreak(userId: string): Promise<number> {
		const allActivities = await this.db
			.select()
			.from(activities)
			.where(eq(activities.userId, userId))
			.orderBy(desc(activities.timestamp));

		if (allActivities.length === 0) return 0;

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Get unique dates
		const uniqueDates = [
			...new Set(
				allActivities.map((a) => {
					const d = new Date(a.timestamp);
					d.setHours(0, 0, 0, 0);
					return d.getTime();
				})
			),
		].sort((a, b) => b - a); // Newest first

		let streak = 0;
		let expectedDate = today.getTime();

		for (const date of uniqueDates) {
			if (date === expectedDate || date === expectedDate - 86400000) {
				streak++;
				expectedDate = date - 86400000;
			} else if (date < expectedDate - 86400000) {
				break;
			}
		}

		return streak;
	}

	async getUserStats(userId: string) {
		const [stats] = await this.db.select().from(userStats).where(eq(userStats.userId, userId));

		if (!stats) {
			// Return default stats
			return {
				totalXp: 0,
				totalSkills: 0,
				highestLevel: 0,
				streakDays: 0,
				lastActivityDate: null,
			};
		}

		return stats;
	}
}
