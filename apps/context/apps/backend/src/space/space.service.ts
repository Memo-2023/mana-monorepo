import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { spaces } from '../db/schema/spaces.schema';
import type { Space, NewSpace } from '../db/schema/spaces.schema';

@Injectable()
export class SpaceService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string): Promise<Space[]> {
		return this.db.select().from(spaces).where(eq(spaces.userId, userId)).orderBy(spaces.createdAt);
	}

	async findById(id: string, userId: string): Promise<Space | null> {
		const result = await this.db
			.select()
			.from(spaces)
			.where(and(eq(spaces.id, id), eq(spaces.userId, userId)));
		return result[0] || null;
	}

	async findByIdOrThrow(id: string, userId: string): Promise<Space> {
		const space = await this.findById(id, userId);
		if (!space) {
			throw new NotFoundException(`Space with id ${id} not found`);
		}
		return space;
	}

	async create(
		userId: string,
		data: { name: string; description?: string; pinned?: boolean; prefix?: string }
	): Promise<Space> {
		const newSpace: NewSpace = {
			userId,
			name: data.name,
			description: data.description || null,
			pinned: data.pinned ?? true,
			prefix: data.prefix,
		};

		const [created] = await this.db.insert(spaces).values(newSpace).returning();
		return created;
	}

	async update(id: string, userId: string, data: Partial<Space>): Promise<Space> {
		await this.findByIdOrThrow(id, userId);

		const [updated] = await this.db
			.update(spaces)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(and(eq(spaces.id, id), eq(spaces.userId, userId)))
			.returning();

		return updated;
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.findByIdOrThrow(id, userId);
		await this.db.delete(spaces).where(and(eq(spaces.id, id), eq(spaces.userId, userId)));
	}

	async incrementDocCounter(
		spaceId: string,
		type: 'text' | 'context' | 'prompt'
	): Promise<{ counter: number; prefix: string | null }> {
		const space = await this.db.select().from(spaces).where(eq(spaces.id, spaceId));
		if (!space[0]) return { counter: 0, prefix: null };

		const s = space[0];
		let counter = 0;
		const updateData: Record<string, unknown> = { updatedAt: new Date() };

		if (type === 'text') {
			counter = (s.textDocCounter || 0) + 1;
			updateData.textDocCounter = counter;
		} else if (type === 'context') {
			counter = (s.contextDocCounter || 0) + 1;
			updateData.contextDocCounter = counter;
		} else if (type === 'prompt') {
			counter = (s.promptDocCounter || 0) + 1;
			updateData.promptDocCounter = counter;
		}

		await this.db.update(spaces).set(updateData).where(eq(spaces.id, spaceId));

		return { counter, prefix: s.prefix };
	}
}
