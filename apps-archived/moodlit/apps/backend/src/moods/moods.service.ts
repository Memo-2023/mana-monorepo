import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { moods, type Mood, type NewMood } from '../db/schema/moods.schema';
import { CreateMoodDto, UpdateMoodDto } from './dto';

@Injectable()
export class MoodsService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAllByUser(userId: string): Promise<Mood[]> {
		return this.db.select().from(moods).where(eq(moods.userId, userId));
	}

	async findOne(id: string, userId: string): Promise<Mood> {
		const [mood] = await this.db
			.select()
			.from(moods)
			.where(and(eq(moods.id, id), eq(moods.userId, userId)));

		if (!mood) {
			throw new NotFoundException(`Mood with ID ${id} not found`);
		}

		return mood;
	}

	async create(userId: string, dto: CreateMoodDto): Promise<Mood> {
		const newMood: NewMood = {
			userId,
			name: dto.name,
			colors: dto.colors,
			animation: dto.animation,
			isDefault: dto.isDefault ?? false,
		};

		const [mood] = await this.db.insert(moods).values(newMood).returning();
		return mood;
	}

	async update(id: string, userId: string, dto: UpdateMoodDto): Promise<Mood> {
		// Verify the mood exists and belongs to the user
		await this.findOne(id, userId);

		const [updated] = await this.db
			.update(moods)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(and(eq(moods.id, id), eq(moods.userId, userId)))
			.returning();

		return updated;
	}

	async delete(id: string, userId: string): Promise<void> {
		// Verify the mood exists and belongs to the user
		await this.findOne(id, userId);

		await this.db.delete(moods).where(and(eq(moods.id, id), eq(moods.userId, userId)));
	}
}
