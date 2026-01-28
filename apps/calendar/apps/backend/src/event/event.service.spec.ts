import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventService } from './event.service';
import { CalendarService } from '../calendar/calendar.service';
import { EventTagService } from '../event-tag/event-tag.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import {
	createMockEvent,
	createMockCalendar,
	TEST_USER_ID,
} from '../__tests__/utils/mock-factories';

describe('EventService', () => {
	let service: EventService;
	let mockDb: any;
	let mockCalendarService: jest.Mocked<CalendarService>;
	let mockEventTagService: jest.Mocked<EventTagService>;

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			leftJoin: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		mockCalendarService = {
			findByIdOrThrow: jest.fn(),
			getOrCreateDefaultCalendar: jest.fn(),
		} as unknown as jest.Mocked<CalendarService>;

		mockEventTagService = {
			setEventTags: jest.fn(),
			getTagsForEvent: jest.fn().mockResolvedValue([]),
		} as unknown as jest.Mocked<EventTagService>;

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				EventService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
				{
					provide: CalendarService,
					useValue: mockCalendarService,
				},
				{
					provide: EventTagService,
					useValue: mockEventTagService,
				},
			],
		}).compile();

		service = module.get<EventService>(EventService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('queryEvents', () => {
		it('should return events within date range', async () => {
			const events = [createMockEvent({ title: 'Event 1' }), createMockEvent({ title: 'Event 2' })];
			mockDb.orderBy.mockResolvedValueOnce(events);

			const result = await service.queryEvents(TEST_USER_ID, {
				startDate: '2024-01-01',
				endDate: '2024-12-31',
			});

			expect(result).toEqual(events);
			expect(mockDb.select).toHaveBeenCalled();
		});

		it('should filter by calendar IDs', async () => {
			const calendarId = 'calendar-123';
			const events = [createMockEvent({ calendarId })];
			mockDb.orderBy.mockResolvedValueOnce(events);

			const result = await service.queryEvents(TEST_USER_ID, {
				calendarIds: [calendarId],
			});

			expect(result).toEqual(events);
		});

		it('should return empty array when no events match', async () => {
			mockDb.orderBy.mockResolvedValueOnce([]);

			const result = await service.queryEvents(TEST_USER_ID, {});

			expect(result).toEqual([]);
		});
	});

	describe('findById', () => {
		it('should return event when found', async () => {
			const event = createMockEvent();
			mockDb.where.mockResolvedValueOnce([event]);

			const result = await service.findById(event.id, TEST_USER_ID);

			expect(result).toEqual(event);
		});

		it('should return null when event not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findById('non-existent-id', TEST_USER_ID);

			expect(result).toBeNull();
		});
	});

	describe('findByIdOrThrow', () => {
		it('should return event when found', async () => {
			const event = createMockEvent();
			mockDb.where.mockResolvedValueOnce([event]);

			const result = await service.findByIdOrThrow(event.id, TEST_USER_ID);

			expect(result).toEqual(event);
		});

		it('should throw NotFoundException when event not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.findByIdOrThrow('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('create', () => {
		it('should create event with provided calendarId', async () => {
			const calendar = createMockCalendar();
			const newEvent = createMockEvent({ calendarId: calendar.id });

			mockCalendarService.findByIdOrThrow.mockResolvedValueOnce(calendar);
			mockDb.returning.mockResolvedValueOnce([newEvent]);

			const result = await service.create(TEST_USER_ID, {
				calendarId: calendar.id,
				title: 'New Event',
				startTime: new Date().toISOString(),
				endTime: new Date().toISOString(),
			});

			expect(result).toEqual(newEvent);
			expect(mockCalendarService.findByIdOrThrow).toHaveBeenCalledWith(calendar.id, TEST_USER_ID);
		});

		it('should create event using default calendar when no calendarId provided', async () => {
			const defaultCalendar = createMockCalendar({ isDefault: true });
			const newEvent = createMockEvent({ calendarId: defaultCalendar.id });

			mockCalendarService.getOrCreateDefaultCalendar.mockResolvedValueOnce(defaultCalendar);
			mockDb.returning.mockResolvedValueOnce([newEvent]);

			const result = await service.create(TEST_USER_ID, {
				title: 'New Event',
				startTime: new Date().toISOString(),
				endTime: new Date().toISOString(),
			});

			expect(result).toEqual(newEvent);
			expect(mockCalendarService.getOrCreateDefaultCalendar).toHaveBeenCalledWith(TEST_USER_ID);
		});

		it('should set tags when tagIds provided', async () => {
			const calendar = createMockCalendar();
			const newEvent = createMockEvent({ calendarId: calendar.id });
			const tagIds = ['tag-1', 'tag-2'];

			mockCalendarService.findByIdOrThrow.mockResolvedValueOnce(calendar);
			mockDb.returning.mockResolvedValueOnce([newEvent]);

			await service.create(TEST_USER_ID, {
				calendarId: calendar.id,
				title: 'New Event',
				startTime: new Date().toISOString(),
				endTime: new Date().toISOString(),
				tagIds,
			});

			expect(mockEventTagService.setEventTags).toHaveBeenCalledWith(newEvent.id, tagIds);
		});
	});

	describe('update', () => {
		it('should update event', async () => {
			const event = createMockEvent();
			const updatedEvent = { ...event, title: 'Updated Title' };

			mockDb.where.mockResolvedValueOnce([event]);
			mockDb.returning.mockResolvedValueOnce([updatedEvent]);

			const result = await service.update(event.id, TEST_USER_ID, {
				title: 'Updated Title',
			});

			expect(result.title).toBe('Updated Title');
		});

		it('should throw NotFoundException when updating non-existent event', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.update('non-existent-id', TEST_USER_ID, { title: 'New Title' })
			).rejects.toThrow(NotFoundException);
		});

		it('should verify calendar ownership when changing calendar', async () => {
			const event = createMockEvent();
			const newCalendar = createMockCalendar({ id: 'new-calendar-id' });
			const updatedEvent = { ...event, calendarId: newCalendar.id };

			mockDb.where.mockResolvedValueOnce([event]);
			mockCalendarService.findByIdOrThrow.mockResolvedValueOnce(newCalendar);
			mockDb.returning.mockResolvedValueOnce([updatedEvent]);

			await service.update(event.id, TEST_USER_ID, {
				calendarId: newCalendar.id,
			});

			expect(mockCalendarService.findByIdOrThrow).toHaveBeenCalledWith(
				newCalendar.id,
				TEST_USER_ID
			);
		});
	});

	describe('delete', () => {
		it('should delete event', async () => {
			const event = createMockEvent();
			mockDb.where.mockResolvedValueOnce([event]);

			await service.delete(event.id, TEST_USER_ID);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException when deleting non-existent event', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.delete('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('findByCalendar', () => {
		it('should return events for specific calendar', async () => {
			const calendar = createMockCalendar();
			const events = [createMockEvent({ calendarId: calendar.id })];

			mockCalendarService.findByIdOrThrow.mockResolvedValueOnce(calendar);
			mockDb.orderBy.mockResolvedValueOnce(events);

			const result = await service.findByCalendar(calendar.id, TEST_USER_ID, {});

			expect(result).toEqual(events);
			expect(mockCalendarService.findByIdOrThrow).toHaveBeenCalledWith(calendar.id, TEST_USER_ID);
		});
	});
});
