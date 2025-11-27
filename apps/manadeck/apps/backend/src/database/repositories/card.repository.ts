import { Injectable, Inject, Logger } from '@nestjs/common';
import { DATABASE_TOKEN, type Database } from '../database.module';
import {
	cards,
	decks,
	type Card,
	type NewCard,
	eq,
	and,
	asc,
	sql,
} from '@manacore/manadeck-database';

@Injectable()
export class CardRepository {
	private readonly logger = new Logger(CardRepository.name);

	constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

	async findByDeckId(deckId: string): Promise<Card[]> {
		this.logger.debug(`Finding cards for deck: ${deckId}`);
		return this.db
			.select()
			.from(cards)
			.where(eq(cards.deckId, deckId))
			.orderBy(asc(cards.position));
	}

	async findByDeckIdAndUserId(deckId: string, userId: string): Promise<Card[]> {
		// Join with decks to verify ownership
		const result = await this.db
			.select({
				card: cards,
			})
			.from(cards)
			.innerJoin(decks, eq(cards.deckId, decks.id))
			.where(and(eq(cards.deckId, deckId), eq(decks.userId, userId)))
			.orderBy(asc(cards.position));
		return result.map((r) => r.card);
	}

	async findById(id: string): Promise<Card | null> {
		const result = await this.db.select().from(cards).where(eq(cards.id, id)).limit(1);
		return result[0] || null;
	}

	async findByUserDecks(userId: string): Promise<Card[]> {
		// Get all cards from decks owned by the user
		const result = await this.db
			.select({
				card: cards,
			})
			.from(cards)
			.innerJoin(decks, eq(cards.deckId, decks.id))
			.where(eq(decks.userId, userId))
			.orderBy(asc(cards.deckId), asc(cards.position));
		return result.map((r) => r.card);
	}

	async create(data: NewCard): Promise<Card> {
		this.logger.debug(`Creating card in deck: ${data.deckId}`);
		const result = await this.db.insert(cards).values(data).returning();
		return result[0];
	}

	async createMany(data: NewCard[]): Promise<Card[]> {
		if (data.length === 0) return [];
		this.logger.debug(`Creating ${data.length} cards`);
		return this.db.insert(cards).values(data).returning();
	}

	async update(
		id: string,
		data: Partial<Omit<NewCard, 'id' | 'deckId' | 'createdAt'>>
	): Promise<Card | null> {
		this.logger.debug(`Updating card: ${id}`);
		const result = await this.db
			.update(cards)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(cards.id, id))
			.returning();
		return result[0] || null;
	}

	async delete(id: string): Promise<boolean> {
		this.logger.debug(`Deleting card: ${id}`);
		const result = await this.db.delete(cards).where(eq(cards.id, id)).returning({ id: cards.id });
		return result.length > 0;
	}

	async deleteByDeckId(deckId: string): Promise<number> {
		const result = await this.db
			.delete(cards)
			.where(eq(cards.deckId, deckId))
			.returning({ id: cards.id });
		return result.length;
	}

	async countByDeckId(deckId: string): Promise<number> {
		const result = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(cards)
			.where(eq(cards.deckId, deckId));
		return result[0]?.count || 0;
	}

	async countByUserId(userId: string): Promise<number> {
		const result = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(cards)
			.innerJoin(decks, eq(cards.deckId, decks.id))
			.where(eq(decks.userId, userId));
		return result[0]?.count || 0;
	}
}
