import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/connection';
import { cities, cityVisits } from '../db/schema';
import type { NewCity } from '../db/schema';

@Injectable()
export class CityService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

	async findOrCreateCity(data: {
		name: string;
		country: string;
		countryCode: string;
		latitude: number;
		longitude: number;
	}) {
		// Try to find existing city
		const existing = await this.db
			.select()
			.from(cities)
			.where(and(eq(cities.name, data.name), eq(cities.countryCode, data.countryCode)))
			.limit(1);

		if (existing.length > 0) {
			return existing[0];
		}

		// Create new city
		const [city] = await this.db
			.insert(cities)
			.values({
				name: data.name,
				country: data.country,
				countryCode: data.countryCode,
				latitude: data.latitude,
				longitude: data.longitude,
			})
			.onConflictDoNothing()
			.returning();

		// Handle race condition: if insert was no-op, re-fetch
		if (!city) {
			const [existing] = await this.db
				.select()
				.from(cities)
				.where(and(eq(cities.name, data.name), eq(cities.countryCode, data.countryCode)))
				.limit(1);
			return existing;
		}

		return city;
	}

	async upsertCityVisit(userId: string, cityId: string, visitDate: Date) {
		const existing = await this.db
			.select()
			.from(cityVisits)
			.where(and(eq(cityVisits.userId, userId), eq(cityVisits.cityId, cityId)))
			.limit(1);

		if (existing.length > 0) {
			const visit = existing[0];
			await this.db
				.update(cityVisits)
				.set({
					lastVisitAt: visitDate > visit.lastVisitAt ? visitDate : visit.lastVisitAt,
					firstVisitAt: visitDate < visit.firstVisitAt ? visitDate : visit.firstVisitAt,
					visitCount: sql`${cityVisits.visitCount} + 1`,
					updatedAt: new Date(),
				})
				.where(eq(cityVisits.id, visit.id));
		} else {
			await this.db.insert(cityVisits).values({
				userId,
				cityId,
				firstVisitAt: visitDate,
				lastVisitAt: visitDate,
				visitCount: 1,
			});
		}
	}

	async getUserCities(userId: string) {
		const results = await this.db
			.select({
				visitId: cityVisits.id,
				firstVisitAt: cityVisits.firstVisitAt,
				lastVisitAt: cityVisits.lastVisitAt,
				totalDurationMs: cityVisits.totalDurationMs,
				visitCount: cityVisits.visitCount,
				city: {
					id: cities.id,
					name: cities.name,
					country: cities.country,
					countryCode: cities.countryCode,
					latitude: cities.latitude,
					longitude: cities.longitude,
				},
			})
			.from(cityVisits)
			.innerJoin(cities, eq(cityVisits.cityId, cities.id))
			.where(eq(cityVisits.userId, userId))
			.orderBy(cityVisits.lastVisitAt);

		return results.map((r) => ({
			id: r.visitId,
			city: r.city,
			firstVisitAt: r.firstVisitAt.toISOString(),
			lastVisitAt: r.lastVisitAt.toISOString(),
			totalDurationMs: r.totalDurationMs,
			visitCount: r.visitCount,
		}));
	}

	async getCityDetail(userId: string, cityId: string) {
		const [city] = await this.db.select().from(cities).where(eq(cities.id, cityId)).limit(1);

		if (!city) {
			throw new NotFoundException('City not found');
		}

		const [visit] = await this.db
			.select()
			.from(cityVisits)
			.where(and(eq(cityVisits.userId, userId), eq(cityVisits.cityId, cityId)))
			.limit(1);

		return {
			city,
			visit: visit
				? {
						firstVisitAt: visit.firstVisitAt.toISOString(),
						lastVisitAt: visit.lastVisitAt.toISOString(),
						totalDurationMs: visit.totalDurationMs,
						visitCount: visit.visitCount,
					}
				: null,
		};
	}

	async getCityById(id: string) {
		const [city] = await this.db.select().from(cities).where(eq(cities.id, id)).limit(1);
		return city || null;
	}
}
