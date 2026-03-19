import { EventController } from './event.controller';
import { createMockEvent, TEST_USER_ID } from '../__tests__/utils/mock-factories';

const mockUser = { userId: TEST_USER_ID, email: 'test@example.com' };

describe('EventController', () => {
	let controller: EventController;
	let service: any;

	beforeEach(() => {
		service = {
			getEventsWithCalendar: jest.fn(),
			findByIdOrThrow: jest.fn(),
			findByCalendar: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		};
		controller = new EventController(service);
	});

	afterEach(() => jest.clearAllMocks());

	describe('queryEvents', () => {
		it('should return events with pagination', async () => {
			const events = [createMockEvent(), createMockEvent()];
			service.getEventsWithCalendar.mockResolvedValue(events);
			const query = { limit: 50, offset: 0 } as any;
			const result = await controller.queryEvents(mockUser as any, query);
			expect(result.events).toEqual(events);
			expect(result.pagination).toEqual({ limit: 50, offset: 0, count: 2 });
		});

		it('should default offset to 0', async () => {
			service.getEventsWithCalendar.mockResolvedValue([]);
			const result = await controller.queryEvents(mockUser as any, { limit: 50 } as any);
			expect(result.pagination.offset).toBe(0);
		});
	});

	describe('findOne', () => {
		it('should return event by id', async () => {
			const event = createMockEvent();
			service.findByIdOrThrow.mockResolvedValue(event);
			const result = await controller.findOne(mockUser as any, event.id);
			expect(result).toEqual({ event });
		});
	});

	describe('findByCalendar', () => {
		it('should return events for calendar', async () => {
			const events = [createMockEvent()];
			service.findByCalendar.mockResolvedValue(events);
			const result = await controller.findByCalendar(mockUser as any, 'cal-id', {} as any);
			expect(result).toEqual({ events });
		});
	});

	describe('create', () => {
		it('should create event', async () => {
			const event = createMockEvent({ title: 'Meeting' });
			service.create.mockResolvedValue(event);
			const result = await controller.create(mockUser as any, { title: 'Meeting' } as any);
			expect(result).toEqual({ event });
		});
	});

	describe('update', () => {
		it('should update event', async () => {
			const event = createMockEvent({ title: 'Updated' });
			service.update.mockResolvedValue(event);
			const result = await controller.update(mockUser as any, event.id, {
				title: 'Updated',
			} as any);
			expect(result).toEqual({ event });
		});
	});

	describe('delete', () => {
		it('should delete and return success', async () => {
			service.delete.mockResolvedValue(undefined);
			const result = await controller.delete(mockUser as any, 'event-id');
			expect(result).toEqual({ success: true });
		});
	});
});
