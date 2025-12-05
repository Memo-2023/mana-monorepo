import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql, gte, lte, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION, type Database } from '../db/connection';
import { transactions, accounts, categories, budgets } from '../db/schema';

@Injectable()
export class ReportService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async getDashboard(userId: string) {
		const now = new Date();
		const year = now.getFullYear();
		const month = now.getMonth() + 1;

		// Current month range
		const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
		const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0];

		// Account totals
		const accountTotals = await this.db
			.select({
				currency: accounts.currency,
				total: sql<string>`SUM(${accounts.balance})`,
			})
			.from(accounts)
			.where(
				and(
					eq(accounts.userId, userId),
					eq(accounts.isArchived, false),
					eq(accounts.includeInTotal, true)
				)
			)
			.groupBy(accounts.currency);

		// Current month income/expense
		const monthlyTotals = await this.db
			.select({
				type: transactions.type,
				total: sql<string>`SUM(${transactions.amount})`,
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.userId, userId),
					gte(transactions.date, startOfMonth),
					lte(transactions.date, endOfMonth)
				)
			)
			.groupBy(transactions.type);

		const income = monthlyTotals.find((t) => t.type === 'income');
		const expense = monthlyTotals.find((t) => t.type === 'expense');

		// Budget progress
		const budgetProgress = await this.db
			.select({
				budget: budgets,
				category: {
					id: categories.id,
					name: categories.name,
					color: categories.color,
				},
			})
			.from(budgets)
			.leftJoin(categories, eq(budgets.categoryId, categories.id))
			.where(and(eq(budgets.userId, userId), eq(budgets.month, month), eq(budgets.year, year)));

		// Get spending per category
		const categorySpending = await this.db
			.select({
				categoryId: transactions.categoryId,
				total: sql<string>`SUM(${transactions.amount})`,
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.userId, userId),
					eq(transactions.type, 'expense'),
					gte(transactions.date, startOfMonth),
					lte(transactions.date, endOfMonth)
				)
			)
			.groupBy(transactions.categoryId);

		const spendingMap = new Map(
			categorySpending.map((s) => [s.categoryId, parseFloat(s.total ?? '0')])
		);

		// Recent transactions
		const recentTransactions = await this.db
			.select({
				transaction: transactions,
				category: {
					id: categories.id,
					name: categories.name,
					color: categories.color,
					icon: categories.icon,
				},
				account: {
					id: accounts.id,
					name: accounts.name,
					color: accounts.color,
				},
			})
			.from(transactions)
			.leftJoin(categories, eq(transactions.categoryId, categories.id))
			.leftJoin(accounts, eq(transactions.accountId, accounts.id))
			.where(eq(transactions.userId, userId))
			.orderBy(desc(transactions.date), desc(transactions.createdAt))
			.limit(5);

		return {
			totals: accountTotals.map((t) => ({
				currency: t.currency,
				amount: parseFloat(t.total ?? '0'),
			})),
			currentMonth: {
				year,
				month,
				income: parseFloat(income?.total ?? '0'),
				expense: parseFloat(expense?.total ?? '0'),
				net: parseFloat(income?.total ?? '0') - parseFloat(expense?.total ?? '0'),
			},
			budgets: budgetProgress.map((b) => ({
				id: b.budget.id,
				category: b.category,
				amount: parseFloat(b.budget.amount),
				spent: b.budget.categoryId
					? (spendingMap.get(b.budget.categoryId) ?? 0)
					: parseFloat(expense?.total ?? '0'),
				percentage:
					(b.budget.categoryId
						? (spendingMap.get(b.budget.categoryId) ?? 0)
						: parseFloat(expense?.total ?? '0')) / parseFloat(b.budget.amount),
			})),
			recentTransactions: recentTransactions.map((r) => ({
				...r.transaction,
				category: r.category,
				account: r.account,
			})),
		};
	}

	async getMonthlySummary(userId: string, year: number, month: number) {
		const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
		const endDate = new Date(year, month, 0).toISOString().split('T')[0];

		// Totals by type
		const totals = await this.db
			.select({
				type: transactions.type,
				total: sql<string>`SUM(${transactions.amount})`,
				count: sql<number>`COUNT(*)`,
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.userId, userId),
					gte(transactions.date, startDate),
					lte(transactions.date, endDate)
				)
			)
			.groupBy(transactions.type);

		// Daily breakdown
		const dailyBreakdown = await this.db
			.select({
				date: transactions.date,
				type: transactions.type,
				total: sql<string>`SUM(${transactions.amount})`,
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.userId, userId),
					gte(transactions.date, startDate),
					lte(transactions.date, endDate)
				)
			)
			.groupBy(transactions.date, transactions.type)
			.orderBy(transactions.date);

		// Top expenses
		const topExpenses = await this.db
			.select({
				transaction: transactions,
				category: {
					id: categories.id,
					name: categories.name,
					color: categories.color,
				},
			})
			.from(transactions)
			.leftJoin(categories, eq(transactions.categoryId, categories.id))
			.where(
				and(
					eq(transactions.userId, userId),
					eq(transactions.type, 'expense'),
					gte(transactions.date, startDate),
					lte(transactions.date, endDate)
				)
			)
			.orderBy(desc(transactions.amount))
			.limit(10);

		const income = totals.find((t) => t.type === 'income');
		const expense = totals.find((t) => t.type === 'expense');

		return {
			year,
			month,
			income: parseFloat(income?.total ?? '0'),
			expense: parseFloat(expense?.total ?? '0'),
			net: parseFloat(income?.total ?? '0') - parseFloat(expense?.total ?? '0'),
			incomeCount: Number(income?.count ?? 0),
			expenseCount: Number(expense?.count ?? 0),
			dailyBreakdown: dailyBreakdown.map((d) => ({
				date: d.date,
				type: d.type,
				amount: parseFloat(d.total ?? '0'),
			})),
			topExpenses: topExpenses.map((e) => ({
				...e.transaction,
				category: e.category,
			})),
		};
	}

	async getCategoryBreakdown(
		userId: string,
		startDate: string,
		endDate: string,
		type: 'income' | 'expense' = 'expense'
	) {
		const breakdown = await this.db
			.select({
				categoryId: transactions.categoryId,
				categoryName: categories.name,
				categoryColor: categories.color,
				categoryIcon: categories.icon,
				total: sql<string>`SUM(${transactions.amount})`,
				count: sql<number>`COUNT(*)`,
			})
			.from(transactions)
			.leftJoin(categories, eq(transactions.categoryId, categories.id))
			.where(
				and(
					eq(transactions.userId, userId),
					eq(transactions.type, type),
					gte(transactions.date, startDate),
					lte(transactions.date, endDate)
				)
			)
			.groupBy(transactions.categoryId, categories.name, categories.color, categories.icon)
			.orderBy(desc(sql`SUM(${transactions.amount})`));

		const total = breakdown.reduce((sum, b) => sum + parseFloat(b.total ?? '0'), 0);

		return {
			startDate,
			endDate,
			type,
			total,
			categories: breakdown.map((b) => ({
				categoryId: b.categoryId,
				name: b.categoryName ?? 'Uncategorized',
				color: b.categoryColor,
				icon: b.categoryIcon,
				amount: parseFloat(b.total ?? '0'),
				count: Number(b.count),
				percentage: total > 0 ? parseFloat(b.total ?? '0') / total : 0,
			})),
		};
	}

	async getTrends(userId: string, months = 6) {
		const trends = [];
		const now = new Date();

		for (let i = 0; i < months; i++) {
			const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const year = date.getFullYear();
			const month = date.getMonth() + 1;

			const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
			const endDate = new Date(year, month, 0).toISOString().split('T')[0];

			const totals = await this.db
				.select({
					type: transactions.type,
					total: sql<string>`SUM(${transactions.amount})`,
				})
				.from(transactions)
				.where(
					and(
						eq(transactions.userId, userId),
						gte(transactions.date, startDate),
						lte(transactions.date, endDate)
					)
				)
				.groupBy(transactions.type);

			const income = totals.find((t) => t.type === 'income');
			const expense = totals.find((t) => t.type === 'expense');

			trends.unshift({
				year,
				month,
				income: parseFloat(income?.total ?? '0'),
				expense: parseFloat(expense?.total ?? '0'),
				net: parseFloat(income?.total ?? '0') - parseFloat(expense?.total ?? '0'),
			});
		}

		return {
			months,
			data: trends,
			averages: {
				income: trends.reduce((sum, t) => sum + t.income, 0) / months,
				expense: trends.reduce((sum, t) => sum + t.expense, 0) / months,
				net: trends.reduce((sum, t) => sum + t.net, 0) / months,
			},
		};
	}

	async getCashFlow(userId: string, startDate: string, endDate: string) {
		// Get starting balance
		const startBalance = await this.db
			.select({
				total: sql<string>`SUM(${accounts.balance})`,
			})
			.from(accounts)
			.where(
				and(
					eq(accounts.userId, userId),
					eq(accounts.isArchived, false),
					eq(accounts.includeInTotal, true)
				)
			);

		// Get daily transactions
		const dailyFlow = await this.db
			.select({
				date: transactions.date,
				type: transactions.type,
				total: sql<string>`SUM(${transactions.amount})`,
			})
			.from(transactions)
			.where(
				and(
					eq(transactions.userId, userId),
					gte(transactions.date, startDate),
					lte(transactions.date, endDate)
				)
			)
			.groupBy(transactions.date, transactions.type)
			.orderBy(transactions.date);

		// Build cumulative cash flow
		let runningTotal = parseFloat(startBalance[0]?.total ?? '0');
		const cashFlow: { date: string; balance: number; income: number; expense: number }[] = [];

		// Group by date
		const byDate = new Map<string, { income: number; expense: number }>();
		dailyFlow.forEach((d) => {
			if (!byDate.has(d.date)) {
				byDate.set(d.date, { income: 0, expense: 0 });
			}
			const entry = byDate.get(d.date)!;
			if (d.type === 'income') {
				entry.income = parseFloat(d.total ?? '0');
			} else {
				entry.expense = parseFloat(d.total ?? '0');
			}
		});

		// Convert to array with running balance
		byDate.forEach((value, date) => {
			runningTotal += value.income - value.expense;
			cashFlow.push({
				date,
				balance: runningTotal,
				income: value.income,
				expense: value.expense,
			});
		});

		return {
			startDate,
			endDate,
			startingBalance: parseFloat(startBalance[0]?.total ?? '0'),
			endingBalance: runningTotal,
			data: cashFlow,
		};
	}
}
