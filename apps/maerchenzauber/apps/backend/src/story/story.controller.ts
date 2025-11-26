import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Param,
  Query,
  Logger,
  BadRequestException,
  Patch,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { isOk } from '@manacore/shared-errors';
import {
  CreateStoryDto,
  CreateStoryWithAnimalCharacterDto,
} from './dto/create-story.dto';
import { UpdateStoryPageTextDto } from './dto/update-story-page.dto';
import {
  AuthGuard,
  CurrentUser,
  CreditClientService,
  InsufficientCreditsException,
} from '@mana-core/nestjs-integration';
import { UserToken } from '../decorators/user.decorator';
import { JwtPayload } from '../types/jwt-payload.interface';
import { SupabaseJsonbAuthService } from '../core/services/supabase-jsonb-auth.service';
import { StoryCreationService } from './services/story-creation.service';
import { StoryService } from './story.service';

@Controller('story')
@UseGuards(AuthGuard)
export class StoryController {
  private readonly logger = new Logger(StoryController.name);

  constructor(
    private readonly supabaseService: SupabaseJsonbAuthService,
    private readonly storyCreationService: StoryCreationService,
    private readonly storyService: StoryService,
    private readonly creditClient: CreditClientService,
  ) {}

  @Get()
  async getStories(
    @CurrentUser() user: JwtPayload,
    @UserToken() token: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    this.logger.log(`Fetching stories for user ${user.email} (${user.sub}), includeArchived: ${includeArchived}`);

    try {
      // Now returns both user stories and central stories due to updated RLS
      const stories = await this.supabaseService.getUserStories(
        user.sub,
        token,
        includeArchived === 'true',
      );
      this.logger.log(`Found ${stories.length} stories for user ${user.sub}`);
      return {
        data: stories,
      };
    } catch (error) {
      this.logger.error('Error fetching stories:', error);
      return {
        error: 'Failed to fetch stories',
      };
    }
  }

  @Get('with-collections')
  async getStoriesWithCollections(
    @CurrentUser() user: JwtPayload,
    @UserToken() token: string,
  ) {
    this.logger.log(
      `Fetching stories with collections for user ${user.email} (${user.sub})`,
    );

    try {
      const result = await this.supabaseService.getStoriesWithCollections(
        user.sub,
        token,
      );
      this.logger.log(
        `Found ${result.userStories.length} user stories and ${result.centralStories.length} central stories`,
      );
      return {
        data: result,
      };
    } catch (error) {
      this.logger.error('Error fetching stories with collections:', error);
      return {
        error: 'Failed to fetch stories with collections',
      };
    }
  }

  @Get('public')
  async getPublicStories(
    @Query('filter') filter: 'popular' | 'new' | 'featured' = 'popular',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @UserToken() token: string,
  ) {
    this.logger.log(
      `Fetching public stories - filter: ${filter}, page: ${page}, limit: ${limit}`,
    );

    try {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      const result = await this.supabaseService.getPublicStories(
        token,
        filter,
        pageNum,
        limitNum,
      );
      this.logger.log(`Found ${result.stories.length} public stories`);

      return {
        data: result.stories,
        hasMore: result.hasMore,
        total: result.total,
      };
    } catch (error) {
      this.logger.error('Error fetching public stories:', error);
      return {
        error: 'Failed to fetch public stories',
      };
    }
  }

  @Get('collections')
  async getStoryCollections(@UserToken() token: string) {
    this.logger.log(`Fetching story collections`);

    try {
      const collections = await this.supabaseService.getStoryCollections(token);
      this.logger.log(`Found ${collections.length} collections`);
      return {
        data: collections,
      };
    } catch (error) {
      this.logger.error('Error fetching collections:', error);
      return {
        error: 'Failed to fetch collections',
      };
    }
  }

  @Get('collections/:id/stories')
  async getCollectionStories(
    @Param('id') collectionId: string,
    @UserToken() token: string,
  ) {
    this.logger.log(`Fetching stories for collection ${collectionId}`);

    try {
      const stories = await this.supabaseService.getCollectionStories(
        token,
        collectionId,
      );
      this.logger.log(`Found ${stories.length} stories in collection`);
      return {
        data: stories,
      };
    } catch (error) {
      this.logger.error('Error fetching collection stories:', error);
      return {
        error: 'Failed to fetch collection stories',
      };
    }
  }

  @Get('central')
  async getCentralStories(@UserToken() token: string) {
    this.logger.log(`Fetching central stories`);

    try {
      const stories = await this.supabaseService.getCentralStories(token);
      this.logger.log(`Found ${stories.length} central stories`);
      return {
        data: stories,
      };
    } catch (error) {
      this.logger.error('Error fetching central stories:', error);
      return {
        error: 'Failed to fetch central stories',
      };
    }
  }

