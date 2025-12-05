import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { figures, figureLikes } from '../db/schema';
import { CreateFigureDto } from './dto/create-figure.dto';
import { UpdateFigureDto } from './dto/update-figure.dto';

@Injectable()
export class FigureService {
	constructor(
		@Inject(DATABASE_CONNECTION)
		private db: Database
	) {}

	async create(dto: CreateFigureDto, userId: string) {
		const [figure] = await this.db
			.insert(figures)
			.values({
				name: dto.name,
				subject: dto.subject,
				imageUrl: dto.imageUrl,
				enhancedPrompt: dto.enhancedPrompt,
				rarity: dto.rarity || 'common',
				characterInfo: dto.characterInfo,
				isPublic: dto.isPublic ?? true,
				isArchived: false,
				likes: 0,
				userId,
			})
			.returning();

		return figure;
	}

	async findById(id: string) {
		const [figure] = await this.db.select().from(figures).where(eq(figures.id, id));

		if (!figure) {
			throw new NotFoundException('Figure not found');
		}

		return figure;
	}

	async findPublicFigures(page = 1, limit = 20) {
		const offset = (page - 1) * limit;

		const result = await this.db
			.select()
			.from(figures)
			.where(and(eq(figures.isPublic, true), eq(figures.isArchived, false)))
			.orderBy(desc(figures.createdAt))
			.limit(limit)
			.offset(offset);

		return result;
	}

	async findUserFigures(userId: string, includeArchived = false) {
		const conditions = [eq(figures.userId, userId)];

		if (!includeArchived) {
			conditions.push(eq(figures.isArchived, false));
		}

		const result = await this.db
			.select()
			.from(figures)
			.where(and(...conditions))
			.orderBy(desc(figures.createdAt));

		return result;
	}

	async update(id: string, dto: UpdateFigureDto, userId: string) {
		// First check if figure exists and belongs to user
		const [existing] = await this.db.select().from(figures).where(eq(figures.id, id));

		if (!existing) {
			throw new NotFoundException('Figure not found');
		}

		if (existing.userId !== userId) {
			throw new ForbiddenException('You do not have permission to update this figure');
		}

		const [updated] = await this.db
			.update(figures)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(eq(figures.id, id))
			.returning();

		return updated;
	}

	async delete(id: string, userId: string) {
		// First check if figure exists and belongs to user
		const [existing] = await this.db.select().from(figures).where(eq(figures.id, id));

		if (!existing) {
			throw new NotFoundException('Figure not found');
		}

		if (existing.userId !== userId) {
			throw new ForbiddenException('You do not have permission to delete this figure');
		}

		await this.db.delete(figures).where(eq(figures.id, id));

		return { success: true };
	}

	async toggleLike(figureId: string, userId: string) {
		// Check if figure exists
		const [figure] = await this.db.select().from(figures).where(eq(figures.id, figureId));

		if (!figure) {
			throw new NotFoundException('Figure not found');
		}

		// Check if user already liked this figure
		const [existingLike] = await this.db
			.select()
			.from(figureLikes)
			.where(and(eq(figureLikes.figureId, figureId), eq(figureLikes.userId, userId)));

		if (existingLike) {
			// Unlike: remove like and decrement count
			await this.db
				.delete(figureLikes)
				.where(and(eq(figureLikes.figureId, figureId), eq(figureLikes.userId, userId)));

			await this.db
				.update(figures)
				.set({
					likes: sql`GREATEST(${figures.likes} - 1, 0)`,
				})
				.where(eq(figures.id, figureId));

			return { liked: false, likes: Math.max((figure.likes || 0) - 1, 0) };
		} else {
			// Like: add like and increment count
			await this.db.insert(figureLikes).values({
				figureId,
				userId,
			});

			await this.db
				.update(figures)
				.set({
					likes: sql`${figures.likes} + 1`,
				})
				.where(eq(figures.id, figureId));

			return { liked: true, likes: (figure.likes || 0) + 1 };
		}
	}

	async checkUserLiked(figureId: string, userId: string): Promise<boolean> {
		const [like] = await this.db
			.select()
			.from(figureLikes)
			.where(and(eq(figureLikes.figureId, figureId), eq(figureLikes.userId, userId)));

		return !!like;
	}

	async getPublicFiguresWithLikeStatus(userId: string | null, page = 1, limit = 20) {
		const publicFigures = await this.findPublicFigures(page, limit);

		if (!userId) {
			return publicFigures.map((f) => ({ ...f, hasLiked: false }));
		}

		// Get all likes for this user for these figures
		const figureIds = publicFigures.map((f) => f.id);
		const userLikes = await this.db
			.select()
			.from(figureLikes)
			.where(and(eq(figureLikes.userId, userId), sql`${figureLikes.figureId} = ANY(${figureIds})`));

		const likedIds = new Set(userLikes.map((l) => l.figureId));

		return publicFigures.map((f) => ({
			...f,
			hasLiked: likedIds.has(f.id),
		}));
	}
}
