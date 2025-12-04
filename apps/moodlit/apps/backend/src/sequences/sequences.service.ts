import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { sequences, type Sequence, type NewSequence } from '../db/schema/sequences.schema';
import { CreateSequenceDto, UpdateSequenceDto } from './dto';

@Injectable()
export class SequencesService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAllByUser(userId: string): Promise<Sequence[]> {
		return this.db.select().from(sequences).where(eq(sequences.userId, userId));
	}

	async findOne(id: string, userId: string): Promise<Sequence> {
		const [sequence] = await this.db
			.select()
			.from(sequences)
			.where(and(eq(sequences.id, id), eq(sequences.userId, userId)));

		if (!sequence) {
			throw new NotFoundException(`Sequence with ID ${id} not found`);
		}

		return sequence;
	}

	async create(userId: string, dto: CreateSequenceDto): Promise<Sequence> {
		const newSequence: NewSequence = {
			userId,
			name: dto.name,
			moodIds: dto.moodIds,
			duration: dto.duration ?? 30,
		};

		const [sequence] = await this.db.insert(sequences).values(newSequence).returning();
		return sequence;
	}

	async update(id: string, userId: string, dto: UpdateSequenceDto): Promise<Sequence> {
		// Verify the sequence exists and belongs to the user
		await this.findOne(id, userId);

		const [updated] = await this.db
			.update(sequences)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(and(eq(sequences.id, id), eq(sequences.userId, userId)))
			.returning();

		return updated;
	}

	async delete(id: string, userId: string): Promise<void> {
		// Verify the sequence exists and belongs to the user
		await this.findOne(id, userId);

		await this.db.delete(sequences).where(and(eq(sequences.id, id), eq(sequences.userId, userId)));
	}
}
