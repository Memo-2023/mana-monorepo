import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { eq, and, gte, lte, inArray, or, ilike } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { events, Event, NewEvent } from '../db/schema/events.schema';
import { calendars } from '../db/schema/calendars.schema';
import { CalendarService } from '../calendar/calendar.service';
import { EventTagService } from '../event-tag/event-tag.service';
import { CreateEventDto, UpdateEventDto, QueryEventsDto } from './dto';

@Injectable()
export class EventService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private calendarService: CalendarService,
		private eventTagService: EventTagService
	) {}

	async queryEvents(userId: string, query: QueryEventsDto): Promise<Event[]> {
		const conditions = [eq(events.userId, userId)];

		// Date range filter
		if (query.startDate) {
			conditions.push(gte(events.endTime, new Date(query.startDate)));
		}
		if (query.endDate) {
			conditions.push(lte(events.startTime, new Date(query.endDate)));
		}

		// Calendar filter
		if (query.calendarIds && query.calendarIds.length > 0) {
			conditions.push(inArray(events.calendarId, query.calendarIds));
		}

		// Exclude cancelled unless requested
		if (!query.includeCancelled) {
			conditions.push(or(eq(events.status, 'confirmed'), eq(events.status, 'tentative')) as any);
		}

		// Search filter
		if (query.search) {
			conditions.push(
				or(
					ilike(events.title, `%${query.search}%`),
					ilike(events.description, `%${query.search}%`)
				) as any
			);
		}

		const qb = this.db
			.select()
			.from(events)
			.where(and(...conditions))
			.orderBy(events.startTime);

		if (query.limit) {
			qb.limit(query.limit);
		}
		if (query.offset) {
			qb.offset(query.offset);
		}

		return qb;
	}

	async findById(id: string, userId: string): Promise<Event | null> {
		const result = await this.db
			.select()
			.from(events)
			.where(and(eq(events.id, id), eq(events.userId, userId)));
		return result[0] || null;
	}

	async findByIdOrThrow(id: string, userId: string): Promise<Event> {
		const event = await this.findById(id, userId);
		if (!event) {
			throw new NotFoundException(`Event with id ${id} not found`);
		}
		return event;
	}

	async findByCalendar(
		calendarId: string,
		userId: string,
		query: QueryEventsDto
	): Promise<Event[]> {
		// Verify user owns the calendar
		await this.calendarService.findByIdOrThrow(calendarId, userId);

		return this.queryEvents(userId, {
			...query,
			calendarIds: [calendarId],
		});
	}

	async create(userId: string, dto: CreateEventDto): Promise<Event> {
		let calendarId = dto.calendarId;
		let calendar;

		// If no calendarId provided, get or create default calendar
		if (!calendarId) {
			calendar = await this.calendarService.getOrCreateDefaultCalendar(userId);
			calendarId = calendar.id;
		} else {
			// Verify user owns the specified calendar
			calendar = await this.calendarService.findByIdOrThrow(calendarId, userId);
		}

		const newEvent: NewEvent = {
			calendarId,
			userId,
			title: dto.title,
			description: dto.description,
			location: dto.location,
			startTime: new Date(dto.startTime),
			endTime: new Date(dto.endTime),
			isAllDay: dto.isAllDay ?? false,
			timezone: dto.timezone || calendar.timezone || 'Europe/Berlin',
			recurrenceRule: dto.recurrenceRule,
			recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : undefined,
			color: dto.color,
			status: dto.status || 'confirmed',
			metadata: dto.metadata,
		};

		const [created] = await this.db.insert(events).values(newEvent).returning();

		// Set tags if provided
		if (dto.tagIds && dto.tagIds.length > 0) {
			await this.eventTagService.setEventTags(created.id, dto.tagIds);
		}

		return created;
	}

	async update(id: string, userId: string, dto: UpdateEventDto): Promise<Event> {
		const existingEvent = await this.findByIdOrThrow(id, userId);

		// If changing calendar, verify user owns the new calendar
		if (dto.calendarId && dto.calendarId !== existingEvent.calendarId) {
			await this.calendarService.findByIdOrThrow(dto.calendarId, userId);
		}

		// Handle tags separately
		const { tagIds, ...eventData } = dto;

		const updateData: Partial<NewEvent> = {
			...eventData,
			startTime: dto.startTime ? new Date(dto.startTime) : undefined,
			endTime: dto.endTime ? new Date(dto.endTime) : undefined,
			recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : undefined,
			updatedAt: new Date(),
		};

		// Remove undefined values
		Object.keys(updateData).forEach((key) => {
			if (updateData[key as keyof typeof updateData] === undefined) {
				delete updateData[key as keyof typeof updateData];
			}
		});

		const [updated] = await this.db
			.update(events)
			.set(updateData)
			.where(and(eq(events.id, id), eq(events.userId, userId)))
			.returning();

		// Update tags if provided
		if (tagIds !== undefined) {
			await this.eventTagService.setEventTags(id, tagIds);
		}

		return updated;
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.findByIdOrThrow(id, userId);

		await this.db.delete(events).where(and(eq(events.id, id), eq(events.userId, userId)));
	}

	async getEventsWithCalendar(userId: string, query: QueryEventsDto) {
		const conditions = [eq(events.userId, userId)];

		if (query.startDate) {
			conditions.push(gte(events.endTime, new Date(query.startDate)));
		}
		if (query.endDate) {
			conditions.push(lte(events.startTime, new Date(query.endDate)));
		}

		if (query.calendarIds && query.calendarIds.length > 0) {
			conditions.push(inArray(events.calendarId, query.calendarIds));
		}

		// Search filter - search in title and description
		if (query.search) {
			conditions.push(
				or(
					ilike(events.title, `%${query.search}%`),
					ilike(events.description, `%${query.search}%`)
				) as any
			);
		}

		const qb = this.db
			.select({
				event: events,
				calendar: {
					id: calendars.id,
					name: calendars.name,
					color: calendars.color,
				},
			})
			.from(events)
			.leftJoin(calendars, eq(events.calendarId, calendars.id))
			.where(and(...conditions))
			.orderBy(events.startTime);

		if (query.limit) {
			qb.limit(query.limit);
		}
		if (query.offset) {
			qb.offset(query.offset);
		}

		const result = await qb;

		// Load tags for all events
		const eventsWithCalendar = await Promise.all(
			result.map(async (r) => {
				const tags = await this.eventTagService.getTagsForEvent(r.event.id);
				return {
					...r.event,
					calendar: r.calendar,
					tags,
				};
			})
		);

		return eventsWithCalendar;
	}

	async getEventWithTags(id: string, userId: string) {
		const event = await this.findByIdOrThrow(id, userId);
		const tags = await this.eventTagService.getTagsForEvent(id);
		return { ...event, tags };
	}
}
