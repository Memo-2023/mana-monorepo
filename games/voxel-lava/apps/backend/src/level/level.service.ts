import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { levels, levelLikes, levelPlays } from '../db/schema';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { RecordPlayDto } from './dto/record-play.dto';

@Injectable()
export class LevelService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: Database,
  ) {}

  async create(dto: CreateLevelDto, userId: string) {
    const [level] = await this.db
      .insert(levels)
      .values({
        name: dto.name,
        description: dto.description,
        userId,
        voxelData: dto.voxelData,
        spawnPoint: dto.spawnPoint,
        worldSize: dto.worldSize,
        isPublic: dto.isPublic ?? false,
        difficulty: dto.difficulty,
        tags: dto.tags,
        thumbnailUrl: dto.thumbnailUrl,
      })
      .returning();

    return level;
  }

  async findById(id: string) {
    const [level] = await this.db
      .select()
      .from(levels)
      .where(eq(levels.id, id));

    if (!level) {
      throw new NotFoundException('Level not found');
    }

    return level;
  }

  async findUserLevels(userId: string) {
    return this.db
      .select()
      .from(levels)
      .where(eq(levels.userId, userId))
      .orderBy(desc(levels.updatedAt));
  }

  async findPublicLevels(page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const items = await this.db
      .select()
      .from(levels)
      .where(eq(levels.isPublic, true))
      .orderBy(desc(levels.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(levels)
      .where(eq(levels.isPublic, true));

    return {
      items,
      total: Number(count),
      page,
      limit,
      totalPages: Math.ceil(Number(count) / limit),
    };
  }

  async update(id: string, dto: UpdateLevelDto, userId: string) {
    const level = await this.findById(id);

    if (level.userId !== userId) {
      throw new ForbiddenException('You can only update your own levels');
    }

    const [updated] = await this.db
      .update(levels)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(levels.id, id))
      .returning();

    return updated;
  }

  async delete(id: string, userId: string) {
    const level = await this.findById(id);

    if (level.userId !== userId) {
      throw new ForbiddenException('You can only delete your own levels');
    }

    await this.db.delete(levels).where(eq(levels.id, id));

    return { success: true };
  }

  async toggleLike(levelId: string, userId: string) {
    // Check if already liked
    const [existingLike] = await this.db
      .select()
      .from(levelLikes)
      .where(and(eq(levelLikes.levelId, levelId), eq(levelLikes.userId, userId)));

    if (existingLike) {
      // Unlike
      await this.db
        .delete(levelLikes)
        .where(eq(levelLikes.id, existingLike.id));

      // Decrement likes count
      await this.db
        .update(levels)
        .set({ likesCount: sql`${levels.likesCount} - 1` })
        .where(eq(levels.id, levelId));

      return { liked: false };
    } else {
      // Like
      await this.db.insert(levelLikes).values({
        levelId,
        userId,
      });

      // Increment likes count
      await this.db
        .update(levels)
        .set({ likesCount: sql`${levels.likesCount} + 1` })
        .where(eq(levels.id, levelId));

      return { liked: true };
    }
  }

  async hasLiked(levelId: string, userId: string) {
    const [like] = await this.db
      .select()
      .from(levelLikes)
      .where(and(eq(levelLikes.levelId, levelId), eq(levelLikes.userId, userId)));

    return { liked: !!like };
  }

  async recordPlay(levelId: string, dto: RecordPlayDto, userId?: string) {
    const [play] = await this.db
      .insert(levelPlays)
      .values({
        levelId,
        userId: userId || null,
        completed: dto.completed ?? false,
        completionTime: dto.completionTime,
      })
      .returning();

    // Increment play count
    await this.db
      .update(levels)
      .set({ playCount: sql`${levels.playCount} + 1` })
      .where(eq(levels.id, levelId));

    return play;
  }

  async getLeaderboard(levelId: string, limit = 10) {
    return this.db
      .select({
        id: levelPlays.id,
        userId: levelPlays.userId,
        completionTime: levelPlays.completionTime,
        createdAt: levelPlays.createdAt,
      })
      .from(levelPlays)
      .where(
        and(
          eq(levelPlays.levelId, levelId),
          eq(levelPlays.completed, true),
        ),
      )
      .orderBy(levelPlays.completionTime)
      .limit(limit);
  }
}
