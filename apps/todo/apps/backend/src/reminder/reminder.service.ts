import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, asc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { reminders, type Reminder, type NewReminder } from '../db/schema';
import { TaskService } from '../task/task.service';
import { CreateReminderDto } from './dto';

@Injectable()
export class ReminderService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private taskService: TaskService
	) {}

	async findByTask(taskId: string, userId: string): Promise<Reminder[]> {
		// Verify task belongs to user
		await this.taskService.findByIdOrThrow(taskId, userId);

		return this.db.query.reminders.findMany({
			where: and(eq(reminders.taskId, taskId), eq(reminders.userId, userId)),
			orderBy: [asc(reminders.minutesBefore)],
		});
	}

	async findById(id: string, userId: string): Promise<Reminder | null> {
		const result = await this.db.query.reminders.findFirst({
			where: and(eq(reminders.id, id), eq(reminders.userId, userId)),
		});
		return result ?? null;
	}

	async findByIdOrThrow(id: string, userId: string): Promise<Reminder> {
		const reminder = await this.findById(id, userId);
		if (!reminder) {
			throw new NotFoundException(`Reminder with id ${id} not found`);
		}
		return reminder;
	}

	async create(taskId: string, userId: string, dto: CreateReminderDto): Promise<Reminder> {
		// Verify task belongs to user and get due date
		const task = await this.taskService.findByIdOrThrow(taskId, userId);

		if (!task.dueDate) {
			throw new BadRequestException('Cannot create reminder for task without due date');
		}

		// Calculate reminder time
		const dueDate = new Date(task.dueDate);
		const reminderTime = new Date(dueDate.getTime() - dto.minutesBefore * 60 * 1000);

		const newReminder: NewReminder = {
			taskId,
			userId,
			minutesBefore: dto.minutesBefore,
			reminderTime,
			type: dto.type ?? 'push',
		};

		const [created] = await this.db.insert(reminders).values(newReminder).returning();
		return created;
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.findByIdOrThrow(id, userId);
		await this.db.delete(reminders).where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
	}

	async deleteByTask(taskId: string, userId: string): Promise<void> {
		await this.db
			.delete(reminders)
			.where(and(eq(reminders.taskId, taskId), eq(reminders.userId, userId)));
	}
}
