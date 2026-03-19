import { CalendarController } from './calendar.controller';
import { createMockCalendar, TEST_USER_ID } from '../__tests__/utils/mock-factories';

const mockUser = { userId: TEST_USER_ID, email: 'test@example.com' };

describe('CalendarController', () => {
	let controller: CalendarController;
	let service: any;

	beforeEach(() => {
		service = {
			findAll: jest.fn(),
			findByIdOrThrow: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			getOrCreateDefaultCalendar: jest.fn(),
		};
		controller = new CalendarController(service);
	});

	afterEach(() => jest.clearAllMocks());

	describe('findAll', () => {
		it('should return user calendars', async () => {
			const calendars = [createMockCalendar(), createMockCalendar()];
			service.findAll.mockResolvedValue(calendars);

			const result = await controller.findAll(mockUser as any);

			expect(result).toEqual({ calendars });
			expect(service.findAll).toHaveBeenCalledWith(TEST_USER_ID);
		});

		it('should lazy-create default calendar when none exist', async () => {
			const defaultCal = createMockCalendar({ isDefault: true });
			service.findAll.mockResolvedValue([]);
			service.getOrCreateDefaultCalendar.mockResolvedValue(defaultCal);

			const result = await controller.findAll(mockUser as any);

			expect(result).toEqual({ calendars: [defaultCal] });
			expect(service.getOrCreateDefaultCalendar).toHaveBeenCalledWith(TEST_USER_ID);
		});
	});

	describe('findOne', () => {
		it('should return calendar by id', async () => {
			const calendar = createMockCalendar();
			service.findByIdOrThrow.mockResolvedValue(calendar);

			const result = await controller.findOne(mockUser as any, calendar.id);

			expect(result).toEqual({ calendar });
		});
	});

	describe('create', () => {
		it('should create and return calendar', async () => {
			const calendar = createMockCalendar({ name: 'New Cal' });
			service.create.mockResolvedValue(calendar);

			const result = await controller.create(mockUser as any, { name: 'New Cal' } as any);

			expect(result).toEqual({ calendar });
		});
	});

	describe('update', () => {
		it('should update and return calendar', async () => {
			const calendar = createMockCalendar({ name: 'Updated' });
			service.update.mockResolvedValue(calendar);

			const result = await controller.update(mockUser as any, calendar.id, {
				name: 'Updated',
			} as any);

			expect(result).toEqual({ calendar });
		});
	});

	describe('delete', () => {
		it('should delete and return success', async () => {
			service.delete.mockResolvedValue(undefined);

			const result = await controller.delete(mockUser as any, 'cal-id');

			expect(result).toEqual({ success: true });
		});
	});
});
