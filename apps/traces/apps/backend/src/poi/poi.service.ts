import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/connection';
import { pois } from '../db/schema';
import type { NearbyPoiQueryParams } from '@traces/types';

@Injectable()
export class PoiService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

	async findNearby(params: NearbyPoiQueryParams) {
		const { lat, lng, radiusMeters = 2000, cityId, category, limit = 20 } = params;

		// Haversine distance calculation in SQL (returns meters)
		const distanceExpr = sql`(
			6371000 * acos(
				cos(radians(${lat})) * cos(radians(${pois.latitude})) *
				cos(radians(${pois.longitude}) - radians(${lng})) +
				sin(radians(${lat})) * sin(radians(${pois.latitude}))
			)
		)`;

		const conditions = [sql`${distanceExpr} < ${radiusMeters}`];

		if (cityId) {
			conditions.push(eq(pois.cityId, cityId));
		}
		if (category) {
			conditions.push(eq(pois.category, category));
		}

		const results = await this.db
			.select({
				poi: pois,
				distance: distanceExpr.as('distance'),
			})
			.from(pois)
			.where(and(...conditions))
			.orderBy(sql`distance`)
			.limit(Math.min(limit, 50));

		return results.map((r) => ({
			...r.poi,
			distance: Math.round(r.distance as number),
		}));
	}

	async getById(id: string) {
		const [poi] = await this.db.select().from(pois).where(eq(pois.id, id)).limit(1);

		if (!poi) throw new NotFoundException('POI not found');
		return poi;
	}

	async findOrCreatePoi(data: {
		name: string;
		description?: string;
		latitude: number;
		longitude: number;
		category: string;
		cityId: string;
		sourceUrls?: string[];
	}) {
		// Check for existing POI within ~50m
		const nearby = await this.findNearby({
			lat: data.latitude,
			lng: data.longitude,
			radiusMeters: 50,
			cityId: data.cityId,
			limit: 1,
		});

		if (nearby.length > 0) {
			return nearby[0];
		}

		const [poi] = await this.db
			.insert(pois)
			.values({
				name: data.name,
				description: data.description,
				latitude: data.latitude,
				longitude: data.longitude,
				category: data.category as any,
				cityId: data.cityId,
				sourceUrls: data.sourceUrls,
			})
			.returning();

		return poi;
	}

	async updateAiSummary(poiId: string, summary: string, language: string) {
		await this.db
			.update(pois)
			.set({
				aiSummary: summary,
				aiSummaryLanguage: language,
				aiSummaryGeneratedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(pois.id, poiId));
	}
}
