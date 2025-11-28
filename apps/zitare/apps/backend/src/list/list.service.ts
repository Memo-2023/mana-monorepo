import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { userLists, type UserList, type NewUserList } from '../db/schema';

@Injectable()
export class ListService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByUserId(userId: string): Promise<UserList[]> {
		return this.db.select().from(userLists).where(eq(userLists.userId, userId));
	}

	async findById(userId: string, listId: string): Promise<UserList> {
		const [list] = await this.db
			.select()
			.from(userLists)
			.where(and(eq(userLists.id, listId), eq(userLists.userId, userId)));

		if (!list) {
			throw new NotFoundException('List not found');
		}
		return list;
	}

	async create(data: NewUserList): Promise<UserList> {
		const [list] = await this.db.insert(userLists).values(data).returning();
		return list;
	}

	async update(
		userId: string,
		listId: string,
		data: Partial<Pick<UserList, 'name' | 'description' | 'quoteIds'>>
	): Promise<UserList> {
		const [list] = await this.db
			.update(userLists)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(userLists.id, listId), eq(userLists.userId, userId)))
			.returning();

		if (!list) {
			throw new NotFoundException('List not found');
		}
		return list;
	}

	async delete(userId: string, listId: string): Promise<void> {
		const result = await this.db
			.delete(userLists)
			.where(and(eq(userLists.id, listId), eq(userLists.userId, userId)));

		if (!result) {
			throw new NotFoundException('List not found');
		}
	}

	async addQuoteToList(userId: string, listId: string, quoteId: string): Promise<UserList> {
		const list = await this.findById(userId, listId);
		const quoteIds = list.quoteIds || [];

		if (!quoteIds.includes(quoteId)) {
			quoteIds.push(quoteId);
		}

		return this.update(userId, listId, { quoteIds });
	}

	async removeQuoteFromList(userId: string, listId: string, quoteId: string): Promise<UserList> {
		const list = await this.findById(userId, listId);
		const quoteIds = (list.quoteIds || []).filter((id) => id !== quoteId);
		return this.update(userId, listId, { quoteIds });
	}
}
