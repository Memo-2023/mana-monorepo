import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/connection';
import { figures } from '../db/schema';
import type { Figure } from '../db/schema';
import {
	RARITY_WEIGHTS,
	STAT_RANGES,
	getCardStyle,
	rollFusionRarity,
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

	async fuse(userId: string, figureIdA: string, figureIdB: string): Promise<Figure> {
		// Fetch both figures — must exist and be completed
		const [figA] = await this.db
			.select()
			.from(figures)
			.where(and(eq(figures.id, figureIdA), eq(figures.status, 'completed')));
		if (!figA) throw new NotFoundException(`Figure ${figureIdA} not found or not completed`);

		const [figB] = await this.db
			.select()
			.from(figures)
			.where(and(eq(figures.id, figureIdB), eq(figures.status, 'completed')));
		if (!figB) throw new NotFoundException(`Figure ${figureIdB} not found or not completed`);

		// TODO: verify ownership (figA.userId === userId && figB.userId === userId)

		const rarity = rollFusionRarity(figA.rarity, figB.rarity);

		// Insert fusion figure row
		const [figure] = await this.db
			.insert(figures)
			.values({
				userId,
				name: `${figA.name} + ${figB.name}`, // placeholder, will be overwritten by LLM
				rarity,
				language: figA.language,
				userInput: { description: `Fusion of ${figA.name} and ${figB.name}`, language: figA.language },
				status: 'pending',
				isFusion: true,
				parentFigureIds: [figureIdA, figureIdB],
			})
			.returning();

		const completed = await this.generationService.generateFusion(figure.id, userId, {
			nameA: figA.name,
			profileA: figA.generatedProfile!,
			rarityA: figA.rarity,
			imageUrlA: figA.imageUrl!,
			nameB: figB.name,
			profileB: figB.generatedProfile!,
			rarityB: figB.rarity,
			imageUrlB: figB.imageUrl!,
			rarity,
			cardStyle: 'fusion',
		});

		return completed;
	}
}
