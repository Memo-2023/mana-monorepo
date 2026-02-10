import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/connection';
import { figures } from '../db/schema';
import type { Figure } from '../db/schema';
import { RARITY_WEIGHTS, type FigureRarity } from '@figgos/shared';

@Injectable()
export class FiguresService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	rollRarity(): FigureRarity {
		const total = Object.values(RARITY_WEIGHTS).reduce((sum, w) => sum + w, 0);
		let roll = Math.random() * total;
		for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
			roll -= weight;
			if (roll <= 0) return rarity as FigureRarity;
		}
		return 'common';
	}

	async create(userId: string, name: string, description: string): Promise<Figure> {
		const rarity = this.rollRarity();

		const [figure] = await this.db
			.insert(figures)
			.values({
				userId,
				name,
				userInput: { description },
				rarity,
			})
			.returning();

		return figure;
	}

	async findByUserId(userId: string): Promise<Figure[]> {
		return this.db
			.select()
			.from(figures)
			.where(and(eq(figures.userId, userId), eq(figures.isArchived, false)))
			.orderBy(desc(figures.createdAt));
	}

	async findById(id: string, userId: string): Promise<Figure> {
		const [figure] = await this.db
			.select()
			.from(figures)
			.where(and(eq(figures.id, id), eq(figures.userId, userId)));

		if (!figure) {
			throw new NotFoundException('Figure not found');
		}
		return figure;
	}

	async delete(id: string, userId: string): Promise<void> {
		const [figure] = await this.db
			.select()
			.from(figures)
			.where(and(eq(figures.id, id), eq(figures.userId, userId)));

		if (!figure) {
			throw new NotFoundException('Figure not found');
		}

		await this.db.delete(figures).where(eq(figures.id, id));
	}
}
