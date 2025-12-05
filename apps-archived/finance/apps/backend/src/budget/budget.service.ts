import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { DATABASE_CONNECTION, type Database } from '../db/connection';
import { budgets, transactions, categories } from '../db/schema';
import { CreateBudgetDto, UpdateBudgetDto } from './dto';

@Injectable()
export class BudgetService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string) {
		return this.db
			.select({
				budget: budgets,
				category: {
					id: categories.id,
					name: categories.name,
					color: categories.color,
					icon: categories.icon,
				},
			})
			.from(budgets)
			.leftJoin(categories, eq(budgets.categoryId, categories.id))
			.where(eq(budgets.userId, userId));
	}

	async findOne(userId: string, id: string) {
		const [result] = await this.db
			.select({
				budget: budgets,
				category: {
					id: categories.id,
					name: categories.name,
					color: categories.color,
					icon: categories.icon,
				},
			})
			.from(budgets)
			.leftJoin(categories, eq(budgets.categoryId, categories.id))
			.where(and(eq(budgets.id, id), eq(budgets.userId, userId)));

		if (!result) {
			throw new NotFoundException(`Budget with ID ${id} not found`);
		}

		return {
			...result.budget,
			category: result.category,
		};
	}

	async findByMonth(userId: string, year: number, month: number) {
		// Get budgets for this month
		const monthBudgets = await this.db
			.select({
				budget: budgets,
				category: {
					id: categories.id,
					name: categories.name,
					color: categories.color,
					icon: categories.icon,
				},
			})
			.from(budgets)
			.leftJoin(categories, eq(budgets.categoryId, categories.id))
			.where(and(eq(budgets.userId, userId), eq(budgets.month, month), eq(budgets.year, year)));

		// Calculate spending for each budget
		const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
		const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

		const spending = await this.db
			.select({
				categoryId: transactions.categoryId,
				total: sql<string>`SUM(${transactions.amount})`,
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.userId, userId),
					eq(transactions.type, 'expense'),
					gte(transactions.date, startDate),
					lte(transactions.date, endDate)
				)
			)
			.groupBy(transactions.categoryId);

		const spendingMap = new Map(spending.map((s) => [s.categoryId, parseFloat(s.total ?? '0')]));

		// Calculate total spending for overall budget
		const [totalSpending] = await this.db
			.select({
				total: sql<string>`SUM(${transactions.amount})`,
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.userId, userId),
					eq(transactions.type, 'expense'),
					gte(transactions.date, startDate),
					lte(transactions.date, endDate)
				)
			);

		return monthBudgets.map((b) => ({
			...b.budget,
			category: b.category,
			spent: b.budget.categoryId
				? (spendingMap.get(b.budget.categoryId) ?? 0)
				: parseFloat(totalSpending?.total ?? '0'),
			remaining:
				parseFloat(b.budget.amount) -
				(b.budget.categoryId
					? (spendingMap.get(b.budget.categoryId) ?? 0)
					: parseFloat(totalSpending?.total ?? '0')),
			percentage:
				(b.budget.categoryId
					? (spendingMap.get(b.budget.categoryId) ?? 0)
					: parseFloat(totalSpending?.total ?? '0')) / parseFloat(b.budget.amount),
		}));
	}

	async create(userId: string, dto: CreateBudgetDto) {
		// Check if budget already exists for this category/month
		const existing = await this.db
			.select()
			.from(budgets)
			.where(
				and(
					eq(budgets.userId, userId),
					eq(budgets.month, dto.month),
					eq(budgets.year, dto.year),
					dto.categoryId
						? eq(budgets.categoryId, dto.categoryId)
						: sql`${budgets.categoryId} IS NULL`
				)
			);

		if (existing.length > 0) {
			// Update existing budget
			return this.update(userId, existing[0].id, {
				amount: dto.amount,
				alertThreshold: dto.alertThreshold,
				rolloverEnabled: dto.rolloverEnabled,
			});
		}

		const [budget] = await this.db
			.insert(budgets)
			.values({
				userId,
				categoryId: dto.categoryId,
				month: dto.month,
				year: dto.year,
				amount: dto.amount.toString(),
				alertThreshold: dto.alertThreshold?.toString() ?? '0.80',
				rolloverEnabled: dto.rolloverEnabled ?? false,
			})
			.returning();

		return budget;
	}

	async update(userId: string, id: string, dto: UpdateBudgetDto) {
		await this.findOne(userId, id);

		const [budget] = await this.db
			.update(budgets)
			.set({
				...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
				...(dto.amount !== undefined && { amount: dto.amount.toString() }),
				...(dto.alertThreshold !== undefined && { alertThreshold: dto.alertThreshold.toString() }),
				...(dto.rolloverEnabled !== undefined && { rolloverEnabled: dto.rolloverEnabled }),
				updatedAt: new Date(),
			})
			.where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
			.returning();

		return budget;
	}

	async delete(userId: string, id: string) {
		await this.findOne(userId, id);
		await this.db.delete(budgets).where(and(eq(budgets.id, id), eq(budgets.userId, userId)));
		return { success: true };
	}

	async copyFromPreviousMonth(userId: string, year: number, month: number) {
		// Calculate previous month
		const prevMonth = month === 1 ? 12 : month - 1;
		const prevYear = month === 1 ? year - 1 : year;

		// Get previous month budgets
		const prevBudgets = await this.db
			.select()
			.from(budgets)
			.where(
				and(eq(budgets.userId, userId), eq(budgets.month, prevMonth), eq(budgets.year, prevYear))
			);

		if (prevBudgets.length === 0) {
			return { message: 'No budgets found in previous month', copied: 0 };
		}

		// Create budgets for current month
		const newBudgets = prevBudgets.map((b) => ({
			userId,
			categoryId: b.categoryId,
			month,
			year,
			amount: b.amount,
			alertThreshold: b.alertThreshold,
			rolloverEnabled: b.rolloverEnabled,
		}));

		await this.db.insert(budgets).values(newBudgets).onConflictDoNothing();

		return { message: 'Budgets copied', copied: newBudgets.length };
	}
}
