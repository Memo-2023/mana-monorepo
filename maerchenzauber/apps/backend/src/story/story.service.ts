import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Character } from '../core/models/character';
import { Result } from '../core/models/error';
import {
  STORY_RESPONSE_FORMAT,
  STORY_TITLE_FORMAT_GERMAN,
  StoryResponse,
} from '../core/models/story';
import { PromptingService } from '../core/services/prompting.service';
import { GoogleGenAI, Type } from '@google/genai';
import { AppConfig } from '../config/app.config';
@Injectable()
export class StoryService {
  private readonly logger = new Logger(StoryService.name);
  private readonly apiEndpoint: string;
  private readonly azureApiKey: string;
  private readonly ai: GoogleGenAI | null;

  constructor(
    private readonly promptingService: PromptingService,
    private readonly configService: ConfigService,
  ) {
    const config = this.configService.get<AppConfig>('app');
    this.apiEndpoint =
      config?.azure?.openAiEndpoint ||
      'https://storyteller-openai-swedencentral.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview';
    this.azureApiKey = config?.azure?.openAiKey || '';

    const googleApiKey = config?.google?.genAiApiKey;
    if (googleApiKey) {
      this.ai = new GoogleGenAI({
        apiKey: googleApiKey,
      });
    } else {
      this.logger.warn(
        'Google GenAI API key not configured - Gemini fallback will not be available',
      );
      this.ai = null;
    }
  }

