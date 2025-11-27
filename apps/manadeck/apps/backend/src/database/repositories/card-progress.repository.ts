import { Injectable, Inject, Logger } from '@nestjs/common';
import { DATABASE_TOKEN, type Database } from '../database.module';
import {
	cardProgress,
	cards,
	type CardProgress,
	type NewCardProgress,
	eq,
	and,
	lte,
	sql,
} from '@manacore/manadeck-database';

@Injectable()
export class CardProgressRepository {
	private readonly logger = new Logger(CardProgressRepository.name);

	constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

	async findByUserId(userId: string): Promise<CardProgress[]> {
		this.logger.debug(`Finding card progress for user: ${userId}`);
		return this.db.select().from(cardProgress).where(eq(cardProgress.userId, userId));
	}

	async findByDeckId(deckId: string, userId: string): Promise<CardProgress[]> {
		// Join with cards to filter by deck
		const result = await this.db
			.select({ progress: cardProgress })
			.from(cardProgress)
			.innerJoin(cards, eq(cardProgress.cardId, cards.id))
			.where(and(eq(cards.deckId, deckId), eq(cardProgress.userId, userId)));
		return result.map((r) => r.progress);
	}

	async findByCardId(cardId: string, userId: string): Promise<CardProgress | null> {
		const result = await this.db
			.select()
			.from(cardProgress)
			.where(and(eq(cardProgress.cardId, cardId), eq(cardProgress.userId, userId)))
			.limit(1);
		return result[0] || null;
	}

	async findDueCards(userId: string, deckId?: string): Promise<CardProgress[]> {
		const now = new Date();

		if (deckId) {
			const result = await this.db
				.select({ progress: cardProgress })
				.from(cardProgress)
				.innerJoin(cards, eq(cardProgress.cardId, cards.id))
				.where(
					and(
						eq(cardProgress.userId, userId),
						eq(cards.deckId, deckId),
						lte(cardProgress.nextReview, now)
					)
				);
			return result.map((r) => r.progress);
		}

		return this.db
			.select()
			.from(cardProgress)
			.where(and(eq(cardProgress.userId, userId), lte(cardProgress.nextReview, now)));
	}

	async create(data: NewCardProgress): Promise<CardProgress> {
		this.logger.debug(`Creating card progress for card: ${data.cardId}`);
		const result = await this.db.insert(cardProgress).values(data).returning();
		return result[0];
	}

	async upsert(data: NewCardProgress): Promise<CardProgress> {
		this.logger.debug(`Upserting card progress for card: ${data.cardId}`);
		const result = await this.db
			.insert(cardProgress)
			.values(data)
			.onConflictDoUpdate({
				target: [cardProgress.userId, cardProgress.cardId],
				set: {
					easeFactor: data.easeFactor,
					interval: data.interval,
					repetitions: data.repetitions,
					lastReviewed: data.lastReviewed,
					nextReview: data.nextReview,
					status: data.status,
					updatedAt: new Date(),
				},
			})
			.returning();
		return result[0];
	}

	async update(
		id: string,
		data: Partial<Omit<NewCardProgress, 'id' | 'userId' | 'cardId' | 'createdAt'>>
	): Promise<CardProgress | null> {
		this.logger.debug(`Updating card progress: ${id}`);
		const result = await this.db
			.update(cardProgress)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(cardProgress.id, id))
			.returning();
		return result[0] || null;
	}

	async getStatsByUserId(userId: string) {
		const result = await this.db
			.select({
				totalCards: sql<number>`count(*)::int`,
				newCards: sql<number>`count(*) filter (where ${cardProgress.status} = 'new')::int`,
				learningCards: sql<number>`count(*) filter (where ${cardProgress.status} = 'learning')::int`,
				reviewCards: sql<number>`count(*) filter (where ${cardProgress.status} = 'review')::int`,
				avgEaseFactor: sql<string>`avg(${cardProgress.easeFactor})`,
			})
			.from(cardProgress)
			.where(eq(cardProgress.userId, userId));
		return result[0];
	}
}
