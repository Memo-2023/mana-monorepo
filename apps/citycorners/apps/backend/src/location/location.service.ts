import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, or, ilike } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { locations } from '../db/schema';
import type { Location, NewLocation } from '../db/schema';

@Injectable()
export class LocationService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(category?: string): Promise<Location[]> {
		if (category) {
			return this.db
				.select()
				.from(locations)
				.where(eq(locations.category, category as Location['category']));
		}
		return this.db.select().from(locations);
	}

	async search(query: string): Promise<Location[]> {
		const pattern = `%${query}%`;
		return this.db
			.select()
			.from(locations)
			.where(
				or(
					ilike(locations.name, pattern),
					ilike(locations.description, pattern),
					ilike(locations.address, pattern)
				)
			);
	}

	async findById(id: string): Promise<Location> {
		const [location] = await this.db.select().from(locations).where(eq(locations.id, id));
		if (!location) {
			throw new NotFoundException(`Location with id ${id} not found`);
		}
		return location;
	}

	async create(data: NewLocation): Promise<Location> {
		const [location] = await this.db.insert(locations).values(data).returning();
		return location;
	}

	async update(id: string, data: Partial<NewLocation>): Promise<Location> {
		const [location] = await this.db
			.update(locations)
			.set(data)
			.where(eq(locations.id, id))
			.returning();
		if (!location) {
			throw new NotFoundException(`Location with id ${id} not found`);
		}
		return location;
	}

	async delete(id: string): Promise<void> {
		const [location] = await this.db.delete(locations).where(eq(locations.id, id)).returning();
		if (!location) {
			throw new NotFoundException(`Location with id ${id} not found`);
		}
	}
}
