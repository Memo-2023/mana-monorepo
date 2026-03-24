import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { collections } from '../db/schema';
import type { Collection, NewCollection } from '../db/schema';

@Injectable()
export class CollectionService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByUserId(userId: string): Promise<Collection[]> {
		return this.db.select().from(collections).where(eq(collections.userId, userId));
	}

	async findById(id: string, userId: string): Promise<Collection> {
		const [collection] = await this.db
			.select()
			.from(collections)
			.where(and(eq(collections.id, id), eq(collections.userId, userId)));
		if (!collection) {
			throw new NotFoundException(`Collection with id ${id} not found`);
		}
		return collection;
	}

	async create(data: { name: string; description?: string; userId: string }): Promise<Collection> {
		const [collection] = await this.db
			.insert(collections)
			.values({
				name: data.name,
				description: data.description,
				userId: data.userId,
				locationIds: [],
			})
			.returning();
		return collection;
	}

	async update(
		id: string,
		data: { name?: string; description?: string },
		userId: string
	): Promise<Collection> {
		const existing = await this.findById(id, userId);

		const [updated] = await this.db
			.update(collections)
			.set(data)
			.where(eq(collections.id, id))
			.returning();
		return updated;
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.findById(id, userId);
		await this.db.delete(collections).where(eq(collections.id, id));
	}

	async addLocation(id: string, locationId: string, userId: string): Promise<Collection> {
		const collection = await this.findById(id, userId);
		const currentIds: string[] = (collection.locationIds as string[]) || [];

		if (currentIds.includes(locationId)) {
			return collection;
		}

		const [updated] = await this.db
			.update(collections)
			.set({ locationIds: [...currentIds, locationId] })
			.where(eq(collections.id, id))
			.returning();
		return updated;
	}

	async removeLocation(id: string, locationId: string, userId: string): Promise<Collection> {
		const collection = await this.findById(id, userId);
		const currentIds: string[] = (collection.locationIds as string[]) || [];

		const [updated] = await this.db
			.update(collections)
			.set({ locationIds: currentIds.filter((lid) => lid !== locationId) })
			.where(eq(collections.id, id))
			.returning();
		return updated;
	}
}
