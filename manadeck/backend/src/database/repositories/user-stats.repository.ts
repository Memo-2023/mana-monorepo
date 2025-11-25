import { Injectable, Inject, Logger } from '@nestjs/common';
import { DATABASE_TOKEN, type Database } from '../database.module';
import {
  userStats,
  type UserStats,
  type NewUserStats,
  eq,
  desc,
  sql,
} from '@manacore/manadeck-database';

@Injectable()
export class UserStatsRepository {
  private readonly logger = new Logger(UserStatsRepository.name);

  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findByUserId(userId: string): Promise<UserStats | null> {
    this.logger.debug(`Finding stats for user: ${userId}`);
    const result = await this.db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1);
    return result[0] || null;
  }

  async findOrCreate(userId: string): Promise<UserStats> {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;

    this.logger.debug(`Creating stats for user: ${userId}`);
    const result = await this.db
      .insert(userStats)
      .values({ userId })
      .returning();
    return result[0];
  }

  async update(
    userId: string,
    data: Partial<Omit<NewUserStats, 'userId' | 'createdAt'>>
  ): Promise<UserStats | null> {
    this.logger.debug(`Updating stats for user: ${userId}`);
    const result = await this.db
      .update(userStats)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userStats.userId, userId))
      .returning();
    return result[0] || null;
  }

  async getLeaderboard(limit = 10): Promise<UserStats[]> {
    return this.db
      .select()
      .from(userStats)
      .orderBy(desc(userStats.totalWins))
      .limit(limit);
  }

  async getLeaderboardByStreak(limit = 10): Promise<UserStats[]> {
    return this.db
      .select()
      .from(userStats)
      .orderBy(desc(userStats.streakDays))
      .limit(limit);
  }

  async getUserPosition(userId: string): Promise<number | null> {
    // Get user's total wins
    const user = await this.findByUserId(userId);
    if (!user) return null;

    // Count users with higher wins
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(userStats)
      .where(sql`${userStats.totalWins} > ${user.totalWins}`);

    return (result[0]?.count || 0) + 1;
  }

  async incrementWins(userId: string, count = 1): Promise<UserStats | null> {
    const result = await this.db
      .update(userStats)
      .set({
        totalWins: sql`${userStats.totalWins} + ${count}`,
        updatedAt: new Date(),
      })
      .where(eq(userStats.userId, userId))
      .returning();
    return result[0] || null;
  }

  async incrementSessions(userId: string): Promise<UserStats | null> {
    const result = await this.db
      .update(userStats)
      .set({
        totalSessions: sql`${userStats.totalSessions} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(userStats.userId, userId))
      .returning();
    return result[0] || null;
  }

  async updateStudyProgress(
    userId: string,
    cardsStudied: number,
    timeSeconds: number,
    accuracy: number
  ): Promise<UserStats | null> {
    const today = new Date().toISOString().split('T')[0];
    const existing = await this.findByUserId(userId);

    if (!existing) {
      await this.findOrCreate(userId);
    }

    // Calculate new average accuracy
    const currentAvg = existing ? parseFloat(existing.averageAccuracy) : 0;
    const currentTotal = existing?.totalCardsStudied || 0;
    const newTotal = currentTotal + cardsStudied;
    const newAvg =
      newTotal > 0
        ? (currentAvg * currentTotal + accuracy * cardsStudied) / newTotal
        : accuracy;

    const result = await this.db
      .update(userStats)
      .set({
        totalCardsStudied: sql`${userStats.totalCardsStudied} + ${cardsStudied}`,
        totalTimeSeconds: sql`${userStats.totalTimeSeconds} + ${timeSeconds}`,
        averageAccuracy: newAvg.toFixed(2),
        lastStudyDate: today,
        updatedAt: new Date(),
      })
      .where(eq(userStats.userId, userId))
      .returning();

    return result[0] || null;
  }
}
