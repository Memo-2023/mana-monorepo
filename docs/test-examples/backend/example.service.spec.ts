/**
 * Example NestJS Service Test
 *
 * This demonstrates best practices for testing NestJS services:
 * - Mock database/external dependencies
 * - Test business logic thoroughly
 * - Test error handling
 * - Test edge cases
 * - Use Result pattern for error handling
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExampleService } from '../example.service';
import { SupabaseDataService } from '../../core/services/supabase-data.service';
import { ExternalApiService } from '../../core/services/external-api.service';
import { CreateExampleDto } from '../dto/create-example.dto';

describe('ExampleService', () => {
	let service: ExampleService;
	let supabaseService: jest.Mocked<SupabaseDataService>;
	let externalApiService: jest.Mocked<ExternalApiService>;

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
		// Create mocked services
		const mockSupabaseService = {
			insertExample: jest.fn(),
			getExample: jest.fn(),
			getExamplesByUser: jest.fn(),
			updateExample: jest.fn(),
			deleteExample: jest.fn(),
		};

		const mockExternalApiService = {
			enrichExample: jest.fn(),
			validateExample: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ExampleService,
				{
					provide: SupabaseDataService,
					useValue: mockSupabaseService,
				},
				{
					provide: ExternalApiService,
					useValue: mockExternalApiService,
				},
			],
		}).compile();

		service = module.get<ExampleService>(ExampleService);
		supabaseService = module.get(SupabaseDataService) as jest.Mocked<SupabaseDataService>;
		externalApiService = module.get(ExternalApiService) as jest.Mocked<ExternalApiService>;
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
			// Arrange
			const enrichedData = {
				...createDto,
				metadata: { enhanced: true },
			};

			externalApiService.enrichExample.mockResolvedValue({
				data: enrichedData,
				error: null,
			});

			supabaseService.insertExample.mockResolvedValue({
				data: { ...mockExample, ...enrichedData },
				error: null,
			});

			// Act
			const result = await service.create(createDto, mockUser.sub);

			// Assert
			expect(result.error).toBeNull();
			expect(result.data).toBeDefined();
			expect(result.data.title).toBe(createDto.title);
			expect(externalApiService.enrichExample).toHaveBeenCalledWith(createDto);
			expect(supabaseService.insertExample).toHaveBeenCalledWith(
				expect.objectContaining({
					...enrichedData,
					userId: mockUser.sub,
				})
			);
		});

		it('should handle enrichment failure gracefully', async () => {
			// Arrange
			externalApiService.enrichExample.mockResolvedValue({
				data: null,
				error: new Error('API unavailable'),
			});

			supabaseService.insertExample.mockResolvedValue({
				data: { ...mockExample, ...createDto },
				error: null,
			});

			// Act
			const result = await service.create(createDto, mockUser.sub);

			// Assert - Should still create without enrichment
			expect(result.error).toBeNull();
			expect(result.data).toBeDefined();
			expect(supabaseService.insertExample).toHaveBeenCalledWith(
				expect.objectContaining({
					...createDto,
					userId: mockUser.sub,
				})
			);
		});

		it('should return error when database insert fails', async () => {
			// Arrange
			externalApiService.enrichExample.mockResolvedValue({
				data: createDto,
				error: null,
			});

			const dbError = new Error('Database connection failed');
			supabaseService.insertExample.mockResolvedValue({
				data: null,
				error: dbError,
			});

			// Act
			const result = await service.create(createDto, mockUser.sub);

			// Assert
			expect(result.error).toBeDefined();
			expect(result.data).toBeNull();
			expect(result.error.message).toContain('Database connection failed');
		});

		it('should validate title is not empty', async () => {
			// Arrange
			const invalidDto = { ...createDto, title: '' };

			// Act
			const result = await service.create(invalidDto, mockUser.sub);

			// Assert
			expect(result.error).toBeDefined();
			expect(result.error.message).toContain('Title cannot be empty');
			expect(externalApiService.enrichExample).not.toHaveBeenCalled();
			expect(supabaseService.insertExample).not.toHaveBeenCalled();
		});

		it('should sanitize user input', async () => {
			// Arrange
			const maliciousDto = {
				title: '<script>alert("xss")</script>',
				description: 'Normal description',
			};

			externalApiService.enrichExample.mockResolvedValue({
				data: maliciousDto,
				error: null,
			});

			supabaseService.insertExample.mockResolvedValue({
				data: { ...mockExample, title: 'alert("xss")' }, // Sanitized
				error: null,
			});

			// Act
			const result = await service.create(maliciousDto, mockUser.sub);

			// Assert
			expect(result.data.title).not.toContain('<script>');
		});
	});

	describe('findAll', () => {
		it('should return all examples for a user', async () => {
			// Arrange
			const examples = [mockExample, { ...mockExample, id: 'example-456' }];

			supabaseService.getExamplesByUser.mockResolvedValue({
				data: examples,
				error: null,
			});

			// Act
			const result = await service.findAll(mockUser.sub);

			// Assert
			expect(result.error).toBeNull();
			expect(result.data).toHaveLength(2);
			expect(supabaseService.getExamplesByUser).toHaveBeenCalledWith(mockUser.sub);
		});

		it('should return empty array when user has no examples', async () => {
			// Arrange
			supabaseService.getExamplesByUser.mockResolvedValue({
				data: [],
				error: null,
			});

			// Act
			const result = await service.findAll(mockUser.sub);

			// Assert
			expect(result.error).toBeNull();
			expect(result.data).toEqual([]);
		});

		it('should handle database errors', async () => {
			// Arrange
			const dbError = new Error('Query timeout');
			supabaseService.getExamplesByUser.mockResolvedValue({
				data: null,
				error: dbError,
			});

			// Act
			const result = await service.findAll(mockUser.sub);

			// Assert
			expect(result.error).toBeDefined();
			expect(result.data).toBeNull();
		});
	});

	describe('findOne', () => {
		it('should return a single example', async () => {
			// Arrange
			supabaseService.getExample.mockResolvedValue({
				data: mockExample,
				error: null,
			});

			// Act
			const result = await service.findOne('example-123', mockUser.sub);

			// Assert
			expect(result.error).toBeNull();
			expect(result.data).toEqual(mockExample);
			expect(supabaseService.getExample).toHaveBeenCalledWith('example-123');
		});

		it('should return error when example not found', async () => {
			// Arrange
			supabaseService.getExample.mockResolvedValue({
				data: null,
				error: new Error('Not found'),
			});

			// Act
			const result = await service.findOne('invalid-id', mockUser.sub);

			// Assert
			expect(result.error).toBeDefined();
			expect(result.data).toBeNull();
		});

		it('should verify user owns the example', async () => {
			// Arrange
			const otherUserExample = { ...mockExample, userId: 'other-user' };
			supabaseService.getExample.mockResolvedValue({
				data: otherUserExample,
				error: null,
			});

			// Act
			const result = await service.findOne('example-123', mockUser.sub);

			// Assert
			expect(result.error).toBeDefined();
			expect(result.error.message).toContain('Unauthorized');
			expect(result.data).toBeNull();
		});
	});

	describe('update', () => {
		it('should update an example successfully', async () => {
			// Arrange
			const updateDto = { title: 'Updated Title' };
			const updatedExample = { ...mockExample, ...updateDto };

			supabaseService.getExample.mockResolvedValue({
				data: mockExample,
				error: null,
			});

			supabaseService.updateExample.mockResolvedValue({
				data: updatedExample,
				error: null,
			});

			// Act
			const result = await service.update('example-123', updateDto, mockUser.sub);

			// Assert
			expect(result.error).toBeNull();
			expect(result.data.title).toBe('Updated Title');
			expect(supabaseService.updateExample).toHaveBeenCalledWith('example-123', updateDto);
		});

		it('should not allow updating other users examples', async () => {
			// Arrange
			const otherUserExample = { ...mockExample, userId: 'other-user' };
			supabaseService.getExample.mockResolvedValue({
				data: otherUserExample,
				error: null,
			});

			// Act
			const result = await service.update('example-123', { title: 'New' }, mockUser.sub);

			// Assert
			expect(result.error).toBeDefined();
			expect(result.error.message).toContain('Unauthorized');
			expect(supabaseService.updateExample).not.toHaveBeenCalled();
		});
	});

	describe('remove', () => {
		it('should delete an example successfully', async () => {
			// Arrange
			supabaseService.getExample.mockResolvedValue({
				data: mockExample,
				error: null,
			});

			supabaseService.deleteExample.mockResolvedValue({
				data: { success: true },
				error: null,
			});

			// Act
			const result = await service.remove('example-123', mockUser.sub);

			// Assert
			expect(result.error).toBeNull();
			expect(result.data).toEqual({ success: true });
			expect(supabaseService.deleteExample).toHaveBeenCalledWith('example-123');
		});

		it('should not allow deleting other users examples', async () => {
			// Arrange
			const otherUserExample = { ...mockExample, userId: 'other-user' };
			supabaseService.getExample.mockResolvedValue({
				data: otherUserExample,
				error: null,
			});

			// Act
			const result = await service.remove('example-123', mockUser.sub);

			// Assert
			expect(result.error).toBeDefined();
			expect(supabaseService.deleteExample).not.toHaveBeenCalled();
		});
	});
});
