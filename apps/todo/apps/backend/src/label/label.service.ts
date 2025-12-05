import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, asc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { labels, type Label, type NewLabel } from '../db/schema';
import { CreateLabelDto, UpdateLabelDto } from './dto';

@Injectable()
export class LabelService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string): Promise<Label[]> {
		return this.db.query.labels.findMany({
			where: eq(labels.userId, userId),
			orderBy: [asc(labels.name)],
		});
	}

	async findById(id: string, userId: string): Promise<Label | null> {
		const result = await this.db.query.labels.findFirst({
			where: and(eq(labels.id, id), eq(labels.userId, userId)),
		});
		return result ?? null;
	}

	async findByIdOrThrow(id: string, userId: string): Promise<Label> {
		const label = await this.findById(id, userId);
		if (!label) {
			throw new NotFoundException(`Label with id ${id} not found`);
		}
		return label;
	}

	async create(userId: string, dto: CreateLabelDto): Promise<Label> {
		const newLabel: NewLabel = {
			userId,
			name: dto.name,
			color: dto.color ?? '#6B7280',
		};

		const [created] = await this.db.insert(labels).values(newLabel).returning();
		return created;
	}

	async update(id: string, userId: string, dto: UpdateLabelDto): Promise<Label> {
		await this.findByIdOrThrow(id, userId);

		const [updated] = await this.db
			.update(labels)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(and(eq(labels.id, id), eq(labels.userId, userId)))
			.returning();

		return updated;
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.findByIdOrThrow(id, userId);
		await this.db.delete(labels).where(and(eq(labels.id, id), eq(labels.userId, userId)));
	}
}
