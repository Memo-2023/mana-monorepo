import { Test, TestingModule } from '@nestjs/testing';
import { StoryService } from '../story.service';
import { PromptingService } from '../../core/services/prompting.service';
import { ConfigService } from '@nestjs/config';

describe('StoryService - updateStoryPageText', () => {
  let service: StoryService;

  const mockPagesData = [
    {
      page_number: 1,
      story_text: 'Once upon a time in German',
      illustration_description: 'A beautiful scene',
      image_url: 'https://example.com/image1.jpg',
    },
    {
      page_number: 2,
      story_text: 'The story continues in German',
      illustration_description: 'Another scene',
      image_url: 'https://example.com/image2.jpg',
    },
    {
      page_number: 3,
      story_text: 'And then something happened in German',
      illustration_description: 'Third scene',
      image_url: 'https://example.com/image3.jpg',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoryService,
        {
          provide: PromptingService,
          useValue: {
            createStoryPrompt: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue({
              azure: {
                openAiEndpoint: 'https://test.openai.azure.com',
                openAiKey: 'test-key',
              },
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StoryService>(StoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateStoryPageText', () => {
    it('should update story text for a valid page', () => {
      const result = service.updateStoryPageText(
        mockPagesData,
        2,
        undefined,
        'Updated German text for page 2',
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(3);
      expect(result.data?.[1].story_text).toBe(
        'Updated German text for page 2',
      );
      // Other pages should remain unchanged
      expect(result.data?.[0].story_text).toBe('Once upon a time in German');
      expect(result.data?.[2].story_text).toBe(
        'And then something happened in German',
      );
    });

    it('should update English text when provided', () => {
      const result = service.updateStoryPageText(
        mockPagesData,
        1,
        'Updated English text',
        undefined,
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.[0].story_text).toBe('Updated English text');
    });

    it('should preserve other page properties when updating', () => {
      const result = service.updateStoryPageText(
        mockPagesData,
        2,
        undefined,
        'New text',
      );

      expect(result.error).toBeNull();
      expect(result.data?.[1].illustration_description).toBe('Another scene');
      expect(result.data?.[1].image_url).toBe('https://example.com/image2.jpg');
      expect(result.data?.[1].page_number).toBe(2);
    });

    it('should return error for invalid pages data', () => {
      const result = service.updateStoryPageText(
        null as any,
        1,
        undefined,
        'text',
      );

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Invalid pages data');
      expect(result.data).toBeNull();
    });

    it('should return error for non-existent page number', () => {
      const result = service.updateStoryPageText(
        mockPagesData,
        99,
        undefined,
        'text',
      );

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Page 99 not found');
      expect(result.data).toBeNull();
    });

    it('should handle empty pages array', () => {
      const result = service.updateStoryPageText([], 1, undefined, 'text');

      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });

    it('should not mutate original pages data', () => {
      const originalPages = [...mockPagesData];
      const originalText = mockPagesData[1].story_text;

      service.updateStoryPageText(mockPagesData, 2, undefined, 'New text');

      // Original should be unchanged
      expect(mockPagesData[1].story_text).toBe(originalText);
    });

    it('should update both text fields if both are provided', () => {
      const result = service.updateStoryPageText(
        mockPagesData,
        1,
        'English text',
        'German text',
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      // Note: Based on the implementation, German text overwrites
      // This test documents the current behavior
      expect(result.data?.[0].story_text).toBe('German text');
    });
  });
});
