import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { DbClient } from '../db/connection';
import { categories, items } from '../db/schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

export interface CategoryWithChildren {
	id: string;
	userId: string;
	name: string;
	icon: string | null;
	color: string | null;
	parentCategoryId: string | null;
	createdAt: Date;
	children: CategoryWithChildren[];
}

@Injectable()
export class CategoryService {
	constructor(@Inject(DATABASE_CONNECTION) private db: DbClient) {}

	async findAll(userId: string) {
		const allCategories = await this.db
			.select()
			.from(categories)
			.where(eq(categories.userId, userId));

		return this.buildTree(allCategories);
	}

	async findOne(userId: string, id: string) {
		const result = await this.db
			.select()
			.from(categories)
			.where(and(eq(categories.id, id), eq(categories.userId, userId)))
			.limit(1);

		if (!result.length) {
			throw new NotFoundException('Category not found');
		}

		return result[0];
	}

	async create(userId: string, dto: CreateCategoryDto) {
		if (dto.parentCategoryId) {
			const parent = await this.db
				.select()
				.from(categories)
				.where(and(eq(categories.id, dto.parentCategoryId), eq(categories.userId, userId)))
				.limit(1);

			if (!parent.length) {
				throw new BadRequestException('Parent category not found');
			}
		}

		const [category] = await this.db
			.insert(categories)
			.values({
				userId,
				name: dto.name,
				icon: dto.icon,
				color: dto.color,
				parentCategoryId: dto.parentCategoryId,
			})
			.returning();

		return category;
	}

	async update(userId: string, id: string, dto: UpdateCategoryDto) {
		const existing = await this.db
			.select()
			.from(categories)
			.where(and(eq(categories.id, id), eq(categories.userId, userId)))
			.limit(1);

		if (!existing.length) {
			throw new NotFoundException('Category not found');
		}

		if (dto.parentCategoryId) {
			if (dto.parentCategoryId === id) {
				throw new BadRequestException('Category cannot be its own parent');
			}

			const parent = await this.db
				.select()
				.from(categories)
				.where(and(eq(categories.id, dto.parentCategoryId), eq(categories.userId, userId)))
				.limit(1);

			if (!parent.length) {
				throw new BadRequestException('Parent category not found');
			}
		}

		const [category] = await this.db
			.update(categories)
			.set({
				name: dto.name ?? existing[0].name,
				icon: dto.icon ?? existing[0].icon,
				color: dto.color ?? existing[0].color,
				parentCategoryId: dto.parentCategoryId ?? existing[0].parentCategoryId,
			})
			.where(eq(categories.id, id))
			.returning();

		return category;
	}

	async delete(userId: string, id: string) {
		const existing = await this.db
			.select()
			.from(categories)
			.where(and(eq(categories.id, id), eq(categories.userId, userId)))
			.limit(1);

		if (!existing.length) {
			throw new NotFoundException('Category not found');
		}

		await this.db
			.update(categories)
			.set({ parentCategoryId: null })
			.where(eq(categories.parentCategoryId, id));
		await this.db.update(items).set({ categoryId: null }).where(eq(items.categoryId, id));
		await this.db.delete(categories).where(eq(categories.id, id));

		return { success: true };
	}

	private buildTree(allCategories: (typeof categories.$inferSelect)[]): CategoryWithChildren[] {
		const map = new Map<string, CategoryWithChildren>();
		const roots: CategoryWithChildren[] = [];

		for (const cat of allCategories) {
			map.set(cat.id, { ...cat, children: [] });
		}

		for (const cat of allCategories) {
			const node = map.get(cat.id)!;
			if (cat.parentCategoryId) {
				const parent = map.get(cat.parentCategoryId);
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
