import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/connection';
import { places, cities } from '../db/schema';
import type { CreatePlaceRequest, UpdatePlaceRequest } from '@traces/types';

@Injectable()
export class PlaceService {
	constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

	async getUserPlaces(userId: string) {
		const results = await this.db
			.select({
				place: places,
				cityName: cities.name,
			})
			.from(places)
			.leftJoin(cities, eq(places.cityId, cities.id))
			.where(eq(places.userId, userId));

		return results.map((r) => ({
			...r.place,
			cityName: r.cityName,
			firstVisitAt: r.place.firstVisitAt?.toISOString(),
			lastVisitAt: r.place.lastVisitAt?.toISOString(),
		}));
	}

	async createPlace(userId: string, data: CreatePlaceRequest) {
		const [place] = await this.db
			.insert(places)
			.values({
				userId,
				name: data.name,
				latitude: data.latitude,
				longitude: data.longitude,
				radiusMeters: data.radiusMeters || 100,
				addressFormatted: data.addressFormatted,
			})
			.returning();

		return place;
	}

	async updatePlace(userId: string, id: string, data: UpdatePlaceRequest) {
		const [existing] = await this.db.select().from(places).where(eq(places.id, id)).limit(1);

		if (!existing) throw new NotFoundException('Place not found');
		if (existing.userId !== userId) throw new ForbiddenException();

		const [updated] = await this.db
			.update(places)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(places.id, id))
			.returning();

		return updated;
	}

	async deletePlace(userId: string, id: string) {
		const [existing] = await this.db.select().from(places).where(eq(places.id, id)).limit(1);

		if (!existing) throw new NotFoundException('Place not found');
		if (existing.userId !== userId) throw new ForbiddenException();

		await this.db.delete(places).where(eq(places.id, id));
		return { deleted: true };
	}
}
