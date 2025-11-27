import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StoryService } from '../story.service';
import { SupabaseJsonbAuthService } from '../../core/services/supabase-jsonb-auth.service';
import { SettingsClientService } from '../../settings/settings-client.service';
import { SettingsService } from '../../core/services/settings.service';
import { PromptingService } from '../../core/services/prompting.service';
import { IllustrationService } from '../illustration.service';
import { ImageSupabaseService } from '../../core/services/image-supabase.service';
import { CoreService } from '../../core/services/core.service';
import { StoryCharacter, StoryResponse } from '../../core/models/story';
import { StoryError } from '../../core/consts/errors.const';
import { type Result, isOk } from '@manacore/shared-errors';
import { StoryLogbookService } from '../../core/services/story-logbook.service';

export interface StoryCreationParams {
  userId: string;
  token: string;
  characterId: string;
  storyDescription: string;
  authorId?: string;
  illustratorId?: string;
  isAnimalStory?: boolean;
}

export interface StoryCreationResult {
  storyData: {
    id: string;
    title: string;
    pages_data: any[];
    story: string;
    story_prompt: string;
    created_at: string;
    user_id: string;
    is_animal_story?: boolean;
    animal_type?: string;
    character_id?: string;
    character_name?: string;
  };
}

@Injectable()
export class StoryCreationService {
  private readonly logger = new Logger(StoryCreationService.name);
  private readonly MAX_ILLUSTRATION_PAGES = 10; // Generate illustrations for up to 10 pages

  constructor(
    private readonly storyService: StoryService,
    private readonly supabaseService: SupabaseJsonbAuthService,
    private readonly settingsService: SettingsService,
    private readonly settingsClientService: SettingsClientService,
    private readonly promptingService: PromptingService,
    private readonly illustrationService: IllustrationService,
    private readonly imageService: ImageSupabaseService,
    private readonly coreService: CoreService,
    private readonly logbookService: StoryLogbookService,
  ) {}

