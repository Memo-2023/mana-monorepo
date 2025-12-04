import { Injectable, Inject, Logger } from '@nestjs/common';
import { DATABASE_TOKEN } from '../database.module';
import type { Database } from '../database.module';
import { links, eq, and, desc, sql, or, ilike } from '@manacore/uload-database';
import type { Link, NewLink } from '@manacore/uload-database';

export interface ListLinksOptions {
	page?: number;
	limit?: number;
	search?: string;
	isActive?: boolean;
}

@Injectable()
export class LinkRepository {
	private readonly logger = new Logger(LinkRepository.name);

	constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

	async findByShortCode(shortCode: string): Promise<Link | null> {
		const result = await this.db
			.select()
			.from(links)
			.where(eq(links.shortCode, shortCode))
			.limit(1);
		return result[0] || null;
	}

	async findById(id: string): Promise<Link | null> {
		const result = await this.db.select().from(links).where(eq(links.id, id)).limit(1);
		return result[0] || null;
	}

	async findByIdAndUserId(id: string, userId: string): Promise<Link | null> {
		const result = await this.db
			.select()
			.from(links)
			.where(and(eq(links.id, id), eq(links.userId, userId)))
			.limit(1);
		return result[0] || null;
	}

	async findByUserId(
		userId: string,
		options: ListLinksOptions = {}
	): Promise<{ items: Link[]; total: number }> {
		const { page = 1, limit = 20, search, isActive } = options;
		const offset = (page - 1) * limit;

		const conditions = [eq(links.userId, userId)];

		if (search) {
			conditions.push(
				or(
					ilike(links.title, `%${search}%`),
					ilike(links.originalUrl, `%${search}%`),
					ilike(links.shortCode, `%${search}%`)
				)!
			);
		}

		if (isActive !== undefined) {
			conditions.push(eq(links.isActive, isActive));
		}

		const [countResult, items] = await Promise.all([
			this.db
				.select({ count: sql<number>`count(*)::int` })
				.from(links)
				.where(and(...conditions)),
			this.db
				.select()
				.from(links)
				.where(and(...conditions))
				.orderBy(desc(links.createdAt))
				.limit(limit)
				.offset(offset),
		]);

		return {
			items,
			total: countResult[0]?.count || 0,
		};
	}

	async create(data: NewLink): Promise<Link> {
		this.logger.debug(`Creating link: ${data.shortCode}`);
		const result = await this.db.insert(links).values(data).returning();
		return result[0];
	}

	async update(
		id: string,
		userId: string,
		data: Partial<Omit<NewLink, 'id' | 'userId' | 'createdAt'>>
	): Promise<Link | null> {
		const result = await this.db
			.update(links)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(links.id, id), eq(links.userId, userId)))
			.returning();
		return result[0] || null;
	}

	async delete(id: string, userId: string): Promise<boolean> {
		const result = await this.db
			.delete(links)
			.where(and(eq(links.id, id), eq(links.userId, userId)))
			.returning({ id: links.id });
		return result.length > 0;
	}

	async incrementClickCount(id: string): Promise<void> {
		await this.db
			.update(links)
			.set({ clickCount: sql`${links.clickCount} + 1` })
			.where(eq(links.id, id));
	}

	async isShortCodeAvailable(shortCode: string): Promise<boolean> {
		const result = await this.db
			.select({ id: links.id })
			.from(links)
			.where(eq(links.shortCode, shortCode))
			.limit(1);
		return result.length === 0;
	}

	async countByUserId(userId: string): Promise<number> {
		const result = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(links)
			.where(eq(links.userId, userId));
		return result[0]?.count || 0;
	}
}
