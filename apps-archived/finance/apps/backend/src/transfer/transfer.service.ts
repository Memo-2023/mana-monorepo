import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION, type Database } from '../db/connection';
import { transfers, accounts } from '../db/schema';
import { AccountService } from '../account/account.service';
import { CreateTransferDto, UpdateTransferDto } from './dto';

@Injectable()
export class TransferService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private accountService: AccountService
	) {}

	async findAll(userId: string) {
		const result = await this.db
			.select({
				transfer: transfers,
				fromAccount: {
					id: sql<string>`from_acc.id`,
					name: sql<string>`from_acc.name`,
					currency: sql<string>`from_acc.currency`,
					color: sql<string>`from_acc.color`,
				},
				toAccount: {
					id: sql<string>`to_acc.id`,
					name: sql<string>`to_acc.name`,
					currency: sql<string>`to_acc.currency`,
					color: sql<string>`to_acc.color`,
				},
			})
			.from(transfers)
			.innerJoin(sql`${accounts} as from_acc`, sql`${transfers.fromAccountId} = from_acc.id`)
			.innerJoin(sql`${accounts} as to_acc`, sql`${transfers.toAccountId} = to_acc.id`)
			.where(eq(transfers.userId, userId))
			.orderBy(desc(transfers.date), desc(transfers.createdAt));

		return result.map((r) => ({
			...r.transfer,
			fromAccount: r.fromAccount,
			toAccount: r.toAccount,
		}));
	}

	async findOne(userId: string, id: string) {
		const [result] = await this.db
			.select({
				transfer: transfers,
				fromAccount: {
					id: sql<string>`from_acc.id`,
					name: sql<string>`from_acc.name`,
					currency: sql<string>`from_acc.currency`,
					color: sql<string>`from_acc.color`,
				},
				toAccount: {
					id: sql<string>`to_acc.id`,
					name: sql<string>`to_acc.name`,
					currency: sql<string>`to_acc.currency`,
					color: sql<string>`to_acc.color`,
				},
			})
			.from(transfers)
			.innerJoin(sql`${accounts} as from_acc`, sql`${transfers.fromAccountId} = from_acc.id`)
			.innerJoin(sql`${accounts} as to_acc`, sql`${transfers.toAccountId} = to_acc.id`)
			.where(and(eq(transfers.id, id), eq(transfers.userId, userId)));

		if (!result) {
			throw new NotFoundException(`Transfer with ID ${id} not found`);
		}

		return {
			...result.transfer,
			fromAccount: result.fromAccount,
			toAccount: result.toAccount,
		};
	}

	async create(userId: string, dto: CreateTransferDto) {
		if (dto.fromAccountId === dto.toAccountId) {
			throw new BadRequestException('Cannot transfer to the same account');
		}

		// Verify both accounts belong to user
		await this.accountService.findOne(userId, dto.fromAccountId);
		await this.accountService.findOne(userId, dto.toAccountId);

		const [transfer] = await this.db
			.insert(transfers)
			.values({
				userId,
				fromAccountId: dto.fromAccountId,
				toAccountId: dto.toAccountId,
				amount: dto.amount.toString(),
				date: dto.date,
				description: dto.description,
			})
			.returning();

		// Update account balances
		await this.accountService.updateBalance(userId, dto.fromAccountId, -dto.amount);
		await this.accountService.updateBalance(userId, dto.toAccountId, dto.amount);

		return this.findOne(userId, transfer.id);
	}

	async update(userId: string, id: string, dto: UpdateTransferDto) {
		const original = await this.findOne(userId, id);
		const originalAmount = parseFloat(original.amount);

		// Verify new accounts if provided
		if (dto.fromAccountId) {
			await this.accountService.findOne(userId, dto.fromAccountId);
		}
		if (dto.toAccountId) {
			await this.accountService.findOne(userId, dto.toAccountId);
		}

		const newFromAccountId = dto.fromAccountId ?? original.fromAccountId;
		const newToAccountId = dto.toAccountId ?? original.toAccountId;

		if (newFromAccountId === newToAccountId) {
			throw new BadRequestException('Cannot transfer to the same account');
		}

		const [transfer] = await this.db
			.update(transfers)
			.set({
				...(dto.fromAccountId !== undefined && { fromAccountId: dto.fromAccountId }),
				...(dto.toAccountId !== undefined && { toAccountId: dto.toAccountId }),
				...(dto.amount !== undefined && { amount: dto.amount.toString() }),
				...(dto.date !== undefined && { date: dto.date }),
				...(dto.description !== undefined && { description: dto.description }),
				updatedAt: new Date(),
			})
			.where(and(eq(transfers.id, id), eq(transfers.userId, userId)))
			.returning();

		// Reverse original transfer
		await this.accountService.updateBalance(userId, original.fromAccountId, originalAmount);
		await this.accountService.updateBalance(userId, original.toAccountId, -originalAmount);

		// Apply new transfer
		const newAmount = dto.amount ?? originalAmount;
		await this.accountService.updateBalance(userId, newFromAccountId, -newAmount);
		await this.accountService.updateBalance(userId, newToAccountId, newAmount);

		return this.findOne(userId, transfer.id);
	}

	async delete(userId: string, id: string) {
		const transfer = await this.findOne(userId, id);
		const amount = parseFloat(transfer.amount);

		await this.db.delete(transfers).where(and(eq(transfers.id, id), eq(transfers.userId, userId)));

		// Reverse the transfer
		await this.accountService.updateBalance(userId, transfer.fromAccountId, amount);
		await this.accountService.updateBalance(userId, transfer.toAccountId, -amount);

		return { success: true };
	}
}
