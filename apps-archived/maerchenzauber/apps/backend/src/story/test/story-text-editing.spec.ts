import { Test, TestingModule } from '@nestjs/testing';
import { StoryController } from '../story.controller';
import { StoryService } from '../story.service';
import { SupabaseJsonbAuthService } from '../../core/services/supabase-jsonb-auth.service';
import { StoryCreationService } from '../services/story-creation.service';
import { AuthGuard, CreditClientService } from '@mana-core/nestjs-integration';
import { JwtPayload } from '../../types/jwt-payload.interface';

describe('StoryController - Text Editing', () => {
	let controller: StoryController;
	let supabaseService: jest.Mocked<SupabaseJsonbAuthService>;
	let creditClientService: jest.Mocked<CreditClientService>;

	const mockUser: JwtPayload = {
		sub: 'user-123',
		email: 'test@example.com',
		role: 'user',
		app_id: 'storyteller-app',
		iat: Date.now(),
		exp: Date.now() + 3600000,
	};

	const mockToken = 'mock-jwt-token';

	const mockStory = {
		id: 'story-123',
		user_id: 'user-123',
		title: 'Test Story',
		pages_data: [
			{
				page_number: 1,
				story_text: 'Original page 1 text',
				image_url: 'https://example.com/image1.jpg',
				blur_hash: 'blur1',
			},
			{
				page_number: 2,
				story_text: 'Original page 2 text',
				image_url: 'https://example.com/image2.jpg',
				blur_hash: 'blur2',
			},
		],
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [StoryController],
			providers: [
				{
					provide: SupabaseJsonbAuthService,
					useValue: {
						getUserStories: jest.fn(),
						getStoryById: jest.fn(),
						updateStory: jest.fn(),
						deleteStory: jest.fn(),
						getStoriesWithCollections: jest.fn(),
						getPublicStories: jest.fn(),
						getStoryCollections: jest.fn(),
						getCollectionStories: jest.fn(),
						getCentralStories: jest.fn(),
						voteForStory: jest.fn(),
						unvoteStory: jest.fn(),
					},
				},
				{
					provide: StoryCreationService,
					useValue: {
						createStory: jest.fn(),
					},
				},
				{
					provide: CreditClientService,
					useValue: {
						validateCredits: jest
							.fn()
							.mockResolvedValue({ hasCredits: true, availableCredits: 100 }),
						consumeCredits: jest.fn().mockResolvedValue({}),
					},
				},
				{
					provide: StoryService,
					useValue: {
						updateStoryPageText: jest.fn(),
						createStoryline: jest.fn(),
						createAnimalStory: jest.fn(),
						generateStoryTitle: jest.fn(),
					},
				},
			],
		})
			.overrideGuard(AuthGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<StoryController>(StoryController);
		supabaseService = module.get(SupabaseJsonbAuthService) as jest.Mocked<SupabaseJsonbAuthService>;
		creditClientService = module.get(CreditClientService) as jest.Mocked<CreditClientService>;
	});

	describe('PUT /story/:id - Text Editing', () => {
		it('should successfully update story text when user owns the story', async () => {
			// Arrange
			const updatedPagesData = [
				{
					page_number: 1,
					story_text: 'Updated page 1 text',
					image_url: 'https://example.com/image1.jpg',
					blur_hash: 'blur1',
				},
				{
					page_number: 2,
					story_text: 'Updated page 2 text',
					image_url: 'https://example.com/image2.jpg',
					blur_hash: 'blur2',
				},
			];

			const updateData = { pages_data: updatedPagesData };
			const updatedStory = { ...mockStory, pages_data: updatedPagesData };

			supabaseService.getStoryById.mockResolvedValue(mockStory);
			supabaseService.updateStory.mockResolvedValue(updatedStory);

			// Act
			const result = await controller.updateStory('story-123', updateData, mockUser, mockToken);

			// Assert
			expect(result).toEqual({ data: updatedStory });
			expect(supabaseService.getStoryById).toHaveBeenCalledWith('story-123', mockToken);
			expect(supabaseService.updateStory).toHaveBeenCalledWith('story-123', updateData, mockToken);
		});

		it('should reject update when user does not own the story', async () => {
			// Arrange
			const otherUsersStory = { ...mockStory, user_id: 'other-user-456' };
			supabaseService.getStoryById.mockResolvedValue(otherUsersStory);

			// Act
			const result = await controller.updateStory(
				'story-123',
				{ pages_data: [] },
				mockUser,
				mockToken
			);

			// Assert
			expect(result).toEqual({ error: 'Story not found or access denied' });
			expect(supabaseService.updateStory).not.toHaveBeenCalled();
		});

		it('should handle empty text update', async () => {
			// Arrange
			const updateData = {
				pages_data: [
					{
						page_number: 1,
						story_text: '',
						image_url: 'https://example.com/image1.jpg',
						blur_hash: 'blur1',
					},
				],
			};

			supabaseService.getStoryById.mockResolvedValue(mockStory);
			supabaseService.updateStory.mockResolvedValue({
				...mockStory,
				pages_data: updateData.pages_data,
			});

			// Act
			const result = await controller.updateStory('story-123', updateData, mockUser, mockToken);

			// Assert
			expect(result.data).toBeDefined();
			expect(supabaseService.updateStory).toHaveBeenCalled();
		});

		it('should handle very long text update', async () => {
			// Arrange
			const longText = 'a'.repeat(10000);
			const updateData = {
				pages_data: [
					{
						page_number: 1,
						story_text: longText,
						image_url: 'https://example.com/image1.jpg',
						blur_hash: 'blur1',
					},
				],
			};

			supabaseService.getStoryById.mockResolvedValue(mockStory);
			supabaseService.updateStory.mockResolvedValue({
				...mockStory,
				pages_data: updateData.pages_data,
			});

			// Act
			const result = await controller.updateStory('story-123', updateData, mockUser, mockToken);

			// Assert
			expect(result.data).toBeDefined();
			expect(result.data.pages_data[0].story_text.length).toBe(10000);
		});

		it('should handle special characters in text', async () => {
			// Arrange
			const specialText =
				'Text with special chars: äöü ß €! @#$%^&*() "quotes" \'single\' <html> {json}';
			const updateData = {
				pages_data: [
					{
						page_number: 1,
						story_text: specialText,
						image_url: 'https://example.com/image1.jpg',
						blur_hash: 'blur1',
					},
				],
			};

			supabaseService.getStoryById.mockResolvedValue(mockStory);
			supabaseService.updateStory.mockResolvedValue({
				...mockStory,
				pages_data: updateData.pages_data,
			});

			// Act
			const result = await controller.updateStory('story-123', updateData, mockUser, mockToken);

			// Assert
			expect(result.data).toBeDefined();
			expect(result.data.pages_data[0].story_text).toBe(specialText);
		});

		it('should handle database errors gracefully', async () => {
			// Arrange
			const updateData = { pages_data: [] };
			supabaseService.getStoryById.mockResolvedValue(mockStory);
			supabaseService.updateStory.mockRejectedValue(new Error('Database connection failed'));

			// Act
			const result = await controller.updateStory('story-123', updateData, mockUser, mockToken);

			// Assert
			expect(result).toEqual({ error: 'Failed to update story' });
		});

		it('should preserve other story fields when updating text', async () => {
			// Arrange
			const updateData = {
				pages_data: [
					{
						page_number: 1,
						story_text: 'New text',
						image_url: 'https://example.com/image1.jpg',
						blur_hash: 'blur1',
					},
				],
			};

			const storyWithManyFields = {
				...mockStory,
				title: 'Original Title',
				is_favorite: true,
				is_published: true,
				sharing_preference: 'public',
				vote_count: 42,
			};

			supabaseService.getStoryById.mockResolvedValue(storyWithManyFields);
			supabaseService.updateStory.mockResolvedValue({
				...storyWithManyFields,
				pages_data: updateData.pages_data,
			});

			// Act
			const result = await controller.updateStory('story-123', updateData, mockUser, mockToken);

			// Assert
			expect(result.data.title).toBe('Original Title');
			expect(result.data.is_favorite).toBe(true);
			expect(result.data.is_published).toBe(true);
		});

		it('should handle story not found', async () => {
			// Arrange
			supabaseService.getStoryById.mockRejectedValue(new Error('Not found'));

			// Act
			const result = await controller.updateStory(
				'non-existent-id',
				{ pages_data: [] },
				mockUser,
				mockToken
			);

			// Assert
			expect(result).toEqual({ error: 'Failed to update story' });
		});

		it('should update the updated_at timestamp', async () => {
			// Arrange
			const updateData = { pages_data: mockStory.pages_data };
			const beforeUpdate = new Date();

			supabaseService.getStoryById.mockResolvedValue(mockStory);
			supabaseService.updateStory.mockImplementation(async (id, data, token) => {
				return {
					...mockStory,
					...data,
					updated_at: new Date().toISOString(),
				};
			});

			// Act
			const result = await controller.updateStory('story-123', updateData, mockUser, mockToken);

			// Assert
			expect(result.data).toBeDefined();
			const updatedAt = new Date(result.data.updated_at);
			expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
		});

		it('should handle partial page updates', async () => {
			// Arrange - Only update page 1, leave page 2 unchanged
			const updateData = {
				pages_data: [
					{
						page_number: 1,
						story_text: 'Updated page 1 only',
						image_url: 'https://example.com/image1.jpg',
						blur_hash: 'blur1',
					},
					{
						page_number: 2,
						story_text: 'Original page 2 text',
						image_url: 'https://example.com/image2.jpg',
						blur_hash: 'blur2',
					},
				],
			};

			supabaseService.getStoryById.mockResolvedValue(mockStory);
			supabaseService.updateStory.mockResolvedValue({
				...mockStory,
				pages_data: updateData.pages_data,
			});

			// Act
			const result = await controller.updateStory('story-123', updateData, mockUser, mockToken);

			// Assert
			expect(result.data.pages_data[0].story_text).toBe('Updated page 1 only');
			expect(result.data.pages_data[1].story_text).toBe('Original page 2 text');
		});
	});

	describe('Authorization Tests', () => {
		it('should reject update from unauthenticated user', async () => {
			// Arrange
			const updateData = { pages_data: [] };
			supabaseService.getStoryById.mockResolvedValue(mockStory);

			// Act - Pass different user
			const unauthorizedUser: JwtPayload = {
				...mockUser,
				sub: 'different-user',
			};
			const result = await controller.updateStory(
				'story-123',
				updateData,
				unauthorizedUser,
				mockToken
			);

			// Assert
			expect(result).toEqual({ error: 'Story not found or access denied' });
		});
	});

	describe('Validation Tests', () => {
		it('should handle null or undefined pages_data', async () => {
			// Arrange
			const updateData = { pages_data: null };
			supabaseService.getStoryById.mockResolvedValue(mockStory);
			supabaseService.updateStory.mockResolvedValue({
				...mockStory,
				pages_data: null,
			});

			// Act
			const result = await controller.updateStory('story-123', updateData, mockUser, mockToken);

			// Assert
			expect(result.data).toBeDefined();
		});

		it('should handle malformed page data structure', async () => {
			// Arrange
			const malformedData = {
				pages_data: [{ wrongField: 'test' }],
			};

			supabaseService.getStoryById.mockResolvedValue(mockStory);
			supabaseService.updateStory.mockResolvedValue({
				...mockStory,
				pages_data: malformedData.pages_data,
			});

			// Act
			const result = await controller.updateStory('story-123', malformedData, mockUser, mockToken);

			// Assert
			expect(result.data).toBeDefined();
		});
	});

	describe('Concurrency Tests', () => {
		it('should handle simultaneous update attempts', async () => {
			// Arrange
			const updateData1 = {
				pages_data: [
					{
						page_number: 1,
						story_text: 'Update 1',
						image_url: 'url',
						blur_hash: 'blur',
					},
				],
			};
			const updateData2 = {
				pages_data: [
					{
						page_number: 1,
						story_text: 'Update 2',
						image_url: 'url',
						blur_hash: 'blur',
					},
				],
			};

			supabaseService.getStoryById.mockResolvedValue(mockStory);
			supabaseService.updateStory
				.mockResolvedValueOnce({
					...mockStory,
					pages_data: updateData1.pages_data,
				})
				.mockResolvedValueOnce({
					...mockStory,
					pages_data: updateData2.pages_data,
				});

			// Act
			const [result1, result2] = await Promise.all([
				controller.updateStory('story-123', updateData1, mockUser, mockToken),
				controller.updateStory('story-123', updateData2, mockUser, mockToken),
			]);

			// Assert
			expect(result1.data).toBeDefined();
			expect(result2.data).toBeDefined();
			expect(supabaseService.updateStory).toHaveBeenCalledTimes(2);
		});
	});
});
