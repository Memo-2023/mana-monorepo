import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, ilike, desc, asc, or, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { DbClient } from '../db/connection';
import { items, categories, locations, itemPhotos, itemDocuments } from '../db/schema';
import { CreateItemDto, UpdateItemDto, ItemQueryDto } from './dto';

@Injectable()
export class ItemService {
	constructor(@Inject(DATABASE_CONNECTION) private db: DbClient) {}

	async findAll(userId: string, query: ItemQueryDto) {
		const {
			search,
			categoryId,
			locationId,
			condition,
			isFavorite,
			isArchived = false,
			sortBy = 'createdAt',
			sortOrder = 'desc',
			page = 1,
			limit = 20,
		} = query;

		const conditions = [eq(items.userId, userId), eq(items.isArchived, isArchived)];

		if (search) {
			const searchCondition = or(
				ilike(items.name, `%${search}%`),
				ilike(items.description, `%${search}%`)
			);
			if (searchCondition) conditions.push(searchCondition);
		}
		if (categoryId) conditions.push(eq(items.categoryId, categoryId));
		if (locationId) conditions.push(eq(items.locationId, locationId));
		if (condition) conditions.push(eq(items.condition, condition));
		if (isFavorite !== undefined) conditions.push(eq(items.isFavorite, isFavorite));

		const orderByMap = {
			name: items.name,
			createdAt: items.createdAt,
			updatedAt: items.updatedAt,
			purchaseDate: items.purchaseDate,
			purchasePrice: items.purchasePrice,
			currentValue: items.currentValue,
		} as const;

		const orderByColumn = orderByMap[sortBy as keyof typeof orderByMap] || items.createdAt;
		const orderFn = sortOrder === 'asc' ? asc : desc;

		const offset = (page - 1) * limit;

		const [data, countResult] = await Promise.all([
			this.db
				.select({
					item: items,
					category: categories,
					location: locations,
				})
				.from(items)
				.leftJoin(categories, eq(items.categoryId, categories.id))
				.leftJoin(locations, eq(items.locationId, locations.id))
				.where(and(...conditions))
				.orderBy(orderFn(orderByColumn))
				.limit(limit)
				.offset(offset),
			this.db
				.select({ count: sql<number>`count(*)` })
				.from(items)
				.where(and(...conditions)),
		]);

		const total = Number(countResult[0]?.count || 0);

		return {
			items: data.map(({ item, category, location }) => ({
				...item,
				category,
				location,
			})),
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async findOne(userId: string, id: string) {
		const result = await this.db
			.select({
				item: items,
				category: categories,
				location: locations,
			})
			.from(items)
			.leftJoin(categories, eq(items.categoryId, categories.id))
			.leftJoin(locations, eq(items.locationId, locations.id))
			.where(and(eq(items.id, id), eq(items.userId, userId)))
			.limit(1);

		if (!result.length) {
			throw new NotFoundException('Item not found');
		}

		const { item, category, location } = result[0];

		const [photos, documents] = await Promise.all([
			this.db
				.select()
				.from(itemPhotos)
				.where(eq(itemPhotos.itemId, id))
				.orderBy(asc(itemPhotos.sortOrder)),
			this.db
				.select()
				.from(itemDocuments)
				.where(eq(itemDocuments.itemId, id))
				.orderBy(desc(itemDocuments.uploadedAt)),
		]);

		return {
			...item,
			category,
			location,
			photos,
			documents,
		};
	}

	async create(userId: string, dto: CreateItemDto) {
		const [item] = await this.db
			.insert(items)
			.values({
				userId,
				name: dto.name,
				description: dto.description,
				sku: dto.sku,
				categoryId: dto.categoryId,
				locationId: dto.locationId,
				purchaseDate: dto.purchaseDate,
				purchasePrice: dto.purchasePrice?.toString(),
				currency: dto.currency || 'EUR',
				currentValue: dto.currentValue?.toString(),
				condition: dto.condition || 'good',
				warrantyExpires: dto.warrantyExpires,
				warrantyNotes: dto.warrantyNotes,
				notes: dto.notes,
				quantity: dto.quantity?.toString() || '1',
				isFavorite: dto.isFavorite || false,
			})
			.returning();

		return item;
	}

	async update(userId: string, id: string, dto: UpdateItemDto) {
		const existing = await this.db
			.select()
			.from(items)
			.where(and(eq(items.id, id), eq(items.userId, userId)))
			.limit(1);

		if (!existing.length) {
			throw new NotFoundException('Item not found');
		}

		const updateData: Record<string, unknown> = { updatedAt: new Date() };
		if (dto.name !== undefined) updateData.name = dto.name;
		if (dto.description !== undefined) updateData.description = dto.description;
		if (dto.sku !== undefined) updateData.sku = dto.sku;
		if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
		if (dto.locationId !== undefined) updateData.locationId = dto.locationId;
		if (dto.purchaseDate !== undefined) updateData.purchaseDate = dto.purchaseDate;
		if (dto.purchasePrice !== undefined) updateData.purchasePrice = dto.purchasePrice?.toString();
		if (dto.currency !== undefined) updateData.currency = dto.currency;
		if (dto.currentValue !== undefined) updateData.currentValue = dto.currentValue?.toString();
		if (dto.condition !== undefined) updateData.condition = dto.condition;
		if (dto.warrantyExpires !== undefined) updateData.warrantyExpires = dto.warrantyExpires;
		if (dto.warrantyNotes !== undefined) updateData.warrantyNotes = dto.warrantyNotes;
		if (dto.notes !== undefined) updateData.notes = dto.notes;
		if (dto.quantity !== undefined) updateData.quantity = dto.quantity?.toString();
		if (dto.isFavorite !== undefined) updateData.isFavorite = dto.isFavorite;

		const [item] = await this.db.update(items).set(updateData).where(eq(items.id, id)).returning();

		return item;
	}

	async delete(userId: string, id: string) {
		const existing = await this.db
			.select()
			.from(items)
			.where(and(eq(items.id, id), eq(items.userId, userId)))
			.limit(1);

		if (!existing.length) {
			throw new NotFoundException('Item not found');
		}

		await this.db.delete(items).where(eq(items.id, id));
		return { success: true };
	}

	async toggleFavorite(userId: string, id: string) {
		const existing = await this.db
			.select()
			.from(items)
			.where(and(eq(items.id, id), eq(items.userId, userId)))
			.limit(1);

		if (!existing.length) {
			throw new NotFoundException('Item not found');
		}

		const [item] = await this.db
			.update(items)
			.set({
				isFavorite: !existing[0].isFavorite,
				updatedAt: new Date(),
			})
			.where(eq(items.id, id))
			.returning();

		return item;
	}

	async toggleArchive(userId: string, id: string) {
		const existing = await this.db
			.select()
			.from(items)
			.where(and(eq(items.id, id), eq(items.userId, userId)))
			.limit(1);

		if (!existing.length) {
			throw new NotFoundException('Item not found');
		}

		const [item] = await this.db
			.update(items)
			.set({
				isArchived: !existing[0].isArchived,
				updatedAt: new Date(),
			})
			.where(eq(items.id, id))
			.returning();

		return item;
	}
}
