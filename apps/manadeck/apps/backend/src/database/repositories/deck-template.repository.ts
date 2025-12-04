import { Injectable, Inject, Logger } from '@nestjs/common';
import { DATABASE_TOKEN } from '../database.module';
import type { Database } from '../database.module';
import { deckTemplates, eq, and, desc, sql } from '@manacore/manadeck-database';
import type { DeckTemplate, NewDeckTemplate } from '@manacore/manadeck-database';

@Injectable()
export class DeckTemplateRepository {
	private readonly logger = new Logger(DeckTemplateRepository.name);

	constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

	async findAll(includeInactive = false): Promise<DeckTemplate[]> {
		if (includeInactive) {
			return this.db.select().from(deckTemplates).orderBy(desc(deckTemplates.popularity));
		}

		return this.db
			.select()
			.from(deckTemplates)
			.where(eq(deckTemplates.isActive, true))
			.orderBy(desc(deckTemplates.popularity));
	}

	async findById(id: string): Promise<DeckTemplate | null> {
		const result = await this.db
			.select()
			.from(deckTemplates)
			.where(eq(deckTemplates.id, id))
			.limit(1);
		return result[0] || null;
	}

	async findByCategory(category: string): Promise<DeckTemplate[]> {
		return this.db
			.select()
			.from(deckTemplates)
			.where(and(eq(deckTemplates.category, category), eq(deckTemplates.isActive, true)))
			.orderBy(desc(deckTemplates.popularity));
	}

	async findPublic(): Promise<DeckTemplate[]> {
		return this.db
			.select()
			.from(deckTemplates)
			.where(and(eq(deckTemplates.isPublic, true), eq(deckTemplates.isActive, true)))
			.orderBy(desc(deckTemplates.popularity));
	}

	async create(data: NewDeckTemplate): Promise<DeckTemplate> {
		this.logger.debug(`Creating deck template: ${data.title}`);
		const result = await this.db.insert(deckTemplates).values(data).returning();
		return result[0];
	}

	async update(
		id: string,
		data: Partial<Omit<NewDeckTemplate, 'id' | 'createdAt'>>
	): Promise<DeckTemplate | null> {
		this.logger.debug(`Updating deck template: ${id}`);
		const result = await this.db
			.update(deckTemplates)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(deckTemplates.id, id))
			.returning();
		return result[0] || null;
	}

	async delete(id: string): Promise<boolean> {
		this.logger.debug(`Deleting deck template: ${id}`);
		const result = await this.db
			.delete(deckTemplates)
			.where(eq(deckTemplates.id, id))
			.returning({ id: deckTemplates.id });
		return result.length > 0;
	}

	async incrementPopularity(id: string): Promise<DeckTemplate | null> {
		const result = await this.db
			.update(deckTemplates)
			.set({
				popularity: sql`${deckTemplates.popularity} + 1`,
				updatedAt: new Date(),
			})
			.where(eq(deckTemplates.id, id))
			.returning();
		return result[0] || null;
	}

	async getCategories(): Promise<string[]> {
		const result = await this.db
			.selectDistinct({ category: deckTemplates.category })
			.from(deckTemplates)
			.where(eq(deckTemplates.isActive, true));
		return result.map((r) => r.category).filter((c): c is string => c !== null);
	}
}
