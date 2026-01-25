import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/db';
import { recommendations, type NewRecommendation } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

@Injectable()
export class RecommendationsService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByDate(userId: string, date: Date) {
		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);

		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		return this.db
			.select()
			.from(recommendations)
			.where(and(eq(recommendations.userId, userId), eq(recommendations.dismissed, false)))
			.orderBy(desc(recommendations.createdAt))
			.limit(10);
	}

	async create(userId: string, data: Omit<NewRecommendation, 'id' | 'userId' | 'dismissed'>) {
		const [recommendation] = await this.db
			.insert(recommendations)
			.values({ ...data, userId, dismissed: false })
			.returning();
		return recommendation;
	}

	async dismiss(userId: string, recommendationId: string) {
		const [dismissed] = await this.db
			.update(recommendations)
			.set({ dismissed: true })
			.where(and(eq(recommendations.id, recommendationId), eq(recommendations.userId, userId)))
			.returning();
		return dismissed;
	}

	async generateHints(userId: string, nutritionSummary: Record<string, number>) {
		const hints: Array<Omit<NewRecommendation, 'id' | 'userId' | 'dismissed'>> = [];

		// Check for low protein
		if (nutritionSummary.protein && nutritionSummary.protein < 25) {
			hints.push({
				date: new Date(),
				type: 'hint',
				priority: 'medium',
				message:
					'Deine Proteinaufnahme ist heute niedrig. Versuche, mehr proteinreiche Lebensmittel einzubauen.',
				nutrient: 'protein',
				actionable: 'Füge Hühnchen, Fisch, Eier oder Hülsenfrüchte hinzu',
			});
		}

		// Check for low fiber
		if (nutritionSummary.fiber && nutritionSummary.fiber < 10) {
			hints.push({
				date: new Date(),
				type: 'hint',
				priority: 'low',
				message: 'Du könntest mehr Ballaststoffe zu dir nehmen.',
				nutrient: 'fiber',
				actionable: 'Vollkornprodukte, Obst und Gemüse sind gute Quellen',
			});
		}

		// Check for high sugar
		if (nutritionSummary.sugar && nutritionSummary.sugar > 50) {
			hints.push({
				date: new Date(),
				type: 'hint',
				priority: 'high',
				message: 'Deine Zuckeraufnahme ist heute hoch.',
				nutrient: 'sugar',
				actionable: 'Reduziere Süßigkeiten und zuckerhaltige Getränke',
			});
		}

		// Save hints
		for (const hint of hints) {
			await this.create(userId, hint);
		}

		return hints;
	}
}
