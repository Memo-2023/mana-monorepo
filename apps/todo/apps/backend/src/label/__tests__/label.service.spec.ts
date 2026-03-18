import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LabelService } from '../label.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

const mockDb = {
	query: {
		labels: {
			findMany: jest.fn(),
			findFirst: jest.fn(),
		},
	},
	insert: jest.fn().mockReturnThis(),
	update: jest.fn().mockReturnThis(),
	delete: jest.fn().mockReturnThis(),
	values: jest.fn().mockReturnThis(),
	set: jest.fn().mockReturnThis(),
	where: jest.fn().mockReturnThis(),
	returning: jest.fn(),
};

describe('LabelService', () => {
	let service: LabelService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				LabelService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<LabelService>(LabelService);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findAll', () => {
		it('should return all labels for a user', async () => {
			const userId = 'user-123';
			const mockLabels = [
				{ id: 'label-1', name: 'Important', color: '#ff0000', userId },
				{ id: 'label-2', name: 'Work', color: '#0000ff', userId },
			];

			mockDb.query.labels.findMany.mockResolvedValue(mockLabels);

			const result = await service.findAll(userId);

			expect(result).toHaveLength(2);
			expect(mockDb.query.labels.findMany).toHaveBeenCalled();
		});

		it('should return empty array when no labels', async () => {
			mockDb.query.labels.findMany.mockResolvedValue([]);

			const result = await service.findAll('user-123');

			expect(result).toEqual([]);
		});
	});

	describe('findById', () => {
		it('should return a label when found', async () => {
			const userId = 'user-123';
			const labelId = 'label-1';
			const mockLabel = { id: labelId, name: 'Important', color: '#ff0000', userId };

			mockDb.query.labels.findFirst.mockResolvedValue(mockLabel);

			const result = await service.findById(labelId, userId);

			expect(result).toBeDefined();
			expect(result?.id).toBe(labelId);
		});

		it('should return null when label not found', async () => {
			mockDb.query.labels.findFirst.mockResolvedValue(undefined);

			const result = await service.findById('non-existent', 'user-123');

			expect(result).toBeNull();
		});
	});

	describe('findByIdOrThrow', () => {
		it('should return a label when found', async () => {
			const userId = 'user-123';
			const labelId = 'label-1';
			const mockLabel = { id: labelId, name: 'Important', color: '#ff0000', userId };

			mockDb.query.labels.findFirst.mockResolvedValue(mockLabel);

			const result = await service.findByIdOrThrow(labelId, userId);

			expect(result.id).toBe(labelId);
		});

		it('should throw NotFoundException when label not found', async () => {
			mockDb.query.labels.findFirst.mockResolvedValue(undefined);

			await expect(service.findByIdOrThrow('non-existent', 'user-123')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('create', () => {
		it('should create a label', async () => {
			const userId = 'user-123';
			const dto = { name: 'Urgent', color: '#ff0000' };
			const createdLabel = { id: 'label-new', ...dto, userId };

			mockDb.returning.mockResolvedValue([createdLabel]);

			const result = await service.create(userId, dto);

			expect(result.name).toBe('Urgent');
			expect(result.color).toBe('#ff0000');
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should create a label with default color when not provided', async () => {
			const userId = 'user-123';
			const dto = { name: 'Simple' };
			const createdLabel = { id: 'label-new', name: 'Simple', color: '#6B7280', userId };

			mockDb.returning.mockResolvedValue([createdLabel]);

			const result = await service.create(userId, dto);

			expect(result.name).toBe('Simple');
			expect(mockDb.insert).toHaveBeenCalled();
		});
	});

	describe('update', () => {
		it('should update a label', async () => {
			const userId = 'user-123';
			const labelId = 'label-1';
			const dto = { name: 'Updated Label', color: '#00ff00' };
			const existingLabel = { id: labelId, name: 'Original', color: '#ff0000', userId };
			const updatedLabel = { id: labelId, ...dto, userId };

			mockDb.query.labels.findFirst.mockResolvedValue(existingLabel);
			mockDb.returning.mockResolvedValue([updatedLabel]);

			const result = await service.update(labelId, userId, dto);

			expect(result.name).toBe('Updated Label');
			expect(result.color).toBe('#00ff00');
		});

		it('should throw when label does not exist', async () => {
			mockDb.query.labels.findFirst.mockResolvedValue(undefined);

			await expect(service.update('non-existent', 'user-123', { name: 'Test' })).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('delete', () => {
		it('should delete a label', async () => {
			const userId = 'user-123';
			const labelId = 'label-1';
			const existingLabel = { id: labelId, name: 'Important', userId };

			mockDb.query.labels.findFirst.mockResolvedValue(existingLabel);

			await service.delete(labelId, userId);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw when label does not exist', async () => {
			mockDb.query.labels.findFirst.mockResolvedValue(undefined);

			await expect(service.delete('non-existent', 'user-123')).rejects.toThrow(NotFoundException);
		});
	});
});
