import { Injectable, Inject } from '@nestjs/common';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/connection';
import { locations } from '../db/schema';
import { CityService } from '../city/city.service';
import type { LocationSyncItem, LocationQueryParams } from '@traces/types';

@Injectable()
export class LocationService {
	constructor(
		@Inject(DATABASE_CONNECTION) private readonly db: Database,
		private readonly cityService: CityService
	) {}

	async syncLocations(userId: string, items: LocationSyncItem[]) {
		let synced = 0;
		let duplicates = 0;

		for (const item of items) {
			// Check for duplicate by original ID
			const existing = await this.db
				.select({ id: locations.id })
				.from(locations)
				.where(eq(locations.id, item.id))
				.limit(1);

			if (existing.length > 0) {
				duplicates++;
				continue;
			}

			// Auto-detect city from address
			let cityId: string | undefined;
			if (item.city && item.countryCode) {
				const city = await this.cityService.findOrCreateCity({
					name: item.city,
					country: item.country || item.city,
					countryCode: item.countryCode,
					latitude: item.latitude,
					longitude: item.longitude,
				});
				cityId = city.id;

				// Upsert city visit
				await this.cityService.upsertCityVisit(userId, city.id, new Date(item.recordedAt));
			}

			await this.db.insert(locations).values({
				id: item.id,
				userId,
				latitude: item.latitude,
				longitude: item.longitude,
				recordedAt: new Date(item.recordedAt),
				accuracy: item.accuracy,
				altitude: item.altitude,
				speed: item.speed,
				source: item.source,
				deviceMotion: item.deviceMotion,
				addressFormatted: item.addressFormatted,
				street: item.street,
				houseNumber: item.houseNumber,
				city: item.city,
				postalCode: item.postalCode,
				country: item.country,
				countryCode: item.countryCode,
				cityId,
			});

			synced++;
		}

		return { synced, duplicates };
	}

	async getLocations(userId: string, params: LocationQueryParams) {
		const conditions = [eq(locations.userId, userId)];

		if (params.cityId) {
			conditions.push(eq(locations.cityId, params.cityId));
		}
		if (params.from) {
			conditions.push(gte(locations.recordedAt, new Date(params.from)));
		}
		if (params.to) {
			conditions.push(lte(locations.recordedAt, new Date(params.to)));
		}

		const limit = params.limit ? Math.min(params.limit, 1000) : 100;
		const offset = params.offset || 0;

		return this.db
			.select()
			.from(locations)
			.where(and(...conditions))
			.orderBy(desc(locations.recordedAt))
			.limit(limit)
			.offset(offset);
	}
}