  async createStory(params: StoryCreationParams): Promise<StoryCreationResult> {
    const {
      userId,
      token,
      characterId,
      storyDescription,
      authorId,
      illustratorId,
      isAnimalStory,
    } = params;
    const storyId = randomUUID();

    // Start the logbook
    this.logbookService.startLogbook(storyId, userId, characterId, {
      storyDescription,
      language: 'de',
      authorId,
      illustratorId,
    });

    try {
      // 1. Fetch and validate character
      this.logbookService.addEntry(storyId, {
        step: 'fetch_character',
        type: 'info',
        data: { characterId, userId },
      });
      const character = await this.fetchAndValidateCharacter(
        characterId,
        userId,
        token,
        isAnimalStory,
      );

      // Log character data
      this.logbookService.logCharacter(storyId, character);

      // 2. Determine author and illustrator
      const { finalAuthorId, finalIllustratorId } =
        await this.determineCreators(
          token,
          authorId,
          illustratorId,
          character.is_animal,
        );

      // 3. Generate story content
      this.logbookService.addEntry(storyId, {
        step: 'generate_story',
        type: 'info',
        data: { storyDescription, authorId: finalAuthorId, isAnimalStory },
      });
      const story = await this.generateStoryContent(
        storyDescription,
        character,
        finalAuthorId || '',
        isAnimalStory,
      );

      if (!isOk(story)) {
        this.logbookService.logError(
          storyId,
          'generate_story',
          story.error || 'No story data',
        );
        await this.logStoryError(
          userId,
          storyId,
          null,
          StoryError.CREATE_STORYLINE,
          isAnimalStory,
        );
        await this.logbookService.finalizeLogbook(storyId, false);
        throw new Error('Error creating storyline');
      }

      // Update logbook with page count
      this.logbookService.updateMetadata(storyId, {
        pageCount: story.value.pages.length,
      });

      // 4. Create character descriptions
      const storyCharacters = await this.createCharacterDescriptions(
        story.value.pages,
        character,
        userId,
        storyId,
        isAnimalStory,
      );

      // 5. Generate illustrations
      const { illustrationPrompts, images } = await this.generateIllustrations(
        story.value.pages,
        storyCharacters,
        finalIllustratorId || '',
        userId,
        storyId,
        token,
        character,
        isAnimalStory,
      );

      // 6. Generate title
      const title = await this.generateTitle(
        story.value.pages,
        userId,
        storyId,
        isAnimalStory,
      );

      // 7. Translate story
      const translatedPages = await this.translateStory(
        story.value.pages,
        illustrationPrompts,
        images,
        userId,
        storyId,
        isAnimalStory,
      );

      // 8. Prepare and save final story data
      const finalStoryData = this.prepareFinalStoryData({
        storyId,
        userId,
        title,
        pages: translatedPages,
        storyPrompt: storyDescription,
        storyCharacters,
        isAnimalStory,
        character,
      });

      await this.supabaseService.createStory(userId, finalStoryData);

      // Update logbook metadata with final details
      this.logbookService.updateMetadata(storyId, {
        storyTitle: title,
        imageCount: images.filter((img) => !img.error).length,
        success: true,
      });

      // Finalize the logbook
      await this.logbookService.finalizeLogbook(storyId, true);

      return {
        storyData: {
          ...finalStoryData,
          title,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error creating story: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error,
      );

      // Log error and finalize logbook
      this.logbookService.logError(storyId, 'story_creation', error);
      await this.logbookService.finalizeLogbook(storyId, false);

      throw error;
    }
  }

  private async fetchAndValidateCharacter(
    characterId: string,
    userId: string,
    token: string,
    isAnimalStory?: boolean,
  ) {
    const character = await this.supabaseService.getCharacterById(
      characterId,
      token,
    );

    // Enhanced logging to verify correct character is loaded
    this.logger.log(`Fetching character ${characterId} for user ${userId}`);
    this.logger.log(`Character loaded: ${character ? 'Yes' : 'No'}`);
    if (character) {
      this.logger.log(`Character details:`);
      this.logger.log(`  - ID: ${character.id}`);
      this.logger.log(`  - Name: ${character.name}`);
      this.logger.log(`  - User ID: ${character.user_id}`);
      this.logger.log(`  - Is Animal: ${character.is_animal}`);
      this.logger.log(`  - Animal Type: ${character.animal_type || 'N/A'}`);
      this.logger.log(
        `  - Original Description: ${character.original_description?.substring(
          0,
          100,
        )}...`,
      );
    }

    if (!character) {
      throw new Error(`Character not found with ID: ${characterId}`);
    }

    // Allow system characters (user_id = '00000000-0000-0000-0000-000000000000') or user's own characters
    const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
    const isSystemCharacter = character.user_id === SYSTEM_USER_ID;
    const isOwnCharacter = character.user_id === userId;

    if (!isSystemCharacter && !isOwnCharacter) {
      this.logger.error(
        `Character ${characterId} belongs to ${character.user_id}, not ${userId} and is not a system character`,
      );
      throw new Error('Character not found or does not belong to user');
    }

    if (isAnimalStory && !character.is_animal) {
      this.logger.error(
        `Character ${characterId} is not an animal character but animal story requested`,
      );
      throw new Error('Character is not an animal character');
    }

    return character;
  }

  private async determineCreators(
    token: string,
    authorId?: string,
    illustratorId?: string,
    isAnimal?: boolean,
  ) {
    const userSettings =
      await this.settingsClientService.getMaerchenzauberSettings(token);

    let finalAuthorId = authorId || userSettings.defaultAuthorId;
    let finalIllustratorId = illustratorId || userSettings.defaultIllustratorId;

    // Use animal-specific creators if applicable
    if (isAnimal && !authorId) {
      finalAuthorId = '67cc8fe5-1501-4cf2-9b69-eafaa28e697c'; // Tweety
    }
    if (isAnimal && !illustratorId) {
      finalIllustratorId = '6e9ad503-c9cf-40d8-9ea0-f502f6ff07f3'; // Mogli
    }

    return { finalAuthorId, finalIllustratorId };
  }

  private async generateStoryContent(
    storyDescription: string,
    character: any,
    authorId: string,
    isAnimalStory?: boolean,
  ): Promise<Result<StoryResponse>> {
    const authorSystemPrompt = this.settingsService.getAuthorPrompt(authorId);

    if (isAnimalStory) {
      return await this.storyService.createAnimalStory(
        storyDescription,
        character,
        authorSystemPrompt,
      );
    } else {
      return await this.storyService.createStoryline(
        storyDescription,
        character,
        authorSystemPrompt,
      );
    }
  }

  private async createCharacterDescriptions(
    pages: any[],
    character: any,
    userId: string,
    storyId: string,
    isAnimalStory?: boolean,
  ): Promise<StoryCharacter[]> {
    const joinedStory = pages
      .map((page) => `${page.page}: ${page.text}\n`)
      .join(' ');

    // Log to logbook
    this.logbookService.addEntry(storyId, {
      step: 'create_character_descriptions',
      type: 'info',
      data: {
        characterId: character.id,
        characterName: character.name,
        originalDescription: character.original_description,
        isAnimalStory,
        pageCount: pages.length,
      },
    });

    // Log character being used for descriptions
    this.logger.log(`Creating character descriptions for story ${storyId}`);
    this.logger.log(`Using character: ${character.name} (${character.id})`);
    this.logger.log(
      `Character original description: ${character.original_description?.substring(
        0,
        100,
      )}...`,
    );

    const createCharacters =
      await this.promptingService.createConsistentCharacterDescriptionPrompts(
        joinedStory,
        character,
        storyId,
      );

    if (createCharacters.error || !createCharacters.data?.length) {
      this.logger.error(
        `Error creating character descriptions: ${createCharacters.error}`,
      );

      // Log the failure to logbook
      this.logbookService.logError(
        storyId,
        'character_descriptions',
        createCharacters.error || 'No character data returned',
      );

      await this.logStoryError(
        userId,
        storyId,
        {
          error: createCharacters.error,
          characterId: character.id,
          joinedStory,
        },
        StoryError.CREATE_CHARACTERS,
        isAnimalStory,
      );

      // Log fallback usage
      this.logbookService.addEntry(storyId, {
        step: 'character_descriptions_fallback',
        type: 'error',
        data: {
          message: 'Using original character description as fallback',
          originalDescription: character.original_description,
        },
      });

      // Fallback to original character description
      return [
        {
          characterDescription: character.original_description,
          pages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        },
      ];
    }

    // Log success
    this.logbookService.addEntry(storyId, {
      step: 'character_descriptions_success',
      type: 'info',
      data: {
        characterCount: createCharacters.data.length,
        characters: createCharacters.data.map(
          (char: StoryCharacter, idx: number) => ({
            index: idx + 1,
            description: char.characterDescription.substring(0, 150) + '...',
            pages: char.pages,
          }),
        ),
      },
    });

    return createCharacters.data;
  }

  private async generateIllustrations(
    pages: any[],
    storyCharacters: StoryCharacter[],
    illustratorId: string,
    userId: string,
    storyId: string,
    token: string,
    character: any,
    isAnimalStory?: boolean,
  ) {
    // Limit pages for illustration
    const pagesForIllustration = pages.slice(0, this.MAX_ILLUSTRATION_PAGES);

    // Log illustration generation start
    this.logbookService.addEntry(storyId, {
      step: 'generate_illustrations',
      type: 'info',
      data: {
        totalPages: pages.length,
        pagesForIllustration: pagesForIllustration.length,
        illustratorId,
      },
    });

    // Generate illustration prompts
    const createIllustrationPrompts = pagesForIllustration.map((page) =>
      this.illustrationService.createIllustrtaionWithCharacterAndGuide(
        page,
        storyCharacters,
        this.settingsService.getIllustratorPrompt(illustratorId),
      ),
    );
    const illustrationPrompts = await Promise.all(createIllustrationPrompts);

    // Check for errors in illustration prompts
    const illustrationsWithError = illustrationPrompts.filter(
      (ill) => ill.error,
    );
    if (illustrationsWithError.length > 0) {
      await this.logIllustrationErrors(
        userId,
        storyId,
        illustrationsWithError,
        StoryError.GENERATE_STORY_ILLUSTRATION_PROMPTS,
        isAnimalStory,
      );
      throw new Error('Error creating illustrations');
    }

    // Log illustration prompts
    illustrationPrompts.forEach((prompt) => {
      if (prompt.data) {
        this.logbookService.logIllustration(
          storyId,
          prompt.data.page,
          prompt.data.text,
        );
      }
    });

    // Enhance prompts with extra styling
    const extraPrompts =
      this.settingsService.getIllustratorPromptWithExtra(illustratorId);
    const enhancedPrompts = illustrationPrompts.map((illustration) => ({
      data: {
        ...illustration.data,
        text: `${extraPrompts.extraPromptBeginning} ${
          illustration.data?.text || ''
        }${extraPrompts.extraPromptEnd}`,
      },
    }));

    // Generate images with character image for consistent character generation
    const path = `${userId}/stories/${storyId}`;
    const characterImageUrl =
      (character as any).image_url || (character as any).imageUrl;

    // Create signed URL for character image if it exists
    let signedCharacterImageUrl: string | undefined;
    if (characterImageUrl) {
      this.logger.log(`Character image URL: ${characterImageUrl}`);
      const signedUrlResult =
        await this.imageService.createSignedUrlForCharacterImage(
          characterImageUrl,
        );

      if (signedUrlResult.error) {
        this.logger.warn(
          `Could not create signed URL for character image: ${signedUrlResult.error.message}`,
        );
        this.logger.warn('Proceeding without character image reference');
      } else {
        signedCharacterImageUrl = signedUrlResult.data!;
        this.logger.log(
          `Using signed character image URL for consistent generation`,
        );
      }
    }

    const createImages = enhancedPrompts.map((illustration) =>
      (this.imageService as any).generateIllustrationForPage(
        illustration.data.text,
        path,
        illustration.data.page,
        token,
        userId,
        signedCharacterImageUrl,
      ),
    );
    const images = await Promise.all(createImages);

    // Log generated images
    images.forEach((image, index) => {
      if (!image.error && image.data) {
        this.logbookService.logIllustration(
          storyId,
          enhancedPrompts[index]?.data?.page || index + 1,
          enhancedPrompts[index]?.data?.text || '',
          image.data,
        );
      }
    });

    // Check for image generation errors
    const imagesWithError = images.filter((img) => img.error);
    if (imagesWithError.length > 0) {
      imagesWithError.forEach((img) => {
        this.logbookService.logError(storyId, 'image_generation', img.error);
      });
      await this.logImageErrors(
        userId,
        storyId,
        imagesWithError,
        isAnimalStory,
      );
      throw new Error('Error creating images');
    }

    return { illustrationPrompts, images };
  }

  private async generateTitle(
    pages: any[],
    userId: string,
    storyId: string,
    isAnimalStory?: boolean,
  ): Promise<string> {
    const titleResult = await this.storyService.generateStoryTitle(pages);

    if (!isOk(titleResult)) {
      this.logger.error('Error generating story title');
      await this.logStoryError(
        userId,
        storyId,
        { error: titleResult.error, storyId },
        StoryError.GENERATE_STORY_TITLE,
        isAnimalStory,
      );
      return '';
    }

    return titleResult.value;
  }

  private async translateStory(
    pages: any[],
    illustrationPrompts: any[],
    images: any[],
    userId: string,
    storyId: string,
    isAnimalStory?: boolean,
  ) {
    const allPagesText = pages
      .map((page) => `${page.page}. ${page.text}`)
      .join('\n\n');
    const translationResult = await this.coreService.translateToGerman(
      allPagesText,
    );

    if (translationResult.error) {
      this.logger.error('Error translating story');
      await this.logStoryError(
        userId,
        storyId,
        { error: translationResult.error, storyId },
        StoryError.TRANSLATE_STORY_TO_GERMAN,
        isAnimalStory,
      );
    }

    return pages.map((page) => {
      const imageData = images.find((img) => img.data.page === page.page)?.data;
      return {
        page_number: page.page,
        story_text:
          translationResult.data
            ?.find((p) => p.page === page.page)
            ?.text?.trim() || page.text,
        illustration_description: illustrationPrompts.find(
          (ill) => ill.data.page === page.page,
        )?.data.text,
        image_url: imageData?.imageUrl,
        blur_hash: imageData?.blurHash,
      };
    });
  }

  private prepareFinalStoryData(params: {
    storyId: string;
    userId: string;
    title: string;
    pages: any[];
    storyPrompt: string;
    storyCharacters: StoryCharacter[];
    isAnimalStory?: boolean;
    character: any;
  }) {
    const {
      storyId,
      userId,
      title,
      pages,
      storyPrompt,
      storyCharacters,
      isAnimalStory,
      character,
    } = params;

    const baseData = {
      id: storyId,
      title,
      pages_data: pages,
      story: pages.map((page) => page.story_text).join('\n'),
      story_prompt: storyPrompt,
      created_at: new Date().toISOString(),
      user_id: userId,
      characters_data: storyCharacters.map((char) => ({
        character_description: char.characterDescription,
        pages: char.pages,
      })),
    };

    if (isAnimalStory) {
      return {
        ...baseData,
        is_animal_story: true,
        animal_type: character.animal_type || '',
        character_id: character.id,
        character_name: character.name,
      };
    }

    return baseData;
  }

  private async logStoryError(
    userId: string,
    storyId: string,
    errorData: any,
    errorType: string,
    isAnimalStory?: boolean,
  ) {
    await this.supabaseService.createStory(userId, {
      id: storyId,
      title: '',
      error_data: {
        ...errorData,
        error_type: errorType,
      },
      created_at: new Date().toISOString(),
      is_animal_story: isAnimalStory,
    });
  }

  private async logIllustrationErrors(
    userId: string,
    storyId: string,
    illustrationsWithError: any[],
    errorType: string,
    isAnimalStory?: boolean,
  ) {
    const errorData = {
      error: illustrationsWithError
        .map((ill) => JSON.stringify(ill.error))
        .join('\n'),
      storyId,
      error_type: errorType,
      illustrationErrors: illustrationsWithError.map((ill) => ({
        page: ill.data?.page || 'unknown',
        error: ill.error,
        text: ill.data?.text || '',
      })),
    };

    await this.logStoryError(
      userId,
      storyId,
      errorData,
      errorType,
      isAnimalStory,
    );
  }

  private async logImageErrors(
    userId: string,
    storyId: string,
    imagesWithError: any[],
    isAnimalStory?: boolean,
  ) {
    const errors = imagesWithError.map((image) => ({
      error:
        image.error?.message ||
        image.error?.errors?.message ||
        String(image.error),
      image: image.data?.prompt || 'Unknown prompt',
    }));

    await this.logStoryError(
      userId,
      storyId,
      { errors, error_type: StoryError.GENERATE_STORY_ILLUSTRATION_PROMPTS },
      StoryError.GENERATE_STORY_ILLUSTRATION_PROMPTS,
      isAnimalStory,
    );
  }
}
