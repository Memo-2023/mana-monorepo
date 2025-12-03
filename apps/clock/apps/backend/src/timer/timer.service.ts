import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { timers, type Timer } from '../db/schema';
import { CreateTimerDto, UpdateTimerDto } from './dto';

@Injectable()
export class TimerService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string): Promise<Timer[]> {
		return this.db.select().from(timers).where(eq(timers.userId, userId));
	}

	async findById(id: string, userId: string): Promise<Timer | null> {
		const result = await this.db
			.select()
			.from(timers)
			.where(and(eq(timers.id, id), eq(timers.userId, userId)))
			.limit(1);
		return result[0] || null;
	}

	async findByIdOrThrow(id: string, userId: string): Promise<Timer> {
		const timer = await this.findById(id, userId);
		if (!timer) {
			throw new NotFoundException(`Timer with id ${id} not found`);
		}
		return timer;
	}

	async create(userId: string, dto: CreateTimerDto): Promise<Timer> {
		const result = await this.db
			.insert(timers)
			.values({
				userId,
				label: dto.label,
				durationSeconds: dto.durationSeconds,
				remainingSeconds: dto.durationSeconds,
				status: 'idle',
				sound: dto.sound ?? 'default',
			})
			.returning();
		return result[0];
	}

	async update(id: string, userId: string, dto: UpdateTimerDto): Promise<Timer> {
		await this.findByIdOrThrow(id, userId);

		const result = await this.db
			.update(timers)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(and(eq(timers.id, id), eq(timers.userId, userId)))
			.returning();
		return result[0];
	}

	async start(id: string, userId: string): Promise<Timer> {
		const timer = await this.findByIdOrThrow(id, userId);

		if (timer.status === 'running') {
			throw new BadRequestException('Timer is already running');
		}

		const result = await this.db
			.update(timers)
			.set({
				status: 'running',
				startedAt: new Date(),
				pausedAt: null,
				updatedAt: new Date(),
			})
			.where(and(eq(timers.id, id), eq(timers.userId, userId)))
			.returning();
		return result[0];
	}

	async pause(id: string, userId: string): Promise<Timer> {
		const timer = await this.findByIdOrThrow(id, userId);

		if (timer.status !== 'running') {
			throw new BadRequestException('Timer is not running');
		}

		// Calculate remaining seconds
		const elapsed = timer.startedAt
			? Math.floor((Date.now() - timer.startedAt.getTime()) / 1000)
			: 0;
		const remaining = Math.max(0, (timer.remainingSeconds ?? timer.durationSeconds) - elapsed);

		const result = await this.db
			.update(timers)
			.set({
				status: 'paused',
				remainingSeconds: remaining,
				pausedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(and(eq(timers.id, id), eq(timers.userId, userId)))
			.returning();
		return result[0];
	}

	async reset(id: string, userId: string): Promise<Timer> {
		const timer = await this.findByIdOrThrow(id, userId);

		const result = await this.db
			.update(timers)
			.set({
				status: 'idle',
				remainingSeconds: timer.durationSeconds,
				startedAt: null,
				pausedAt: null,
				updatedAt: new Date(),
			})
			.where(and(eq(timers.id, id), eq(timers.userId, userId)))
			.returning();
		return result[0];
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.findByIdOrThrow(id, userId);
		await this.db.delete(timers).where(and(eq(timers.id, id), eq(timers.userId, userId)));
	}
}