  /**
   * Creates a story based on the given story description and character.
   * @param storyDescription The description of the story.
   * @param character The character to be used in the story.
   * @returns A Result object containing the story pages or an error.
   */
  public async createStoryline(
    storyDescription: string,
    character: Character,
    authorSystemPrompt: string,
  ): Promise<Result<StoryResponse>> {
    // Log character data for debugging
    this.logger.log(`Creating storyline for character: ${character.name}`);
    this.logger.log(
      `  - Has character_description: ${!!character.character_description}`,
    );
    this.logger.log(
      `  - Has original_description: ${!!character.original_description}`,
    );

    const characterDesc =
      character.character_description || character.original_description;
    if (!characterDesc) {
      this.logger.error(
        'WARNING: No character description available! Story generation may produce inconsistent results.',
      );
    }

    const messages = [
      {
        role: 'system',
        content: authorSystemPrompt,
      },
      {
        role: 'user',
        content: this.promptingService.createStoryPrompt({
          description: storyDescription,
          name: character.name,
          characterDescription: characterDesc,
        }),
      },
    ];

    try {
      const response = await axios.post(
        this.apiEndpoint,
        {
          messages,
          temperature: 0.7,
          max_tokens: 15000,
          response_format: STORY_RESPONSE_FORMAT,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.azureApiKey,
          },
        },
      );

      const storyResponse = response.data.choices[0].message.content;
      let parsedResponse: StoryResponse;
      try {
        parsedResponse = JSON.parse(storyResponse);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw content received:', storyResponse);
        console.log('Falling back to Gemini for animal story generation...');

        // Try with Gemini as fallback
        const geminiResult = await this.createAnimalStoryWithGemini(
          storyDescription,
          character?.animal_type || '',
          authorSystemPrompt,
        );
        if (geminiResult.pages) {
          parsedResponse = { pages: geminiResult.pages };
        } else {
          throw new Error(
            'Failed to generate story with both Azure and Gemini',
          );
        }
      }

      return {
        data: {
          pages: parsedResponse.pages,
        },
        error: null,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Error:', {
          status: error.response?.status,
          data: error.response?.data,
        });
        return {
          data: null,
          error: new Error(`Failed to create story: ${error.message}`),
        };
      }
      console.error('Error creating story:', error);
      return {
        data: null,
        error: new Error(
          error instanceof Error ? error.message : String(error),
        ),
      };
    }
  }

  /**
   * Creates an animal-only story based on the given description and optional animal type.
   * @param storyDescription The description of the story.
   * @param character The character to be used in the story.
   * @param authorSystemPrompt Author's system prompt.
   * @returns A Result object containing the story pages or an error.
   */
  public async createAnimalStory(
    storyDescription: string,
    character: Character,
    authorSystemPrompt: string,
  ): Promise<Result<StoryResponse>> {
    try {
      // Log character data for debugging
      this.logger.log(`Creating animal story for character: ${character.name}`);
      this.logger.log(`  - Animal type: ${character.animal_type || 'NOT SET'}`);
      this.logger.log(
        `  - Has character_description: ${!!character.character_description}`,
      );
      this.logger.log(
        `  - Has original_description: ${!!character.original_description}`,
      );

      const characterDesc =
        character.character_description || character.original_description;
      if (!characterDesc) {
        this.logger.error(
          'WARNING: No character description available! Story generation may produce inconsistent results.',
        );
      }

      const messages = [
        {
          role: 'system',
          content: authorSystemPrompt,
        },
        {
          role: 'user',
          content: this.promptingService.createStoryPrompt({
            description: storyDescription,
            name: character.name,
            characterDescription: characterDesc,
          }),
        },
      ];

      const response = await axios.post(
        this.apiEndpoint,
        {
          messages,
          temperature: 0.7,
          max_tokens: 10000,
          response_format: STORY_RESPONSE_FORMAT,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.azureApiKey,
          },
        },
      );

      const storyResponse = response.data.choices[0].message.content;
      let parsedResponse: StoryResponse;

      try {
        parsedResponse = JSON.parse(storyResponse);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw content received:', storyResponse);
        console.log('Falling back to Gemini for animal story generation...');

        // Try with Gemini as fallback
        const geminiResult = await this.createAnimalStoryWithGemini(
          storyDescription,
          character.animal_type,
          authorSystemPrompt,
        );
        if (geminiResult.pages) {
          parsedResponse = { pages: geminiResult.pages };
        } else {
          throw new Error(
            'Failed to generate story with both Azure and Gemini',
          );
        }
      }

      return {
        data: {
          pages: parsedResponse.pages,
        },
        error: null,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Error:', {
          status: error.response?.status,
          data: error.response?.data,
        });

        // Try with Gemini as fallback for axios errors too
        try {
          console.log('Falling back to Gemini after axios error...');
          const geminiResult = await this.createAnimalStoryWithGemini(
            storyDescription,
            character.animal_type,
            authorSystemPrompt,
          );
          if (geminiResult.pages) {
            return {
              data: { pages: geminiResult.pages },
              error: null,
            };
          }
        } catch (geminiError) {
          console.error('Gemini fallback also failed:', geminiError);
        }

        return {
          data: null,
          error: new Error(`Failed to create animal story: ${error.message}`),
        };
      }
      console.error('Error creating animal story:', error);
      return {
        data: null,
        error: new Error(
          error instanceof Error ? error.message : String(error),
        ),
      };
    }
  }

  /**
   * Creates an animal story using Gemini API as a fallback when Azure OpenAI fails
   * @param storyDescription The description of the story
   * @param animalType Optional specific animal type to feature in the story
   * @param authorSystemPrompt Author's system prompt
   * @returns StoryResponse containing the story pages
   */
  private async createAnimalStoryWithGemini(
    storyDescription: string,
    animalType: string | undefined,
    authorSystemPrompt: string,
  ) {
    if (!this.ai) {
      throw new Error('Google GenAI not configured');
    }

    const config = {
      responseMimeType: 'application/json',
      systemInstruction: authorSystemPrompt,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                page: {
                  type: Type.NUMBER,
                },
                text: {
                  type: Type.STRING,
                },
              },
            },
          },
        },
      },
    };
    const model = 'gemini-2.0-flash';

    const animalPrompt = animalType
      ? `Write a children's story featuring only animal characters, specifically including ${animalType}. The story should be about: ${storyDescription}`
      : `Write a children's story featuring only animal characters. The story should be about: ${storyDescription}`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: animalPrompt,
          },
        ],
      },
    ];

    try {
      const response = await this.ai.models.generateContent({
        model,
        config,
        contents,
      });

      const parsedResponse = JSON.parse(response?.text || '{}');
      return parsedResponse;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(
        `Failed to generate animal story with Gemini: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  public async generateStoryTitle(
    story: StoryResponse['pages'],
  ): Promise<Result<string>> {
    const combinedStory = story.map((page) => page.text).join(' ');
    const messages = [
      {
        role: 'system',
        content: 'Du bist ein Kreativer Autor für Kindergeschichten.',
      },
      {
        role: 'user',
        content: `Erstelle einen kurzen Titel für die folgende Geschichte: ${combinedStory}`,
      },
    ];
    try {
      const response = await axios.post(
        'https://storyteller-openai-swedencentral.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview',
        {
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          response_format: STORY_TITLE_FORMAT_GERMAN,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.azureApiKey,
          },
        },
      );

      return {
        error: null,
        data: JSON.parse(response.data.choices[0].message.content)?.title,
      };
    } catch (error) {
      console.error('Error generating story title:', error);

      return {
        data: null,
        error: new Error(
          error instanceof Error ? error.message : String(error),
        ),
      };
    }
  }

  /**
   * Update story page text
   * @param storyId The ID of the story
   * @param pageNumber The page number to update
   * @param storyText The new story text (optional)
   * @param storyTextGerman The new German story text (optional)
   * @returns Result object containing updated pages data or error
   */
  public updateStoryPageText(
    pagesData: any[],
    pageNumber: number,
    storyText?: string,
    storyTextGerman?: string,
  ): Result<any[]> {
    try {
      this.logger.log(`[StoryService] Updating page ${pageNumber}`);

      if (!pagesData || !Array.isArray(pagesData)) {
        return {
          data: null,
          error: new Error('Invalid pages data'),
        };
      }

      // Find the page to update
      const pageIndex = pagesData.findIndex(
        (page) => page.page_number === pageNumber,
      );

      if (pageIndex === -1) {
        return {
          data: null,
          error: new Error(`Page ${pageNumber} not found`),
        };
      }

      // Create updated pages array
      const updatedPages = [...pagesData];
      const updatedPage = { ...updatedPages[pageIndex] };

      // Update the text fields if provided
      if (storyText !== undefined) {
        updatedPage.story_text = storyText;
      }

      // If German text is provided, update it
      // Otherwise keep the existing German text
      if (storyTextGerman !== undefined) {
        updatedPage.story_text = storyTextGerman;
      }

      updatedPages[pageIndex] = updatedPage;

      this.logger.log(`[StoryService] Successfully updated page ${pageNumber}`);

      return {
        data: updatedPages,
        error: null,
      };
    } catch (error) {
      this.logger.error('[StoryService] Error updating page text:', error);
      return {
        data: null,
        error: new Error(
          error instanceof Error ? error.message : String(error),
        ),
      };
    }
  }
}
