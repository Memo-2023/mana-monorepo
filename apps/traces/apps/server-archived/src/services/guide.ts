/**
 * Guide Generation Service — AI-powered city guides
 *
 * Server-only: calls mana-llm for POI summaries and narratives,
 * mana-search for POI discovery, and computes optimal routes.
 */

import { eq, and } from 'drizzle-orm';
import type { Database } from '../db';

export class GuideService {
	constructor(
		private db: Database,
		private llmUrl: string,
		private searchUrl: string
	) {}

	async generateGuide(
		userId: string,
		params: {
			cityId: string;
			title: string;
			language?: string;
			maxPois?: number;
		}
	) {
		const { guides, cities } = await import('../schema');

		// Get city
		const [city] = await this.db.select().from(cities).where(eq(cities.id, params.cityId)).limit(1);
		if (!city) throw new Error('City not found');

		// Create guide in 'generating' state
		const [guide] = await this.db
			.insert(guides)
			.values({
				userId,
				cityId: params.cityId,
				title: params.title || `Guide: ${city.name}`,
				status: 'generating',
				language: params.language || 'de',
			})
			.returning();

		// Fire-and-forget async pipeline
		this.runPipeline(guide.id, userId, city, params.language || 'de', params.maxPois || 10).catch(
			(err) => {
				console.error('Guide generation failed:', err);
				this.db
					.update(guides)
					.set({ status: 'error' })
					.where(eq(guides.id, guide.id))
					.catch(() => {});
			}
		);

		return guide;
	}

	private async runPipeline(
		guideId: string,
		userId: string,
		city: { id: string; name: string; latitude: number | null; longitude: number | null },
		language: string,
		maxPois: number
	) {
		const { guides } = await import('../schema');

		// 1. Find nearby POIs
		const nearbyPois = await this.db
			.select()
			.from(pois)
			.where(eq(pois.cityId, city.id))
			.limit(maxPois);

		if (nearbyPois.length === 0) {
			await this.db.update(guides).set({ status: 'ready' }).where(eq(guides.id, guideId));
			return;
		}

		// 2. Generate AI narratives for each POI
		for (let i = 0; i < nearbyPois.length; i++) {
			const poi = nearbyPois[i];
			let narrative = poi.aiSummary || '';

			if (!narrative) {
				try {
					narrative = await this.generateNarrative(poi.name, city.name, language);
				} catch {
					narrative = poi.description || poi.name;
				}
			}

			await this.db.insert(guidePois).values({
				guideId,
				poiId: poi.id,
				sortOrder: i,
				aiNarrative: narrative,
				narrativeLanguage: language,
			});
		}

		// 3. Mark as ready
		await this.db
			.update(guides)
			.set({
				status: 'ready',
				estimatedDurationMin: nearbyPois.length * 15,
			})
			.where(eq(guides.id, guideId));
	}

	private async generateNarrative(
		poiName: string,
		cityName: string,
		language: string
	): Promise<string> {
		const res = await fetch(`${this.llmUrl}/api/v1/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				messages: [
					{
						role: 'system',
						content: `Du bist ein Stadtführer in ${cityName}. Schreibe einen kurzen, informativen Text (max 200 Wörter) über die Sehenswürdigkeit. Sprache: ${language === 'de' ? 'Deutsch' : 'English'}.`,
					},
					{ role: 'user', content: `Erzähle mir über: ${poiName}` },
				],
				model: 'gemma3:4b',
				max_tokens: 300,
			}),
		});

		if (!res.ok) throw new Error('LLM failed');
		const data = await res.json();
		return data.choices?.[0]?.message?.content?.trim() || poiName;
	}

	async getUserGuides(userId: string) {
		const { guides } = await import('../schema');
		return this.db.select().from(guides).where(eq(guides.userId, userId));
	}

	async getGuideDetail(userId: string, guideId: string) {
		const { guides } = await import('../schema');
		const [guide] = await this.db
			.select()
			.from(guides)
			.where(and(eq(guides.id, guideId), eq(guides.userId, userId)))
			.limit(1);

		if (!guide) return null;

		const waypoints = await this.db
			.select()
			.from(guidePois)
			.innerJoin(pois, eq(guidePois.poiId, pois.id))
			.where(eq(guidePois.guideId, guideId))
			.orderBy(guidePois.sortOrder);

		return { ...guide, waypoints };
	}

	async deleteGuide(userId: string, guideId: string) {
		const { guides } = await import('../schema');
		await this.db.delete(guides).where(and(eq(guides.id, guideId), eq(guides.userId, userId)));
	}
}
