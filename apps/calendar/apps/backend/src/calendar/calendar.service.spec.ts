import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { DATABASE_CONNECTION } from '../db/database.module';
import { createMockCalendar, TEST_USER_ID } from '../__tests__/utils/mock-factories';

describe('CalendarService', () => {
	let service: CalendarService;
	let mockDb: any;

	beforeEach(async () => {
		// Create mock database with chainable methods
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CalendarService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<CalendarService>(CalendarService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findAll', () => {
		it('should return all calendars for a user', async () => {
			const calendars = [
				createMockCalendar({ name: 'Calendar 1' }),
				createMockCalendar({ name: 'Calendar 2' }),
			];
			mockDb.where.mockResolvedValueOnce(calendars);

			const result = await service.findAll(TEST_USER_ID);

			expect(result).toEqual(calendars);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
		});

		it('should return empty array when user has no calendars', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findAll(TEST_USER_ID);

			expect(result).toEqual([]);
		});
	});

	describe('findById', () => {
		it('should return calendar when found', async () => {
			const calendar = createMockCalendar();
			mockDb.where.mockResolvedValueOnce([calendar]);

			const result = await service.findById(calendar.id, TEST_USER_ID);

			expect(result).toEqual(calendar);
		});

		it('should return null when calendar not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			const result = await service.findById('non-existent-id', TEST_USER_ID);

			expect(result).toBeNull();
		});
	});

	describe('findByIdOrThrow', () => {
		it('should return calendar when found', async () => {
			const calendar = createMockCalendar();
			mockDb.where.mockResolvedValueOnce([calendar]);

			const result = await service.findByIdOrThrow(calendar.id, TEST_USER_ID);

			expect(result).toEqual(calendar);
		});

		it('should throw NotFoundException when calendar not found', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.findByIdOrThrow('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('create', () => {
		it('should create a new calendar', async () => {
			const newCalendar = createMockCalendar({ name: 'New Calendar' });
			mockDb.returning.mockResolvedValueOnce([newCalendar]);

			const result = await service.create(TEST_USER_ID, {
				name: 'New Calendar',
				color: '#3B82F6',
			});

			expect(result).toEqual(newCalendar);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalled();
		});

		it('should clear other defaults when creating default calendar', async () => {
			const newCalendar = createMockCalendar({ name: 'Default', isDefault: true });
			mockDb.returning.mockResolvedValueOnce([newCalendar]);

			await service.create(TEST_USER_ID, {
				name: 'Default',
				isDefault: true,
			});

			// Should have called update to clear other defaults
			expect(mockDb.update).toHaveBeenCalled();
		});
	});

	describe('update', () => {
		it('should update calendar', async () => {
			const calendar = createMockCalendar();
			const updatedCalendar = { ...calendar, name: 'Updated Name' };

			// Mock findByIdOrThrow
			mockDb.where.mockResolvedValueOnce([calendar]);
			// Mock update returning
			mockDb.returning.mockResolvedValueOnce([updatedCalendar]);

			const result = await service.update(calendar.id, TEST_USER_ID, {
				name: 'Updated Name',
			});

			expect(result.name).toBe('Updated Name');
		});

		it('should throw NotFoundException when updating non-existent calendar', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(
				service.update('non-existent-id', TEST_USER_ID, { name: 'New Name' })
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('delete', () => {
		it('should delete calendar', async () => {
			const calendar = createMockCalendar({ isDefault: false });
			mockDb.where.mockResolvedValueOnce([calendar]);

			await service.delete(calendar.id, TEST_USER_ID);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw NotFoundException when deleting non-existent calendar', async () => {
			mockDb.where.mockResolvedValueOnce([]);

			await expect(service.delete('non-existent-id', TEST_USER_ID)).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw error when deleting only calendar that is default', async () => {
			const calendar = createMockCalendar({ isDefault: true });
			// First call returns the calendar
			mockDb.where.mockResolvedValueOnce([calendar]);
			// Second call (findAll) returns only this calendar
			mockDb.where.mockResolvedValueOnce([calendar]);

			await expect(service.delete(calendar.id, TEST_USER_ID)).rejects.toThrow(
				'Cannot delete the only calendar'
			);
		});
	});

	describe('getOrCreateDefaultCalendar', () => {
		it('should return existing default calendar', async () => {
			const defaultCalendar = createMockCalendar({ isDefault: true });
			mockDb.where.mockResolvedValueOnce([defaultCalendar]);

			const result = await service.getOrCreateDefaultCalendar(TEST_USER_ID);

			expect(result).toEqual(defaultCalendar);
		});

		it('should make first calendar default if no default exists', async () => {
			const calendar = createMockCalendar({ isDefault: false });
			const updatedCalendar = { ...calendar, isDefault: true };

			// No default calendar
			mockDb.where.mockResolvedValueOnce([]);
			// Limit returns one calendar
			mockDb.limit.mockResolvedValueOnce([calendar]);
			// Update returns updated calendar
			mockDb.returning.mockResolvedValueOnce([updatedCalendar]);

			const result = await service.getOrCreateDefaultCalendar(TEST_USER_ID);

			expect(result.isDefault).toBe(true);
		});
	});
});
