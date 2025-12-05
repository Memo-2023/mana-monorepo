import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, gte, lte, like, or, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION, type Database } from '../db/connection';
import { transactions, accounts, categories } from '../db/schema';
import { AccountService } from '../account/account.service';
import { CreateTransactionDto, UpdateTransactionDto, QueryTransactionDto } from './dto';

@Injectable()
export class TransactionService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private accountService: AccountService
	) {}

	async findAll(userId: string, query: QueryTransactionDto) {
		const conditions = [eq(transactions.userId, userId)];

		if (query.accountId) {
			conditions.push(eq(transactions.accountId, query.accountId));
		}

		if (query.categoryId) {
			conditions.push(eq(transactions.categoryId, query.categoryId));
		}

		if (query.type) {
			conditions.push(eq(transactions.type, query.type));
		}

		if (query.startDate) {
			conditions.push(gte(transactions.date, query.startDate));
		}

		if (query.endDate) {
			conditions.push(lte(transactions.date, query.endDate));
		}

		if (query.minAmount !== undefined) {
			conditions.push(gte(transactions.amount, query.minAmount.toString()));
		}

		if (query.maxAmount !== undefined) {
			conditions.push(lte(transactions.amount, query.maxAmount.toString()));
		}

		if (query.search) {
			const searchTerm = `%${query.search}%`;
			conditions.push(
				or(like(transactions.description, searchTerm), like(transactions.payee, searchTerm))!
			);
		}

		if (query.isPending !== undefined) {
			conditions.push(eq(transactions.isPending, query.isPending));
		}

		if (query.isRecurring !== undefined) {
			conditions.push(eq(transactions.isRecurring, query.isRecurring));
		}

		const limit = query.limit ?? 50;
		const offset = query.offset ?? 0;

		const result = await this.db
			.select({
				transaction: transactions,
				account: {
					id: accounts.id,
					name: accounts.name,
					type: accounts.type,
					currency: accounts.currency,
					color: accounts.color,
				},
				category: {
					id: categories.id,
					name: categories.name,
					type: categories.type,
					color: categories.color,
					icon: categories.icon,
				},
			})
			.from(transactions)
			.leftJoin(accounts, eq(transactions.accountId, accounts.id))
			.leftJoin(categories, eq(transactions.categoryId, categories.id))
			.where(and(...conditions))
			.orderBy(desc(transactions.date), desc(transactions.createdAt))
			.limit(limit)
			.offset(offset);

		// Get total count for pagination
		const [{ count }] = await this.db
			.select({ count: sql<number>`COUNT(*)` })
			.from(transactions)
			.where(and(...conditions));

		return {
			data: result.map((r) => ({
				...r.transaction,
				account: r.account,
				category: r.category,
			})),
			total: Number(count),
			limit,
			offset,
		};
	}

	async findOne(userId: string, id: string) {
		const [result] = await this.db
			.select({
				transaction: transactions,
				account: {
					id: accounts.id,
					name: accounts.name,
					type: accounts.type,
					currency: accounts.currency,
					color: accounts.color,
				},
				category: {
					id: categories.id,
					name: categories.name,
					type: categories.type,
					color: categories.color,
					icon: categories.icon,
				},
			})
			.from(transactions)
			.leftJoin(accounts, eq(transactions.accountId, accounts.id))
			.leftJoin(categories, eq(transactions.categoryId, categories.id))
			.where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

		if (!result) {
			throw new NotFoundException(`Transaction with ID ${id} not found`);
		}

		return {
			...result.transaction,
			account: result.account,
			category: result.category,
		};
	}

	async findRecent(userId: string, limit = 10) {
		const result = await this.db
			.select({
				transaction: transactions,
				account: {
					id: accounts.id,
					name: accounts.name,
					type: accounts.type,
					currency: accounts.currency,
					color: accounts.color,
				},
				category: {
					id: categories.id,
					name: categories.name,
					type: categories.type,
					color: categories.color,
					icon: categories.icon,
				},
			})
			.from(transactions)
			.leftJoin(accounts, eq(transactions.accountId, accounts.id))
			.leftJoin(categories, eq(transactions.categoryId, categories.id))
			.where(eq(transactions.userId, userId))
			.orderBy(desc(transactions.date), desc(transactions.createdAt))
			.limit(limit);

		return result.map((r) => ({
			...r.transaction,
			account: r.account,
			category: r.category,
		}));
	}

	async create(userId: string, dto: CreateTransactionDto) {
		// Verify account ownership
		const account = await this.accountService.findOne(userId, dto.accountId);

		const [transaction] = await this.db
			.insert(transactions)
			.values({
				userId,
				accountId: dto.accountId,
				categoryId: dto.categoryId,
				type: dto.type,
				amount: dto.amount.toString(),
				currency: dto.currency ?? account.currency,
				date: dto.date,
				description: dto.description,
				payee: dto.payee,
				isRecurring: dto.isRecurring ?? false,
				recurrenceRule: dto.recurrenceRule,
				isPending: dto.isPending ?? false,
				tags: dto.tags ?? [],
			})
			.returning();

		// Update account balance
		const balanceChange = dto.type === 'income' ? dto.amount : -dto.amount;
		await this.accountService.updateBalance(userId, dto.accountId, balanceChange);

		return this.findOne(userId, transaction.id);
	}

	async update(userId: string, id: string, dto: UpdateTransactionDto) {
		// Get original transaction
		const original = await this.findOne(userId, id);

		// If amount or type changed, we need to adjust account balance
		const oldBalanceEffect =
			original.type === 'income' ? parseFloat(original.amount) : -parseFloat(original.amount);

		const [transaction] = await this.db
			.update(transactions)
			.set({
				...(dto.accountId !== undefined && { accountId: dto.accountId }),
				...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
				...(dto.type !== undefined && { type: dto.type }),
				...(dto.amount !== undefined && { amount: dto.amount.toString() }),
				...(dto.currency !== undefined && { currency: dto.currency }),
				...(dto.date !== undefined && { date: dto.date }),
				...(dto.description !== undefined && { description: dto.description }),
				...(dto.payee !== undefined && { payee: dto.payee }),
				...(dto.isRecurring !== undefined && { isRecurring: dto.isRecurring }),
				...(dto.recurrenceRule !== undefined && { recurrenceRule: dto.recurrenceRule }),
				...(dto.isPending !== undefined && { isPending: dto.isPending }),
				...(dto.tags !== undefined && { tags: dto.tags }),
				updatedAt: new Date(),
			})
			.where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
			.returning();

		// Calculate new balance effect
		const newType = dto.type ?? original.type;
		const newAmount = dto.amount ?? parseFloat(original.amount);
		const newBalanceEffect = newType === 'income' ? newAmount : -newAmount;
		const newAccountId = dto.accountId ?? original.accountId!;

		// If account changed, adjust both accounts
		if (dto.accountId && dto.accountId !== original.accountId) {
			// Reverse on old account
			await this.accountService.updateBalance(userId, original.accountId!, -oldBalanceEffect);
			// Apply to new account
			await this.accountService.updateBalance(userId, dto.accountId, newBalanceEffect);
		} else if (dto.amount !== undefined || dto.type !== undefined) {
			// Same account, but amount or type changed
			const balanceDiff = newBalanceEffect - oldBalanceEffect;
			await this.accountService.updateBalance(userId, newAccountId, balanceDiff);
		}

		return this.findOne(userId, transaction.id);
	}

	async delete(userId: string, id: string) {
		// Get transaction to reverse balance
		const transaction = await this.findOne(userId, id);
		const balanceEffect =
			transaction.type === 'income'
				? parseFloat(transaction.amount)
				: -parseFloat(transaction.amount);

		await this.db
			.delete(transactions)
			.where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

		// Reverse balance effect
		await this.accountService.updateBalance(userId, transaction.accountId!, -balanceEffect);

		return { success: true };
	}

	async getSummary(userId: string, startDate: string, endDate: string) {
		const result = await this.db
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

		const income = result.find((r) => r.type === 'income');
		const expense = result.find((r) => r.type === 'expense');

		return {
			income: parseFloat(income?.total ?? '0'),
			expense: parseFloat(expense?.total ?? '0'),
			net: parseFloat(income?.total ?? '0') - parseFloat(expense?.total ?? '0'),
			incomeCount: Number(income?.count ?? 0),
			expenseCount: Number(expense?.count ?? 0),
		};
	}
}
