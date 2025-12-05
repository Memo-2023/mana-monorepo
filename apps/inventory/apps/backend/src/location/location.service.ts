import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { DbClient } from '../db/connection';
import { locations, items } from '../db/schema';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';

export interface LocationWithChildren {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	parentLocationId: string | null;
	createdAt: Date;
	children: LocationWithChildren[];
}

@Injectable()
export class LocationService {
	constructor(@Inject(DATABASE_CONNECTION) private db: DbClient) {}

	async findAll(userId: string) {
		const allLocations = await this.db.select().from(locations).where(eq(locations.userId, userId));

		return this.buildTree(allLocations);
	}

	async findOne(userId: string, id: string) {
		const result = await this.db
			.select()
			.from(locations)
			.where(and(eq(locations.id, id), eq(locations.userId, userId)))
			.limit(1);

		if (!result.length) {
			throw new NotFoundException('Location not found');
		}

		return result[0];
	}

	async create(userId: string, dto: CreateLocationDto) {
		if (dto.parentLocationId) {
			const parent = await this.db
				.select()
				.from(locations)
				.where(and(eq(locations.id, dto.parentLocationId), eq(locations.userId, userId)))
				.limit(1);

			if (!parent.length) {
				throw new BadRequestException('Parent location not found');
			}
		}

		const [location] = await this.db
			.insert(locations)
			.values({
				userId,
				name: dto.name,
				description: dto.description,
				parentLocationId: dto.parentLocationId,
			})
			.returning();

		return location;
	}

	async update(userId: string, id: string, dto: UpdateLocationDto) {
		const existing = await this.db
			.select()
			.from(locations)
			.where(and(eq(locations.id, id), eq(locations.userId, userId)))
			.limit(1);

		if (!existing.length) {
			throw new NotFoundException('Location not found');
		}

		if (dto.parentLocationId) {
			if (dto.parentLocationId === id) {
				throw new BadRequestException('Location cannot be its own parent');
			}

			const parent = await this.db
				.select()
				.from(locations)
				.where(and(eq(locations.id, dto.parentLocationId), eq(locations.userId, userId)))
				.limit(1);

			if (!parent.length) {
				throw new BadRequestException('Parent location not found');
			}
		}

		const [location] = await this.db
			.update(locations)
			.set({
				name: dto.name ?? existing[0].name,
				description: dto.description ?? existing[0].description,
				parentLocationId: dto.parentLocationId ?? existing[0].parentLocationId,
			})
			.where(eq(locations.id, id))
			.returning();

		return location;
	}

	async delete(userId: string, id: string) {
		const existing = await this.db
			.select()
			.from(locations)
			.where(and(eq(locations.id, id), eq(locations.userId, userId)))
			.limit(1);

		if (!existing.length) {
			throw new NotFoundException('Location not found');
		}

		await this.db
			.update(locations)
			.set({ parentLocationId: null })
			.where(eq(locations.parentLocationId, id));
		await this.db.update(items).set({ locationId: null }).where(eq(items.locationId, id));
		await this.db.delete(locations).where(eq(locations.id, id));

		return { success: true };
	}

	private buildTree(allLocations: (typeof locations.$inferSelect)[]): LocationWithChildren[] {
		const map = new Map<string, LocationWithChildren>();
		const roots: LocationWithChildren[] = [];

		for (const loc of allLocations) {
			map.set(loc.id, { ...loc, children: [] });
		}

		for (const loc of allLocations) {
			const node = map.get(loc.id)!;
			if (loc.parentLocationId) {
				const parent = map.get(loc.parentLocationId);
				if (parent) {
					parent.children.push(node);
				} else {
					roots.push(node);
				}
			} else {
				roots.push(node);
			}
		}

		return roots;
	}
}
