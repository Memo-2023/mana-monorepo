import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, asc, isNull } from 'drizzle-orm';
import { DATABASE_CONNECTION, type Database } from '../db/connection';
import { categories } from '../db/schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

// Default categories to seed
const DEFAULT_CATEGORIES = {
	expense: [
		{ name: 'Lebensmittel', color: '#22c55e', icon: 'shopping-cart' },
		{ name: 'Restaurant', color: '#f97316', icon: 'utensils' },
		{ name: 'Transport', color: '#3b82f6', icon: 'car' },
		{ name: 'Wohnen', color: '#a855f7', icon: 'home' },
		{ name: 'Versicherungen', color: '#6b7280', icon: 'shield' },
		{ name: 'Gesundheit', color: '#ef4444', icon: 'heart' },
		{ name: 'Unterhaltung', color: '#ec4899', icon: 'film' },
		{ name: 'Shopping', color: '#eab308', icon: 'shopping-bag' },
		{ name: 'Bildung', color: '#6366f1', icon: 'book' },
		{ name: 'Reisen', color: '#06b6d4', icon: 'plane' },
		{ name: 'Abonnements', color: '#8b5cf6', icon: 'credit-card' },
		{ name: 'Sonstiges', color: '#9ca3af', icon: 'more-horizontal' },
	],
	income: [
		{ name: 'Gehalt', color: '#22c55e', icon: 'briefcase' },
		{ name: 'Nebeneinkommen', color: '#3b82f6', icon: 'trending-up' },
		{ name: 'Investitionen', color: '#a855f7', icon: 'bar-chart' },
		{ name: 'Geschenke', color: '#ec4899', icon: 'gift' },
		{ name: 'Sonstiges', color: '#9ca3af', icon: 'more-horizontal' },
	],
};

@Injectable()
export class CategoryService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string, type?: 'income' | 'expense') {
		const conditions = [eq(categories.userId, userId), eq(categories.isArchived, false)];

		if (type) {
			conditions.push(eq(categories.type, type));
		}

		return this.db
			.select()
			.from(categories)
			.where(and(...conditions))
			.orderBy(asc(categories.name));
	}

	async findAllIncludingArchived(userId: string) {
		return this.db
			.select()
			.from(categories)
			.where(eq(categories.userId, userId))
			.orderBy(asc(categories.name));
	}

	async findOne(userId: string, id: string) {
		const [category] = await this.db
			.select()
			.from(categories)
			.where(and(eq(categories.id, id), eq(categories.userId, userId)));

		if (!category) {
			throw new NotFoundException(`Category with ID ${id} not found`);
		}

		return category;
	}

	async create(userId: string, dto: CreateCategoryDto) {
		const [category] = await this.db
			.insert(categories)
			.values({
				userId,
				name: dto.name,
				type: dto.type,
				parentId: dto.parentId,
				color: dto.color,
				icon: dto.icon,
				isSystem: false,
			})
			.returning();

		return category;
	}

	async update(userId: string, id: string, dto: UpdateCategoryDto) {
		// Verify ownership
		await this.findOne(userId, id);

		const [category] = await this.db
			.update(categories)
			.set({
				...(dto.name !== undefined && { name: dto.name }),
				...(dto.type !== undefined && { type: dto.type }),
				...(dto.parentId !== undefined && { parentId: dto.parentId }),
				...(dto.color !== undefined && { color: dto.color }),
				...(dto.icon !== undefined && { icon: dto.icon }),
				...(dto.isArchived !== undefined && { isArchived: dto.isArchived }),
				updatedAt: new Date(),
			})
			.where(and(eq(categories.id, id), eq(categories.userId, userId)))
			.returning();

		return category;
	}

	async delete(userId: string, id: string) {
		// Verify ownership
		const category = await this.findOne(userId, id);

		// Don't allow deleting system categories
		if (category.isSystem) {
			throw new Error('Cannot delete system categories');
		}

		await this.db
			.delete(categories)
			.where(and(eq(categories.id, id), eq(categories.userId, userId)));

		return { success: true };
	}

	async seed(userId: string) {
		// Check if user already has categories
		const existing = await this.db
			.select()
			.from(categories)
			.where(eq(categories.userId, userId))
			.limit(1);

		if (existing.length > 0) {
			return { message: 'Categories already exist', seeded: false };
		}

		const categoriesToInsert = [
			...DEFAULT_CATEGORIES.expense.map((c) => ({
				userId,
				name: c.name,
				type: 'expense' as const,
				color: c.color,
				icon: c.icon,
				isSystem: true,
			})),
			...DEFAULT_CATEGORIES.income.map((c) => ({
				userId,
				name: c.name,
				type: 'income' as const,
				color: c.color,
				icon: c.icon,
				isSystem: true,
			})),
		];

		await this.db.insert(categories).values(categoriesToInsert);

		return { message: 'Categories seeded', seeded: true, count: categoriesToInsert.length };
	}

	async getTree(userId: string) {
		const allCategories = await this.findAll(userId);

		// Build tree structure
		const rootCategories = allCategories.filter((c) => !c.parentId);
		const childCategories = allCategories.filter((c) => c.parentId);

		return rootCategories.map((parent) => ({
			...parent,
			children: childCategories.filter((c) => c.parentId === parent.id),
		}));
	}
}
