import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { decks, slides } from '../db/schema';
import { type CreateDeckDto, type UpdateDeckDto } from './deck.dto';

@Injectable()
export class DeckService {
	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly db: Database
	) {}

	async findByUser(userId: string) {
		return this.db.query.decks.findMany({
			where: eq(decks.userId, userId),
			orderBy: [desc(decks.updatedAt)],
			with: {
				theme: true,
			},
		});
	}

	async findOneWithSlides(id: string, userId: string) {
		const deck = await this.db.query.decks.findFirst({
			where: and(eq(decks.id, id), eq(decks.userId, userId)),
			with: {
				slides: {
					orderBy: [slides.order],
				},
				theme: true,
			},
		});

		if (!deck) {
			throw new NotFoundException('Deck not found');
		}

		return deck;
	}

	async findOne(id: string) {
		return this.db.query.decks.findFirst({
			where: eq(decks.id, id),
			with: {
				slides: {
					orderBy: [slides.order],
				},
				theme: true,
			},
		});
	}

	async create(userId: string, dto: CreateDeckDto) {
		const [deck] = await this.db
			.insert(decks)
			.values({
				userId,
				title: dto.title,
				description: dto.description,
				themeId: dto.themeId,
			})
			.returning();

		return deck;
	}

	async update(id: string, userId: string, dto: UpdateDeckDto) {
		// Verify ownership
		const existing = await this.db.query.decks.findFirst({
			where: and(eq(decks.id, id), eq(decks.userId, userId)),
		});

		if (!existing) {
			throw new NotFoundException('Deck not found');
		}

		const [updated] = await this.db
			.update(decks)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(eq(decks.id, id))
			.returning();

		return updated;
	}

	async remove(id: string, userId: string) {
		// Verify ownership
		const existing = await this.db.query.decks.findFirst({
			where: and(eq(decks.id, id), eq(decks.userId, userId)),
		});

		if (!existing) {
			throw new NotFoundException('Deck not found');
		}

		await this.db.delete(decks).where(eq(decks.id, id));

		return { success: true };
	}

	async verifyOwnership(id: string, userId: string): Promise<boolean> {
		const deck = await this.db.query.decks.findFirst({
			where: and(eq(decks.id, id), eq(decks.userId, userId)),
		});
		return !!deck;
	}
}
