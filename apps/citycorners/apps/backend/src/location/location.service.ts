import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, or, ilike, sql, desc, ne, and, isNotNull, isNull } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { locations } from '../db/schema';
import type { Location, NewLocation, LocationImage } from '../db/schema';

export interface PaginatedResult<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/ß/g, 'ss')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class LocationService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	private notDeleted = isNull(locations.deletedAt);

	async findAll(category?: string, page = 1, limit = 20): Promise<PaginatedResult<Location>> {
		const offset = (page - 1) * limit;

		let items: Location[];
		let total: number;

		if (category) {
			const countResult = await this.db
				.select({ count: sql<number>`count(*)::int` })
				.from(locations)
				.where(and(eq(locations.category, category as Location['category']), this.notDeleted));
			total = countResult[0]?.count ?? 0;

			items = await this.db
				.select()
				.from(locations)
				.where(and(eq(locations.category, category as Location['category']), this.notDeleted))
				.orderBy(desc(locations.createdAt))
				.limit(limit)
				.offset(offset);
		} else {
			const countResult = await this.db
				.select({ count: sql<number>`count(*)::int` })
				.from(locations)
				.where(this.notDeleted);
			total = countResult[0]?.count ?? 0;

			items = await this.db
				.select()
				.from(locations)
				.where(this.notDeleted)
				.orderBy(desc(locations.createdAt))
				.limit(limit)
				.offset(offset);
		}

		return {
			items,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async search(query: string): Promise<Location[]> {
		const pattern = `%${query}%`;
		return this.db
			.select()
			.from(locations)
			.where(
				and(
					or(
						ilike(locations.name, pattern),
						ilike(locations.description, pattern),
						ilike(locations.address, pattern)
					),
					this.notDeleted
				)
			);
	}

	async findById(id: string): Promise<Location> {
		const [location] = await this.db
			.select()
			.from(locations)
			.where(and(eq(locations.id, id), this.notDeleted));
		if (!location) {
			throw new NotFoundException(`Location with id ${id} not found`);
		}
		return location;
	}

	async findBySlug(slug: string): Promise<Location> {
		const [location] = await this.db
			.select()
			.from(locations)
			.where(and(eq(locations.slug, slug), this.notDeleted));
		if (!location) {
			throw new NotFoundException(`Location with slug ${slug} not found`);
		}
		return location;
	}

	async findByIdOrSlug(idOrSlug: string): Promise<Location> {
		if (UUID_PATTERN.test(idOrSlug)) {
			return this.findById(idOrSlug);
		}
		return this.findBySlug(idOrSlug);
	}

	async create(data: NewLocation): Promise<Location> {
		const slug = await this.generateUniqueSlug(data.name);
		const [location] = await this.db
			.insert(locations)
			.values({ ...data, slug })
			.returning();
		return location;
	}

	private async generateUniqueSlug(name: string): Promise<string> {
		const baseSlug = generateSlug(name);
		let slug = baseSlug;
		let counter = 1;

		while (true) {
			const [existing] = await this.db
				.select({ id: locations.id })
				.from(locations)
				.where(eq(locations.slug, slug));
			if (!existing) break;
			counter++;
			slug = `${baseSlug}-${counter}`;
		}

		return slug;
	}

	async update(id: string, data: Partial<NewLocation>, userId?: string): Promise<Location> {
		const existing = await this.findById(id);

		// If location has an owner, only the owner can edit
		if (existing.createdBy && userId && existing.createdBy !== userId) {
			throw new ForbiddenException('You can only edit your own locations');
		}

		const [location] = await this.db
			.update(locations)
			.set(data)
			.where(eq(locations.id, id))
			.returning();
		return location;
	}

	async findNearby(
		id: string,
		radiusKm = 2,
		limit = 5
	): Promise<(Location & { distance: number })[]> {
		const location = await this.findById(id);
		if (!location.latitude || !location.longitude) return [];

		const haversine = sql<number>`
			6371 * acos(
				LEAST(1.0, cos(radians(${location.latitude})) * cos(radians(${locations.latitude}))
				* cos(radians(${locations.longitude}) - radians(${location.longitude}))
				+ sin(radians(${location.latitude})) * sin(radians(${locations.latitude})))
			)
		`;

		const results = await this.db
			.select({
				location: locations,
				distance: haversine,
			})
			.from(locations)
			.where(
				and(
					ne(locations.id, id),
					isNotNull(locations.latitude),
					isNotNull(locations.longitude),
					this.notDeleted
				)
			)
			.orderBy(haversine)
			.limit(limit);

		return results
			.filter((r) => r.distance <= radiusKm)
			.map((r) => ({
				...r.location,
				distance: Math.round(r.distance * 1000), // meters
			}));
	}

	async addImage(id: string, imageUrl: string, userId: string): Promise<Location> {
		const location = await this.findById(id);
		const currentImages: LocationImage[] = (location.images as LocationImage[]) || [];

		const newImage: LocationImage = {
			url: imageUrl,
			addedBy: userId,
			addedAt: new Date().toISOString(),
		};

		const [updated] = await this.db
			.update(locations)
			.set({ images: [...currentImages, newImage] })
			.where(eq(locations.id, id))
			.returning();
		return updated;
	}

	async searchSuggestions(
		query: string,
		limit = 5
	): Promise<{ id: string; name: string; category: string }[]> {
		if (!query.trim()) return [];
		const pattern = `${query}%`;
		const results = await this.db
			.select({ id: locations.id, name: locations.name, category: locations.category })
			.from(locations)
			.where(and(ilike(locations.name, pattern), this.notDeleted))
			.limit(limit);
		return results;
	}

	async delete(id: string, userId?: string): Promise<void> {
		const existing = await this.findById(id);

		// If location has an owner, only the owner can delete
		if (existing.createdBy && userId && existing.createdBy !== userId) {
			throw new ForbiddenException('You can only delete your own locations');
		}

		// Soft delete
		await this.db.update(locations).set({ deletedAt: new Date() }).where(eq(locations.id, id));
	}

	async restore(id: string, userId?: string): Promise<Location> {
		// Find including soft-deleted
		const [existing] = await this.db.select().from(locations).where(eq(locations.id, id));
		if (!existing) {
			throw new NotFoundException(`Location with id ${id} not found`);
		}

		if (existing.createdBy && userId && existing.createdBy !== userId) {
			throw new ForbiddenException('You can only restore your own locations');
		}

		const [restored] = await this.db
			.update(locations)
			.set({ deletedAt: null })
			.where(eq(locations.id, id))
			.returning();
		return restored;
	}
}
