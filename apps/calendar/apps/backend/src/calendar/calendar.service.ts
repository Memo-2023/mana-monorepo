import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { calendars } from '../db/schema/calendars.schema';
import type { Calendar, NewCalendar } from '../db/schema/calendars.schema';
import { CreateCalendarDto, UpdateCalendarDto } from './dto';

@Injectable()
export class CalendarService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string): Promise<Calendar[]> {
		return this.db.select().from(calendars).where(eq(calendars.userId, userId));
	}

	async findById(id: string, userId: string): Promise<Calendar | null> {
		const result = await this.db
			.select()
			.from(calendars)
			.where(and(eq(calendars.id, id), eq(calendars.userId, userId)));
		return result[0] || null;
	}

	async findByIdOrThrow(id: string, userId: string): Promise<Calendar> {
		const calendar = await this.findById(id, userId);
		if (!calendar) {
			throw new NotFoundException(`Calendar with id ${id} not found`);
		}
		return calendar;
	}

	async create(userId: string, dto: CreateCalendarDto): Promise<Calendar> {
		// If this is the first calendar or marked as default, handle default logic
		if (dto.isDefault) {
			await this.clearDefaultCalendar(userId);
		}

		const newCalendar: NewCalendar = {
			userId,
			name: dto.name,
			description: dto.description,
			color: dto.color || '#3B82F6',
			isDefault: dto.isDefault ?? false,
			isVisible: dto.isVisible ?? true,
			timezone: dto.timezone || 'Europe/Berlin',
			settings: dto.settings,
		};

		const [created] = await this.db.insert(calendars).values(newCalendar).returning();
		return created;
	}

	async update(id: string, userId: string, dto: UpdateCalendarDto): Promise<Calendar> {
		await this.findByIdOrThrow(id, userId);

		// If setting as default, clear other defaults
		if (dto.isDefault) {
			await this.clearDefaultCalendar(userId);
		}

		const [updated] = await this.db
			.update(calendars)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(and(eq(calendars.id, id), eq(calendars.userId, userId)))
			.returning();

		return updated;
	}

	async delete(id: string, userId: string): Promise<void> {
		const calendar = await this.findByIdOrThrow(id, userId);

		// Don't allow deleting the default calendar if it's the only one
		if (calendar.isDefault) {
			const allCalendars = await this.findAll(userId);
			if (allCalendars.length === 1) {
				throw new Error('Cannot delete the only calendar');
			}
		}

		await this.db.delete(calendars).where(and(eq(calendars.id, id), eq(calendars.userId, userId)));
	}

	async getOrCreateDefaultCalendar(userId: string): Promise<Calendar> {
		// Try to find existing default calendar
		const existing = await this.db
			.select()
			.from(calendars)
			.where(and(eq(calendars.userId, userId), eq(calendars.isDefault, true)));

		if (existing.length > 0) {
			return existing[0];
		}

		// Try to find any calendar
		const anyCalendar = await this.db
			.select()
			.from(calendars)
			.where(eq(calendars.userId, userId))
			.limit(1);

		if (anyCalendar.length > 0) {
			// Make it the default — unique partial index prevents duplicates
			try {
				const [updated] = await this.db
					.update(calendars)
					.set({ isDefault: true, updatedAt: new Date() })
					.where(eq(calendars.id, anyCalendar[0].id))
					.returning();
				return updated;
			} catch (error: any) {
				// Unique constraint violation — another request already set a default
				if (error?.code === '23505') {
					const [defaultCal] = await this.db
						.select()
						.from(calendars)
						.where(and(eq(calendars.userId, userId), eq(calendars.isDefault, true)));
					return defaultCal;
				}
				throw error;
			}
		}

		// Create default calendars for new user — unique partial index prevents
		// concurrent requests from creating duplicate defaults
		try {
			await this.createDefaultCalendars(userId);
		} catch (error: any) {
			// Unique constraint violation — another request already created defaults
			if (error?.code === '23505') {
				const [defaultCal] = await this.db
					.select()
					.from(calendars)
					.where(and(eq(calendars.userId, userId), eq(calendars.isDefault, true)));
				if (defaultCal) {
					return defaultCal;
				}
			}
			throw error;
		}

		// Return the default one
		const defaultCal = await this.db
			.select()
			.from(calendars)
			.where(and(eq(calendars.userId, userId), eq(calendars.isDefault, true)));

		return defaultCal[0];
	}

	/**
	 * Create default calendars for a new user
	 */
	async createDefaultCalendars(userId: string): Promise<Calendar[]> {
		const defaultCalendars = [
			{
				name: 'Persönlich',
				color: '#3B82F6', // Blue
				isDefault: true,
				description: 'Private Termine',
			},
			{
				name: 'Beruf',
				color: '#10B981', // Green
				isDefault: false,
				description: 'Arbeit, Meetings, Projekte',
			},
			{
				name: 'Familie',
				color: '#F97316', // Orange
				isDefault: false,
				description: 'Familientermine, Geburtstage',
			},
			{
				name: 'Freizeit',
				color: '#8B5CF6', // Violet
				isDefault: false,
				description: 'Hobbies, Sport, Events',
			},
		];

		const created: Calendar[] = [];
		for (const cal of defaultCalendars) {
			const calendar = await this.create(userId, cal);
			created.push(calendar);
		}

		return created;
	}

	private async clearDefaultCalendar(userId: string): Promise<void> {
		await this.db
			.update(calendars)
			.set({ isDefault: false, updatedAt: new Date() })
			.where(and(eq(calendars.userId, userId), eq(calendars.isDefault, true)));
	}
}
