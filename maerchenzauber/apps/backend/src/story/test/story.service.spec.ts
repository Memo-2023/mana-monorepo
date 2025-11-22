import { Test, TestingModule } from '@nestjs/testing';
import { StoryService } from '../story.service';
import { ConfigService } from '@nestjs/config';
import { PromptingService } from '../../core/services/prompting.service';

describe('StoryService', () => {
  let service: StoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoryService,
        {
          provide: PromptingService,
          useValue: {
            sendPrompt: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
          },
        },
      ],
    }).compile();

    service = module.get<StoryService>(StoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