  @Get(':id')
  async getStoryById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @UserToken() token: string,
  ) {
    this.logger.log(
      `Fetching story ${id} for user ${user.email} (${user.sub})`,
    );

    try {
      const story = await this.supabaseService.getStoryById(id, token);

      // Verify the story belongs to this user
      if (story.user_id !== user.sub) {
        return {
          error: 'Story not found or access denied',
        };
      }

      return {
        data: story,
      };
    } catch (error) {
      this.logger.error('Error fetching story:', error);
      return {
        error: 'Failed to fetch story',
      };
    }
  }

  @Put(':id')
  async updateStory(
    @Param('id') id: string,
    @Body() updateData: any,
    @CurrentUser() user: JwtPayload,
    @UserToken() token: string,
  ) {
    this.logger.log(
      `Updating story ${id} for user ${user.email} (${user.sub})`,
    );
    this.logger.log(`Update data: ${JSON.stringify(updateData)}`);

    try {
      const story = await this.supabaseService.getStoryById(id, token);

      // Verify the story belongs to this user
      if (story.user_id !== user.sub) {
        return {
          error: 'Story not found or access denied',
        };
      }

      // Update story using Supabase service
      const updatedStory = await this.supabaseService.updateStory(
        id,
        updateData,
        token,
      );

      return {
        data: updatedStory,
      };
    } catch (error) {
      this.logger.error('Error in updateStory:', error);
      return {
        error: 'Failed to update story',
      };
    }
  }

  @Patch(':id/pages/:pageNumber')
  async updateStoryPageText(
    @Param('id') storyId: string,
    @Param('pageNumber') pageNumber: string,
    @Body() updateDto: UpdateStoryPageTextDto,
    @CurrentUser() user: JwtPayload,
    @UserToken() token: string,
  ) {
    const pageNum = parseInt(pageNumber, 10);

    this.logger.log(
      `[StoryController] Updating page ${pageNum} of story ${storyId} for user ${user.sub}`,
    );

    try {
      // 1. Fetch the story and verify ownership
      const story = await this.supabaseService.getStoryById(storyId, token);

      if (!story) {
        this.logger.warn(`[StoryController] Story ${storyId} not found`);
        throw new NotFoundException('Story not found');
      }

      // 2. Verify the story belongs to this user
      if (story.user_id !== user.sub) {
        this.logger.warn(
          `[StoryController] User ${user.sub} attempted to update story ${storyId} belonging to ${story.user_id}`,
        );
        throw new ForbiddenException(
          'You do not have permission to edit this story',
        );
      }

      // 3. Validate page number from DTO matches URL parameter
      if (updateDto.pageNumber !== pageNum) {
        throw new BadRequestException(
          'Page number in URL does not match page number in request body',
        );
      }

      // 4. Get current pages data
      const currentPagesData = story.pages_data || [];

      if (!Array.isArray(currentPagesData) || currentPagesData.length === 0) {
        this.logger.warn(
          `[StoryController] Story ${storyId} has no pages data`,
        );
        throw new BadRequestException('Story has no pages to update');
      }

      // 5. Update the page text using the service
      const updateResult = this.storyService.updateStoryPageText(
        currentPagesData,
        pageNum,
        updateDto.storyText,
        updateDto.storyTextGerman,
      );

      if (!isOk(updateResult)) {
        this.logger.error(
          `[StoryController] Error updating page: ${updateResult.error.message}`,
        );
        throw updateResult.error; // Caught by AppExceptionFilter
      }

      // 6. Update the story in the database with new pages data
      const updatedStory = await this.supabaseService.updateStory(
        storyId,
        { pages_data: updateResult.value },
        token,
      );

      this.logger.log(
        `[StoryController] Successfully updated page ${pageNum} of story ${storyId}`,
      );

      return {
        data: {
          id: updatedStory.id,
          title: updatedStory.title,
          pages_data: updatedStory.pages_data,
          updated_at: updatedStory.updated_at,
        },
        message: `Page ${pageNum} updated successfully`,
      };
    } catch (error) {
      // Re-throw known HTTP exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `[StoryController] Error updating story page: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error,
      );

      return {
        error: 'Failed to update story page',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  @Post(':id/vote')
  async voteForStory(
    @Param('id') storyId: string,
    @Body() voteData: { voteType?: 'like' | 'love' | 'star' },
    @CurrentUser() user: JwtPayload,
    @UserToken() token: string,
  ) {
    this.logger.log(
      `User ${user.sub} voting for story ${storyId} with type ${
        voteData.voteType || 'like'
      }`,
    );

    try {
      const result = await this.supabaseService.voteForStory(
        storyId,
        user.sub,
        voteData.voteType || 'like',
        token,
      );

      return {
        data: result,
      };
    } catch (error) {
      this.logger.error('Error voting for story:', error);
      return {
        error: 'Failed to vote for story',
      };
    }
  }

  @Delete(':id/vote')
  async unvoteStory(
    @Param('id') storyId: string,
    @CurrentUser() user: JwtPayload,
    @UserToken() token: string,
  ) {
    this.logger.log(`User ${user.sub} removing vote from story ${storyId}`);

    try {
      const result = await this.supabaseService.unvoteStory(
        token,
        storyId,
        user.sub,
      );

      return {
        data: result,
      };
    } catch (error) {
      this.logger.error('Error removing vote from story:', error);
      return {
        error: 'Failed to remove vote from story',
      };
    }
  }

  @Post(':id/favorite')
  async toggleFavorite(
    @Param('id') storyId: string,
    @Body() body: { isFavorite: boolean },
    @CurrentUser() user: JwtPayload,
    @UserToken() token: string,
  ) {
    this.logger.log(
      `User ${user.sub} toggling favorite for story ${storyId} to ${body.isFavorite}`,
    );

    try {
      const story = await this.supabaseService.getStoryById(storyId, token);

      // Verify the story belongs to this user (favorites only for own stories)
      if (story.user_id !== user.sub) {
        return {
          error: 'Can only favorite your own stories',
        };
      }

      // Update favorite status
      const updatedStory = await this.supabaseService.updateStory(
        storyId,
        {
          is_favorite: body.isFavorite,
        },
        token,
      );

      return {
        data: { is_favorite: body.isFavorite },
        message: body.isFavorite
          ? 'Story marked as favorite'
          : 'Story removed from favorites',
      };
    } catch (error) {
      this.logger.error('Error toggling favorite:', error);
      return {
        error: 'Failed to toggle favorite',
      };
    }
  }

  @Post('publish')
  async publishStory(
    @Body()
    body: {
      storyId: string;
      sharingPreference: 'private' | 'link_only' | 'public';
    },
    @CurrentUser() user: JwtPayload,
    @UserToken() token: string,
  ) {
    this.logger.log(
      `Publishing story ${body.storyId} for user ${user.sub} with preference ${body.sharingPreference}`,
    );

    try {
      // Generate a share code if needed
      const shareCode =
        body.sharingPreference !== 'private'
          ? Math.random().toString(36).substring(2, 14)
          : null;

      // First get the story to ensure it exists and belongs to the user
      const story = await this.supabaseService.getStoryById(
        body.storyId,
        token,
      );

      if (!story || story.user_id !== user.sub) {
        return { error: 'Story not found or access denied' };
      }

      // Update story with publishing info
      const updatedStory = await this.supabaseService.updateStory(
        body.storyId,
        {
          is_published: body.sharingPreference !== 'private',
          sharing_preference: body.sharingPreference,
          published_at:
            body.sharingPreference !== 'private'
              ? new Date().toISOString()
              : null,
          share_code: shareCode,
        },
        token,
      );

      return {
        data: updatedStory,
        share_code: shareCode,
        message: 'Story published successfully',
      };
    } catch (error) {
      this.logger.error('Error publishing story:', error);
      return { error: 'Failed to publish story' };
    }
  }

  @Post('unpublish/:storyId')
  async unpublishStory(
    @Param('storyId') storyId: string,
    @CurrentUser() user: JwtPayload,
    @UserToken() token: string,
  ) {
    this.logger.log(`Unpublishing story ${storyId} for user ${user.sub}`);

    try {
      // First get the story to ensure it exists and belongs to the user
      const story = await this.supabaseService.getStoryById(storyId, token);

      if (!story || story.user_id !== user.sub) {
        return { error: 'Story not found or access denied' };
      }

      // Update story to unpublish
      const updatedStory = await this.supabaseService.updateStory(
        storyId,
        {
          is_published: false,
          sharing_preference: 'private',
          published_at: null,
          share_code: null,
        },
        token,
      );

      return {
        data: updatedStory,
        message: 'Story unpublished successfully',
      };
    } catch (error) {
      this.logger.error('Error unpublishing story:', error);
      return { error: 'Failed to unpublish story' };
    }
  }

  @Delete(':id')
  async deleteStory(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @UserToken() token: string,
  ) {
    this.logger.log(
      `Deleting story ${id} for user ${user.email} (${user.sub})`,
    );

    try {
      const story = await this.supabaseService.getStoryById(id, token);

      // Verify the story belongs to this user
      if (story.user_id !== user.sub) {
        return {
          error: 'Story not found or access denied',
        };
      }

      // Delete story using Supabase service
      const result = await this.supabaseService.deleteStory(id, token);
      this.logger.log(`Successfully deleted story ${id}`);

      return {
        data: result,
      };
    } catch (error) {
      this.logger.error('Error in deleteStory:', error);
      return {
        error: 'Failed to delete story',
      };
    }
  }

  @Post()
  async createStory(
    @Body() createStoryDto: CreateStoryDto,
    @CurrentUser() user: JwtPayload,
    @UserToken() token: string,
  ) {
    const characterId = createStoryDto.characters[0];

    if (!characterId) {
      throw new BadRequestException(
        'No character selected. Please select a character for the story.',
      );
    }

    try {
      // Pre-flight credit check for story creation (100 credits)
      const creditValidation = await this.creditClient.validateCredits(
        user.sub,
        'story_creation',
        100,
      );

      if (!creditValidation.hasCredits) {
        this.logger.warn(
          `User ${user.sub} has insufficient credits for story creation. Required: 100, Available: ${creditValidation.availableCredits}`,
        );
        throw new InsufficientCreditsException({
          requiredCredits: 100,
          availableCredits: creditValidation.availableCredits,
          creditType: 'user',
          operation: 'story_creation',
        });
      }

      // Create the story
      const result = await this.storyCreationService.createStory({
        userId: user.sub,
        token,
        characterId,
        storyDescription: createStoryDto.storyDescription,
        authorId: createStoryDto.authorId,
        illustratorId: createStoryDto.illustratorId,
        isAnimalStory: false,
      });

      // Consume credits after successful story creation
      await this.creditClient.consumeCredits(
        user.sub,
        'story_creation',
        100,
        `Created story: ${result.storyData.title || 'Untitled'}`,
        {
          storyId: result.storyData.id,
          characterId,
          storyDescription: createStoryDto.storyDescription,
        },
      );

      this.logger.log(
        `Successfully consumed 100 credits for story creation by user ${user.sub}`,
      );

      return result;
    } catch (error) {
      if (error instanceof InsufficientCreditsException) {
        // Re-throw to let NestJS handle it with proper 402 status
        throw error;
      }
      this.logger.error('Error in createStory:', error);
      throw error;
    }
  }

  @Post('animal')
  async createStoryWithAnimalCharacter(
    @Body() createStoryDto: CreateStoryWithAnimalCharacterDto,
    @CurrentUser() user: JwtPayload,
    @UserToken() token: string,
  ) {
    const characterId = createStoryDto.characters[0];

    if (!characterId) {
      throw new BadRequestException(
        'No character selected. Please select a character for the story.',
      );
    }

    this.logger.log(`Creating animal story for character ${characterId}`);

    try {
      // Pre-flight credit check for story creation (100 credits)
      const creditValidation = await this.creditClient.validateCredits(
        user.sub,
        'story_creation',
        100,
      );

      if (!creditValidation.hasCredits) {
        this.logger.warn(
          `User ${user.sub} has insufficient credits for animal story creation. Required: 100, Available: ${creditValidation.availableCredits}`,
        );
        throw new InsufficientCreditsException({
          requiredCredits: 100,
          availableCredits: creditValidation.availableCredits,
          creditType: 'user',
          operation: 'story_creation',
        });
      }

      // Create the story
      const result = await this.storyCreationService.createStory({
        userId: user.sub,
        token,
        characterId,
        storyDescription: createStoryDto.storyDescription,
        authorId: createStoryDto.authorId,
        illustratorId: createStoryDto.illustratorId,
        isAnimalStory: true,
      });

      // Consume credits after successful story creation
      await this.creditClient.consumeCredits(
        user.sub,
        'story_creation',
        100,
        `Created animal story: ${result.storyData.title || 'Untitled'}`,
        {
          storyId: result.storyData.id,
          characterId,
          storyDescription: createStoryDto.storyDescription,
          isAnimalStory: true,
        },
      );

      this.logger.log(
        `Successfully consumed 100 credits for animal story creation by user ${user.sub}`,
      );

      return result;
    } catch (error) {
      if (error instanceof InsufficientCreditsException) {
        // Re-throw to let NestJS handle it with proper 402 status
        throw error;
      }
      this.logger.error('Error in createStoryWithAnimalCharacter:', error);
      throw error;
    }
  }
}
