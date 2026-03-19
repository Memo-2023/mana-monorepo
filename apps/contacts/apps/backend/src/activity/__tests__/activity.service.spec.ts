import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService } from '../activity.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

describe('ActivityService', () => {
	let service: ActivityService;
	let mockDb: any;

	const mockActivity = {
		id: 'activity-1',
		contactId: 'contact-1',
		userId: 'user-1',
		activityType: 'created',
		description: 'Contact created',
		metadata: null,
		createdAt: new Date('2025-01-01'),
	};

	const mockActivity2 = {
		id: 'activity-2',
		contactId: 'contact-1',
		userId: 'user-1',
		activityType: 'called',
		description: 'Called contact',
		metadata: { duration: '5m' },
		createdAt: new Date('2025-01-02'),
	};

	beforeEach(async () => {
		mockDb = {
			select: jest.fn().mockReturnThis(),
			from: jest.fn().mockReturnThis(),
			where: jest.fn().mockReturnThis(),
			limit: jest.fn().mockReturnThis(),
			orderBy: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			values: jest.fn().mockReturnThis(),
			returning: jest.fn(),
			update: jest.fn().mockReturnThis(),
			set: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ActivityService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<ActivityService>(ActivityService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findByContactId', () => {
		it('should return activities for a contact ordered by date descending', async () => {
			mockDb.limit.mockResolvedValue([mockActivity2, mockActivity]);

			const result = await service.findByContactId('contact-1', 'user-1');

			expect(result).toEqual([mockActivity2, mockActivity]);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalled();
			expect(mockDb.where).toHaveBeenCalled();
			expect(mockDb.orderBy).toHaveBeenCalled();
			expect(mockDb.limit).toHaveBeenCalled();
		});

		it('should return empty array when contact has no activities', async () => {
			mockDb.limit.mockResolvedValue([]);

			const result = await service.findByContactId('contact-1', 'user-1');

			expect(result).toEqual([]);
		});

		it('should respect custom limit parameter', async () => {
			mockDb.limit.mockResolvedValue([mockActivity2]);

			const result = await service.findByContactId('contact-1', 'user-1', 1);

			expect(result).toEqual([mockActivity2]);
			expect(mockDb.limit).toHaveBeenCalled();
		});

		it('should use default limit of 50', async () => {
			mockDb.limit.mockResolvedValue([]);

			await service.findByContactId('contact-1', 'user-1');

			expect(mockDb.limit).toHaveBeenCalledWith(50);
		});
	});

	describe('create', () => {
		it('should insert and return a new activity', async () => {
			mockDb.returning.mockResolvedValue([mockActivity]);

			const newActivity = {
				contactId: 'contact-1',
				userId: 'user-1',
				activityType: 'created',
				description: 'Contact created',
			};

			const result = await service.create(newActivity as any);

			expect(result).toEqual(mockActivity);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalledWith(newActivity);
		});
	});

	describe('logActivity', () => {
		it('should log an activity with description', async () => {
			mockDb.returning.mockResolvedValue([mockActivity2]);

			const result = await service.logActivity('contact-1', 'user-1', 'called', 'Called contact');

			expect(result).toEqual(mockActivity2);
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockDb.values).toHaveBeenCalledWith({
				contactId: 'contact-1',
				userId: 'user-1',
				activityType: 'called',
				description: 'Called contact',
				metadata: undefined,
			});
		});

		it('should log an activity with metadata', async () => {
			const activityWithMeta = {
				...mockActivity2,
				metadata: { duration: '5m' },
			};
			mockDb.returning.mockResolvedValue([activityWithMeta]);

			const result = await service.logActivity('contact-1', 'user-1', 'called', 'Called contact', {
				duration: '5m',
			});

			expect(result).toEqual(activityWithMeta);
			expect(mockDb.values).toHaveBeenCalledWith({
				contactId: 'contact-1',
				userId: 'user-1',
				activityType: 'called',
				description: 'Called contact',
				metadata: { duration: '5m' },
			});
		});

		it('should log an activity without description or metadata', async () => {
			mockDb.returning.mockResolvedValue([mockActivity]);

			const result = await service.logActivity('contact-1', 'user-1', 'created');

			expect(result).toEqual(mockActivity);
			expect(mockDb.values).toHaveBeenCalledWith({
				contactId: 'contact-1',
				userId: 'user-1',
				activityType: 'created',
				description: undefined,
				metadata: undefined,
			});
		});
	});
});
