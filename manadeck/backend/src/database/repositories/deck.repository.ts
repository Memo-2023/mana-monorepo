import { Injectable, Inject, Logger } from '@nestjs/common';
import { DATABASE_TOKEN, type Database } from '../database.module';
import {
  decks,
  type Deck,
  type NewDeck,
  eq,
  and,
  desc,
  sql,
} from '@manacore/manadeck-database';

@Injectable()
export class DeckRepository {
  private readonly logger = new Logger(DeckRepository.name);

  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

  async findByUserId(userId: string): Promise<Deck[]> {
    this.logger.debug(`Finding decks for user: ${userId}`);
    return this.db
      .select()
      .from(decks)
      .where(eq(decks.userId, userId))
      .orderBy(desc(decks.createdAt));
  }

  async findById(id: string): Promise<Deck | null> {
    const result = await this.db
      .select()
      .from(decks)
      .where(eq(decks.id, id))
      .limit(1);
    return result[0] || null;
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Deck | null> {
    const result = await this.db
      .select()
      .from(decks)
      .where(and(eq(decks.id, id), eq(decks.userId, userId)))
      .limit(1);
    return result[0] || null;
  }

  async create(data: NewDeck): Promise<Deck> {
    this.logger.debug(`Creating deck: ${data.title}`);
    const result = await this.db.insert(decks).values(data).returning();
    return result[0];
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Omit<NewDeck, 'id' | 'userId' | 'createdAt'>>
  ): Promise<Deck | null> {
    this.logger.debug(`Updating deck: ${id}`);
    const result = await this.db
      .update(decks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(decks.id, id), eq(decks.userId, userId)))
      .returning();
    return result[0] || null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    this.logger.debug(`Deleting deck: ${id}`);
    const result = await this.db
      .delete(decks)
      .where(and(eq(decks.id, id), eq(decks.userId, userId)))
      .returning({ id: decks.id });
    return result.length > 0;
  }

  async findFeatured(limit = 10): Promise<Deck[]> {
    return this.db
      .select()
      .from(decks)
      .where(and(eq(decks.isFeatured, true), eq(decks.isPublic, true)))
      .orderBy(desc(decks.featuredAt))
      .limit(limit);
  }

  async findPublic(limit = 10): Promise<Deck[]> {
    return this.db
      .select()
      .from(decks)
      .where(eq(decks.isPublic, true))
      .orderBy(desc(decks.createdAt))
      .limit(limit);
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(decks)
      .where(eq(decks.userId, userId));
    return result[0]?.count || 0;
  }
}
