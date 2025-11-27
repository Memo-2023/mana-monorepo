/**
 * Example NestJS Controller Test
 *
 * This demonstrates best practices for testing NestJS controllers:
 * - Mock all dependencies
 * - Test successful responses
 * - Test error handling
 * - Test authentication/authorization
 * - Test validation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ExampleController } from '../example.controller';
import { ExampleService } from '../example.service';
import { CreateExampleDto } from '../dto/create-example.dto';
import { UpdateExampleDto } from '../dto/update-example.dto';

describe('ExampleController', () => {
	let controller: ExampleController;
	let service: ExampleService;

	// Mock data
	const mockUser = { sub: 'user-123', email: 'test@example.com' };
	const mockExample = {
		id: 'example-123',
		title: 'Test Example',
		description: 'Test description',
		userId: 'user-123',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ExampleController],
			providers: [
				{
					provide: ExampleService,
					useValue: {
						create: jest.fn(),
						findAll: jest.fn(),
						findOne: jest.fn(),
						update: jest.fn(),
						remove: jest.fn(),
					},
				},
			],
		}).compile();

		controller = module.get<ExampleController>(ExampleController);
		service = module.get<ExampleService>(ExampleService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('create', () => {
		const createDto: CreateExampleDto = {
			title: 'New Example',
			description: 'New description',
		};

		it('should create an example successfully', async () => {
			const expectedResult = {
				data: { ...mockExample, ...createDto },
				error: null,
			};

			jest.spyOn(service, 'create').mockResolvedValue(expectedResult);

			const result = await controller.create(createDto, { user: mockUser });

			expect(result).toEqual(expectedResult.data);
			expect(service.create).toHaveBeenCalledWith(createDto, mockUser.sub);
			expect(service.create).toHaveBeenCalledTimes(1);
		});

		it('should throw BadRequestException for invalid data', async () => {
			const invalidDto = { title: '', description: 'Test' } as CreateExampleDto;

			jest.spyOn(service, 'create').mockResolvedValue({
				data: null,
				error: new Error('Validation failed'),
			});

			await expect(controller.create(invalidDto, { user: mockUser })).rejects.toThrow(BadRequestException);
		});

		it('should throw UnauthorizedException when user is not authenticated', async () => {
			await expect(controller.create(createDto, { user: null })).rejects.toThrow(UnauthorizedException);
		});

		it('should handle service errors gracefully', async () => {
			jest.spyOn(service, 'create').mockResolvedValue({
				data: null,
				error: new Error('Database error'),
			});

			await expect(controller.create(createDto, { user: mockUser })).rejects.toThrow();
		});
	});

	describe('findAll', () => {
		it('should return all examples for the user', async () => {
			const expectedResult = {
				data: [mockExample],
				error: null,
			};

			jest.spyOn(service, 'findAll').mockResolvedValue(expectedResult);

			const result = await controller.findAll({ user: mockUser });

			expect(result).toEqual(expectedResult.data);
			expect(service.findAll).toHaveBeenCalledWith(mockUser.sub);
			expect(service.findAll).toHaveBeenCalledTimes(1);
		});

		it('should return empty array when user has no examples', async () => {
			jest.spyOn(service, 'findAll').mockResolvedValue({
				data: [],
				error: null,
			});

			const result = await controller.findAll({ user: mockUser });

			expect(result).toEqual([]);
		});

		it('should require authentication', async () => {
			await expect(controller.findAll({ user: null })).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('findOne', () => {
		const exampleId = 'example-123';

		it('should return a single example', async () => {
			jest.spyOn(service, 'findOne').mockResolvedValue({
				data: mockExample,
				error: null,
			});

			const result = await controller.findOne(exampleId, { user: mockUser });

			expect(result).toEqual(mockExample);
			expect(service.findOne).toHaveBeenCalledWith(exampleId, mockUser.sub);
		});

		it('should throw NotFoundException when example does not exist', async () => {
			jest.spyOn(service, 'findOne').mockResolvedValue({
				data: null,
				error: new Error('Not found'),
			});

			await expect(controller.findOne('invalid-id', { user: mockUser })).rejects.toThrow(NotFoundException);
		});

		it('should not allow access to other users examples', async () => {
			const otherUserExample = { ...mockExample, userId: 'other-user' };

			jest.spyOn(service, 'findOne').mockResolvedValue({
				data: otherUserExample,
				error: null,
			});

			await expect(controller.findOne(exampleId, { user: mockUser })).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('update', () => {
		const exampleId = 'example-123';
		const updateDto: UpdateExampleDto = {
			title: 'Updated Title',
		};

		it('should update an example successfully', async () => {
			const updatedExample = { ...mockExample, ...updateDto };

			jest.spyOn(service, 'update').mockResolvedValue({
				data: updatedExample,
				error: null,
			});

			const result = await controller.update(exampleId, updateDto, { user: mockUser });

			expect(result).toEqual(updatedExample);
			expect(service.update).toHaveBeenCalledWith(exampleId, updateDto, mockUser.sub);
		});

		it('should throw NotFoundException when example does not exist', async () => {
			jest.spyOn(service, 'update').mockResolvedValue({
				data: null,
				error: new Error('Not found'),
			});

			await expect(controller.update('invalid-id', updateDto, { user: mockUser })).rejects.toThrow(
				NotFoundException
			);
		});

		it('should validate update data', async () => {
			const invalidDto = { title: '' } as UpdateExampleDto;

			jest.spyOn(service, 'update').mockResolvedValue({
				data: null,
				error: new Error('Validation failed'),
			});

			await expect(controller.update(exampleId, invalidDto, { user: mockUser })).rejects.toThrow(
				BadRequestException
			);
		});
	});

	describe('remove', () => {
		const exampleId = 'example-123';

		it('should delete an example successfully', async () => {
			jest.spyOn(service, 'remove').mockResolvedValue({
				data: { success: true },
				error: null,
			});

			const result = await controller.remove(exampleId, { user: mockUser });

			expect(result).toEqual({ success: true });
			expect(service.remove).toHaveBeenCalledWith(exampleId, mockUser.sub);
		});

		it('should throw NotFoundException when example does not exist', async () => {
			jest.spyOn(service, 'remove').mockResolvedValue({
				data: null,
				error: new Error('Not found'),
			});

			await expect(controller.remove('invalid-id', { user: mockUser })).rejects.toThrow(NotFoundException);
		});

		it('should not allow deletion of other users examples', async () => {
			jest.spyOn(service, 'remove').mockResolvedValue({
				data: null,
				error: new Error('Unauthorized'),
			});

			await expect(controller.remove(exampleId, { user: mockUser })).rejects.toThrow(UnauthorizedException);
		});
	});
});
