import { Injectable, Inject, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, desc } from 'drizzle-orm';
import { CreditClientService } from '@manacore/nestjs-integration';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/connection';
import { guides, guidePois, pois, cities } from '../db/schema';
import { CityService } from '../city/city.service';
import { PoiService } from '../poi/poi.service';
import type { GenerateGuideRequest } from '@traces/types';

@Injectable()
export class GuideService {
	private readonly logger = new Logger(GuideService.name);

	constructor(
		@Inject(DATABASE_CONNECTION) private readonly db: Database,
		private readonly configService: ConfigService,
		private readonly cityService: CityService,
		private readonly poiService: PoiService,
		private readonly creditClient: CreditClientService
	) {}

	async generateGuide(userId: string, request: GenerateGuideRequest) {
		const city = await this.cityService.getCityById(request.cityId);
		if (!city) throw new NotFoundException('City not found');

		const language = request.language || 'de';
		const maxPois = request.maxPois || 8;

		// Calculate credit cost: 5 base + 2 per POI
		const estimatedCost = 5 + 2 * maxPois;

		// Consume credits before starting generation
		await this.creditClient.consumeCredits(
			userId,
			'guide_generation',
			estimatedCost,
			`City guide: ${city.name}`
		);

		// Create guide record in 'generating' state
		const [guide] = await this.db
			.insert(guides)
			.values({
				userId,
				cityId: city.id,
				title: `Stadtführung: ${city.name}`,
				status: 'generating',
				language,
				creditsCost: estimatedCost,
			})
			.returning();

		// Start async generation pipeline
		this.runGenerationPipeline(guide.id, city, language, maxPois, request).catch((err) => {
			this.logger.error(`Guide generation failed for ${guide.id}:`, err);
			this.db
				.update(guides)
				.set({ status: 'error', updatedAt: new Date() })
				.where(eq(guides.id, guide.id))
				.catch(() => {});
		});

		return {
			id: guide.id,
			status: 'generating',
			creditsCost: estimatedCost,
		};
	}

