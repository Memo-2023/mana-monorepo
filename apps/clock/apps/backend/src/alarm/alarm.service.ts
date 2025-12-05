import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { alarms, type Alarm } from '../db/schema';
import { CreateAlarmDto, UpdateAlarmDto } from './dto';

@Injectable()
export class AlarmService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string): Promise<Alarm[]> {
		return this.db.select().from(alarms).where(eq(alarms.userId, userId));
	}

	async findById(id: string, userId: string): Promise<Alarm | null> {
		const result = await this.db
			.select()
			.from(alarms)
			.where(and(eq(alarms.id, id), eq(alarms.userId, userId)))
			.limit(1);
		return result[0] || null;
	}

	async findByIdOrThrow(id: string, userId: string): Promise<Alarm> {
		const alarm = await this.findById(id, userId);
		if (!alarm) {
			throw new NotFoundException(`Alarm with id ${id} not found`);
		}
		return alarm;
	}

	async create(userId: string, dto: CreateAlarmDto): Promise<Alarm> {
		const result = await this.db
			.insert(alarms)
			.values({
				userId,
				label: dto.label,
				time: dto.time,
				enabled: dto.enabled ?? true,
				repeatDays: dto.repeatDays,
				snoozeMinutes: dto.snoozeMinutes ?? 5,
				sound: dto.sound ?? 'default',
				vibrate: dto.vibrate ?? true,
			})
			.returning();
		return result[0];
	}

	async update(id: string, userId: string, dto: UpdateAlarmDto): Promise<Alarm> {
		await this.findByIdOrThrow(id, userId);

		const result = await this.db
			.update(alarms)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(and(eq(alarms.id, id), eq(alarms.userId, userId)))
			.returning();
		return result[0];
	}

	async toggle(id: string, userId: string): Promise<Alarm> {
		const alarm = await this.findByIdOrThrow(id, userId);

		const result = await this.db
			.update(alarms)
			.set({
				enabled: !alarm.enabled,
				updatedAt: new Date(),
			})
			.where(and(eq(alarms.id, id), eq(alarms.userId, userId)))
			.returning();
		return result[0];
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.findByIdOrThrow(id, userId);
		await this.db.delete(alarms).where(and(eq(alarms.id, id), eq(alarms.userId, userId)));
	}
}
