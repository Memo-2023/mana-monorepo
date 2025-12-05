import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, asc, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION, type Database } from '../db/connection';
import { accounts } from '../db/schema';
import { CreateAccountDto, UpdateAccountDto } from './dto';

@Injectable()
export class AccountService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string) {
		return this.db
			.select()
			.from(accounts)
			.where(and(eq(accounts.userId, userId), eq(accounts.isArchived, false)))
			.orderBy(asc(accounts.order), asc(accounts.createdAt));
	}

	async findAllIncludingArchived(userId: string) {
		return this.db
			.select()
			.from(accounts)
			.where(eq(accounts.userId, userId))
			.orderBy(asc(accounts.order), asc(accounts.createdAt));
	}

	async findOne(userId: string, id: string) {
		const [account] = await this.db
			.select()
			.from(accounts)
			.where(and(eq(accounts.id, id), eq(accounts.userId, userId)));

		if (!account) {
			throw new NotFoundException(`Account with ID ${id} not found`);
		}

		return account;
	}

	async create(userId: string, dto: CreateAccountDto) {
		// Get the highest order value
		const [maxOrder] = await this.db
			.select({ maxOrder: sql<number>`COALESCE(MAX(${accounts.order}), 0)` })
			.from(accounts)
			.where(eq(accounts.userId, userId));

		const [account] = await this.db
			.insert(accounts)
			.values({
				userId,
				name: dto.name,
				type: dto.type,
				balance: dto.balance?.toString() ?? '0',
				currency: dto.currency ?? 'EUR',
				color: dto.color,
				icon: dto.icon,
				includeInTotal: dto.includeInTotal ?? true,
				order: (maxOrder?.maxOrder ?? 0) + 1,
			})
			.returning();

		return account;
	}

	async update(userId: string, id: string, dto: UpdateAccountDto) {
		// Verify ownership
		await this.findOne(userId, id);

		const [account] = await this.db
			.update(accounts)
			.set({
				...(dto.name !== undefined && { name: dto.name }),
				...(dto.type !== undefined && { type: dto.type }),
				...(dto.balance !== undefined && { balance: dto.balance.toString() }),
				...(dto.currency !== undefined && { currency: dto.currency }),
				...(dto.color !== undefined && { color: dto.color }),
				...(dto.icon !== undefined && { icon: dto.icon }),
				...(dto.includeInTotal !== undefined && { includeInTotal: dto.includeInTotal }),
				...(dto.isArchived !== undefined && { isArchived: dto.isArchived }),
				...(dto.order !== undefined && { order: dto.order }),
				updatedAt: new Date(),
			})
			.where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
			.returning();

		return account;
	}

	async delete(userId: string, id: string) {
		// Verify ownership
		await this.findOne(userId, id);

		await this.db.delete(accounts).where(and(eq(accounts.id, id), eq(accounts.userId, userId)));

		return { success: true };
	}

	async archive(userId: string, id: string, archive = true) {
		return this.update(userId, id, { isArchived: archive });
	}

	async getTotals(userId: string) {
		const result = await this.db
			.select({
				currency: accounts.currency,
				total: sql<string>`SUM(${accounts.balance})`,
				count: sql<number>`COUNT(*)`,
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

		return result.map((r) => ({
			currency: r.currency,
			total: parseFloat(r.total ?? '0'),
			count: Number(r.count),
		}));
	}

	async reorder(userId: string, accountIds: string[]) {
		// Update order for each account
		await Promise.all(
			accountIds.map((id, index) =>
				this.db
					.update(accounts)
					.set({ order: index + 1 })
					.where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
			)
		);

		return this.findAll(userId);
	}

	async updateBalance(userId: string, id: string, amount: number) {
		const account = await this.findOne(userId, id);
		const newBalance = parseFloat(account.balance) + amount;

		const [updated] = await this.db
			.update(accounts)
			.set({
				balance: newBalance.toString(),
				updatedAt: new Date(),
			})
			.where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
			.returning();

		return updated;
	}
}
