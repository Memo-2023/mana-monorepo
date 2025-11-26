import { Test, TestingModule } from '@nestjs/testing';
import { StoryController } from '../story.controller';
import { SupabaseJsonbAuthService } from '../../core/services/supabase-jsonb-auth.service';
import { StoryCreationService } from '../services/story-creation.service';
import { AuthGuard, CreditClientService } from '@mana-core/nestjs-integration';

xdescribe('StoryController', () => {
  let controller: StoryController;

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
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<StoryController>(StoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
