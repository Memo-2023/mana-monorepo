import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/connection';
import { figures } from '../db/schema';
import type { Figure } from '../db/schema';
import {
	RARITY_WEIGHTS,
	getCardStyle,
	type FigureRarity,
	type FigureLanguage,
} from '@figgos/shared';
import { GenerationService } from '../generation/generation.service';

@Injectable()
export class FiguresService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private readonly generationService: GenerationService
	) {}

	rollRarity(): FigureRarity {
		const total = Object.values(RARITY_WEIGHTS).reduce((sum, w) => sum + w, 0);
		let roll = Math.random() * total;
		for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
			roll -= weight;
			if (roll <= 0) return rarity as FigureRarity;
		}
		return 'common';
	}

	async create(
		userId: string,
		name: string,
		description: string,
		language: FigureLanguage = 'en',
		faceImage?: string
	): Promise<Figure> {
		const rarity = this.rollRarity();
		const cardStyle = getCardStyle(rarity);

		// Insert with status pending
		const [figure] = await this.db
			.insert(figures)
			.values({
				userId,
				name,
				rarity,
				language,
				userInput: { description, language },
				status: 'pending',
			})
			.returning();

		// Run full generation pipeline (synchronous)
		const completed = await this.generationService.generateFigure(figure.id, userId, {
			name,
			description,
			language,
			rarity,
			cardStyle,
			faceImage,
		});

		return completed;
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