	private async runGenerationPipeline(
		guideId: string,
		city: typeof cities.$inferSelect,
		language: string,
		maxPois: number,
		request: GenerateGuideRequest
	) {
		const manaSearchUrl = this.configService.get<string>('MANA_SEARCH_URL');
		const manaLlmUrl = this.configService.get<string>('MANA_LLM_URL');

		// Step 1: POI Discovery via mana-search
		this.logger.log(`[${guideId}] Step 1: POI Discovery for ${city.name}`);
		const searchQueries = [
			`${city.name} Sehenswürdigkeiten Architektur Geschichte`,
			`${city.name} historic buildings monuments Wikipedia`,
			`${city.name} must see landmarks tourist attractions`,
		];

		const discoveredPois: Array<{
			name: string;
			description?: string;
			latitude: number;
			longitude: number;
			category: string;
			sourceUrls: string[];
		}> = [];

		if (manaSearchUrl) {
			for (const query of searchQueries) {
				try {
					const searchResponse = await fetch(`${manaSearchUrl}/api/v1/search`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							query,
							options: { categories: ['general'], limit: 10 },
						}),
					});

					if (searchResponse.ok) {
						const { results } = await searchResponse.json();
						// Extract POI names from search results (simplified - real implementation
						// would parse structured data)
						for (const result of results || []) {
							// Results will be used for content enrichment
							this.logger.debug(`Search result: ${result.title}`);
						}
					}
				} catch (err) {
					this.logger.warn(`Search failed for query "${query}":`, err);
				}
			}
		}

		// Step 2: Create POI records (for now, use any existing POIs near the city)
		this.logger.log(`[${guideId}] Step 2: Finding POIs near ${city.name}`);
		const nearbyPois = await this.poiService.findNearby({
			lat: city.latitude,
			lng: city.longitude,
			radiusMeters: request.radiusMeters || 2000,
			cityId: city.id,
			limit: maxPois,
		});

		// Step 3: Enrich POIs with AI summaries
		this.logger.log(`[${guideId}] Step 3: Content enrichment`);
		if (manaLlmUrl) {
			for (const poi of nearbyPois) {
				if (!poi.aiSummary) {
					try {
						const prompt =
							language === 'de'
								? `Schreibe eine 200-Wort-Zusammenfassung über "${poi.name}" in ${city.name}. Fokus auf Baugeschichte, Architekturstil und interessante Anekdoten.`
								: `Write a 200-word summary about "${poi.name}" in ${city.name}. Focus on architectural history, style, and interesting anecdotes.`;

						const llmResponse = await fetch(`${manaLlmUrl}/api/v1/chat/completions`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								messages: [{ role: 'user', content: prompt }],
								model: 'default',
								max_tokens: 500,
							}),
						});

						if (llmResponse.ok) {
							const data = await llmResponse.json();
							const summary = data.choices?.[0]?.message?.content;
							if (summary) {
								await this.poiService.updateAiSummary(poi.id, summary, language);
							}
						}
					} catch (err) {
						this.logger.warn(`AI summary failed for POI ${poi.name}:`, err);
					}
				}
			}
		}

		// Step 4: Route generation (nearest-neighbor from city center)
		this.logger.log(`[${guideId}] Step 4: Route generation`);
		const sortedPois = this.sortPoisByNearestNeighbor(nearbyPois, city.latitude, city.longitude);

		let totalDistance = 0;
		for (let i = 1; i < sortedPois.length; i++) {
			totalDistance += this.haversineDistance(
				sortedPois[i - 1].latitude,
				sortedPois[i - 1].longitude,
				sortedPois[i].latitude,
				sortedPois[i].longitude
			);
		}

		const estimatedDurationMin = Math.ceil(totalDistance / (4000 / 60)); // 4 km/h walking
		const routePolyline = JSON.stringify(sortedPois.map((p) => [p.latitude, p.longitude]));

		// Step 5: Generate narratives
		this.logger.log(`[${guideId}] Step 5: Narrative assembly`);
		const guidePoiRecords: Array<{
			poiId: string;
			sortOrder: number;
			aiNarrative: string | null;
		}> = [];

		for (let i = 0; i < sortedPois.length; i++) {
			const poi = sortedPois[i];
			let narrative: string | null = null;

			if (manaLlmUrl) {
				try {
					const prevStation = i > 0 ? sortedPois[i - 1].name : 'Startpunkt';
					const distanceToPrev =
						i > 0
							? Math.round(
									this.haversineDistance(
										sortedPois[i - 1].latitude,
										sortedPois[i - 1].longitude,
										poi.latitude,
										poi.longitude
									)
								)
							: 0;

					const prompt =
						language === 'de'
							? `Du bist ein erfahrener Stadtführer in ${city.name}. Schreibe einen kurzen, lebendigen Stadtführer-Text (80-120 Wörter) über "${poi.name}" als Station ${i + 1} einer Stadtführung. ${i > 0 ? `Die vorherige Station war "${prevStation}" (${distanceToPrev}m entfernt).` : 'Dies ist die erste Station.'} Erwähne architektonische Details und eine interessante Anekdote.`
							: `You are an experienced city guide in ${city.name}. Write a short, vivid guide text (80-120 words) about "${poi.name}" as station ${i + 1} of a walking tour. ${i > 0 ? `The previous station was "${prevStation}" (${distanceToPrev}m away).` : 'This is the first station.'} Mention architectural details and an interesting anecdote.`;

					const llmResponse = await fetch(`${manaLlmUrl}/api/v1/chat/completions`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							messages: [{ role: 'user', content: prompt }],
							model: 'default',
							max_tokens: 300,
						}),
					});

					if (llmResponse.ok) {
						const data = await llmResponse.json();
						narrative = data.choices?.[0]?.message?.content || null;
					}
				} catch (err) {
					this.logger.warn(`Narrative generation failed for POI ${poi.name}:`, err);
				}
			}

			guidePoiRecords.push({
				poiId: poi.id,
				sortOrder: i,
				aiNarrative: narrative,
			});
		}

		// Save guide POIs
		if (guidePoiRecords.length > 0) {
			await this.db.insert(guidePois).values(
				guidePoiRecords.map((r) => ({
					guideId,
					poiId: r.poiId,
					sortOrder: r.sortOrder,
					aiNarrative: r.aiNarrative,
					narrativeLanguage: language,
				}))
			);
		}

		// Update guide to ready
		const title = language === 'de' ? `Stadtführung: ${city.name}` : `City Guide: ${city.name}`;

		await this.db
			.update(guides)
			.set({
				status: 'ready',
				title,
				description:
					language === 'de'
						? `${sortedPois.length} Stationen, ca. ${estimatedDurationMin} Min.`
						: `${sortedPois.length} stations, approx. ${estimatedDurationMin} min.`,
				routePolyline,
				estimatedDurationMin,
				distanceMeters: Math.round(totalDistance),
				updatedAt: new Date(),
			})
			.where(eq(guides.id, guideId));

		this.logger.log(
			`[${guideId}] Guide generation complete: ${sortedPois.length} POIs, ${Math.round(totalDistance)}m`
		);
	}

	private sortPoisByNearestNeighbor(
		poisList: Array<{ id: string; latitude: number; longitude: number; [key: string]: any }>,
		startLat: number,
		startLng: number
	) {
		const remaining = [...poisList];
		const sorted: typeof remaining = [];
		let currentLat = startLat;
		let currentLng = startLng;

		while (remaining.length > 0) {
			let nearestIdx = 0;
			let nearestDist = Infinity;

			for (let i = 0; i < remaining.length; i++) {
				const dist = this.haversineDistance(
					currentLat,
					currentLng,
					remaining[i].latitude,
					remaining[i].longitude
				);
				if (dist < nearestDist) {
					nearestDist = dist;
					nearestIdx = i;
				}
			}

			const nearest = remaining.splice(nearestIdx, 1)[0];
			sorted.push(nearest);
			currentLat = nearest.latitude;
			currentLng = nearest.longitude;
		}

		return sorted;
	}

	private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
		const R = 6371000;
		const φ1 = (lat1 * Math.PI) / 180;
		const φ2 = (lat2 * Math.PI) / 180;
		const Δφ = ((lat2 - lat1) * Math.PI) / 180;
		const Δλ = ((lon2 - lon1) * Math.PI) / 180;
		const a =
			Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
			Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}

	async getUserGuides(userId: string) {
		const results = await this.db
			.select({
				guide: guides,
				cityName: cities.name,
				cityCountry: cities.country,
			})
			.from(guides)
			.innerJoin(cities, eq(guides.cityId, cities.id))
			.where(eq(guides.userId, userId))
			.orderBy(desc(guides.createdAt));

		return results.map((r) => ({
			id: r.guide.id,
			title: r.guide.title,
			description: r.guide.description,
			status: r.guide.status,
			cityName: r.cityName,
			cityCountry: r.cityCountry,
			estimatedDurationMin: r.guide.estimatedDurationMin,
			distanceMeters: r.guide.distanceMeters,
			language: r.guide.language,
			creditsCost: r.guide.creditsCost,
			createdAt: r.guide.createdAt.toISOString(),
		}));
	}

	async getGuideDetail(userId: string, guideId: string) {
		const [guide] = await this.db.select().from(guides).where(eq(guides.id, guideId)).limit(1);

		if (!guide) throw new NotFoundException('Guide not found');
		if (guide.userId !== userId) throw new ForbiddenException();

		const city = await this.cityService.getCityById(guide.cityId);

		const guidePoiResults = await this.db
			.select({
				guidePoi: guidePois,
				poi: pois,
			})
			.from(guidePois)
			.innerJoin(pois, eq(guidePois.poiId, pois.id))
			.where(eq(guidePois.guideId, guideId))
			.orderBy(guidePois.sortOrder);

		return {
			...guide,
			createdAt: guide.createdAt.toISOString(),
			updatedAt: guide.updatedAt.toISOString(),
			city,
			pois: guidePoiResults.map((r) => ({
				id: r.guidePoi.id,
				sortOrder: r.guidePoi.sortOrder,
				aiNarrative: r.guidePoi.aiNarrative,
				narrativeLanguage: r.guidePoi.narrativeLanguage,
				poi: r.poi,
			})),
		};
	}

	async deleteGuide(userId: string, guideId: string) {
		const [guide] = await this.db.select().from(guides).where(eq(guides.id, guideId)).limit(1);

		if (!guide) throw new NotFoundException('Guide not found');
		if (guide.userId !== userId) throw new ForbiddenException();

		// guide_pois cascade-deleted automatically
		await this.db.delete(guides).where(eq(guides.id, guideId));
		return { deleted: true };
	}
}
