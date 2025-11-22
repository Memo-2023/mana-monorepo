import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SettingsService } from './settings.service';
import { Result } from '../models/error';
import axios from 'axios';
import {
  CHARACTER_DESCRIPTION_PROMPT_FORMAT,
  STORY_ILLUSTRATION_RESPONSE_FORMAT,
  StoryCharacter,
} from '../models/story';
import { AppConfig } from '../../config/app.config';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable()
export class PromptingService {
  private readonly logger = new Logger(PromptingService.name);
  private readonly azureEndpoint: string;
  private readonly azureApiKey: string;
  private readonly replicateApiToken: string | undefined;
  private readonly ai: GoogleGenAI | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly settingsService: SettingsService,
  ) {
    const config = this.configService.get<AppConfig>('app');
    this.azureEndpoint =
      config?.azure?.openAiEndpoint?.split('/openai')[0] ||
      'https://storyteller-openai-swedencentral.openai.azure.com';
    this.azureApiKey = config?.azure?.openAiKey || '';
    this.replicateApiToken = config?.replicate?.apiToken;

    if (this.replicateApiToken) {
      this.logger.log('Replicate API configured successfully');
    } else {
      this.logger.warn('Replicate API token not configured');
    }

    // Initialize Gemini for fallback
    const googleApiKey = config?.google?.genAiApiKey;
    if (googleApiKey) {
      this.ai = new GoogleGenAI({ apiKey: googleApiKey });
      this.logger.log('Gemini initialized for character description fallback');
    } else {
      this.ai = null;
      this.logger.warn(
        'Gemini not configured - no fallback available for character descriptions',
      );
    }
  }

  public async createIllustrationPrompts(
    story: string,
    illustrationSystemPrompt: string,
  ): Promise<Result<any>> {
    try {
      const messages = [
        {
          role: 'system',
          content: illustrationSystemPrompt,
        },
        {
          role: 'user',
          content: this.createIllustrationPrompt(story),
        },
      ];

      const response = await axios.post(
        `${this.azureEndpoint}/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview`,
        {
          messages,
          max_tokens: 15000,
          temperature: 0.7,
          response_format: STORY_ILLUSTRATION_RESPONSE_FORMAT,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.azureApiKey,
          },
        },
      );
      const data = response.data.choices[0].message;
      return {
        error: null,
        data,
      };
    } catch (error) {
      console.error('Create Illustrations Error:', error);
      return {
        error,
        data: null,
      };
    }
  }

  public async createCharacterDescriptionPrompt(
    description: string,
    temperature: number,
  ): Promise<Result<string>> {
    try {
      const messages = [
        {
          role: 'system',
          content:
            "You're an expert at creating detailed and vivid character descriptions for children's book illustrations. Your task is to ENHANCE and ENRICH the given character description while maintaining their core identity. Add rich details about: 1) Physical appearance (height, build, hair, eyes, distinctive features), 2) Clothing and accessories (colors, patterns, styles), 3) Personality traits shown through expression and posture, 4) Mood and emotions visible in their face and body language, 5) Any special abilities or magical elements, 6) Background or environmental context that fits the character. IMPORTANT: Keep the essence and main characteristics of the original character intact - only ADD details, don't change the fundamental identity. Make the description visually rich and specific enough for consistent image generation.",
        },
        {
          role: 'user',
          content: `Enhance this character description for a children's book illustration, adding rich visual details while keeping their core identity: ${description}. Create a detailed, vivid description that will generate a consistent, appealing character image.`,
        },
      ];

      const response = await axios.post(
        `${this.azureEndpoint}/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview`,
        {
          messages,
          max_tokens: 15000,
          temperature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.azureApiKey,
          },
        },
      );
      const data = response.data.choices[0].message;
      return {
        data: data.content,
        error: null,
      };
    } catch (error) {
      console.error('Create Illustrations Error:', error);
      return {
        data: null,
        error: error,
      };
    }
  }

  public async createAnimalCharacterDescriptionPrompt(
    description: string,
    temperature: number,
  ): Promise<Result<string>> {
    try {
      const messages = [
        {
          role: 'system',
          content:
            "You're an expert at creating detailed and enchanting animal character descriptions for children's book illustrations. Your task is to ENHANCE and ENRICH the animal character description while preserving the EXACT animal type. CRITICAL RULES: 1) NEVER change the animal type (if it's a ladybug, it stays a ladybug; if it's a fox, it stays a fox), 2) ADD rich visual details about fur/feathers/skin texture and patterns, 3) Describe expressive eyes and facial features that show personality, 4) Add charming accessories or clothing that fits the character, 5) Include posture and body language that reveals character traits, 6) Describe colors vividly (specific shades, not just 'brown' but 'warm chestnut brown'), 7) Add environmental hints or magical elements if appropriate, 8) Make them appealing and memorable for children. The description should be detailed enough to generate consistent, adorable 3D Pixar-style character images.",
        },
        {
          role: 'user',
          content: `Enhance this animal character for a children's book, adding rich visual details while keeping the EXACT same animal type: ${description}. Create a detailed, enchanting description that will generate a consistent, adorable character that children will love. Remember: DO NOT change what animal it is, only enhance its visual appeal and personality.`,
        },
      ];

      const response = await axios.post(
        `${this.azureEndpoint}/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview`,
        {
          messages,
          max_tokens: 15000,
          temperature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.azureApiKey,
          },
        },
      );
      const data = response.data.choices[0].message;
      return {
        data: data.content,
        error: null,
      };
    } catch (error) {
      console.error('Create Illustrations Error:', error);
      return {
        data: null,
        error: error,
      };
    }
  }

  public createStoryPrompt(variables: Record<string, any>): string {
    const template = this.settingsService.getPromptTemplate('story');
    return this.settingsService.formatPrompt(template, variables);
  }

  public createIllustrationPrompt(story: string): string {
    const template = this.settingsService.getPromptTemplate('illustration');
    return this.settingsService.formatPrompt(template, { story });
  }

  /**
   * Detects the animal type from a character description using Azure OpenAI
   * @param description The character description to analyze
   * @returns A Result containing the detected animal type or null if none detected or on error
   */
  public async detectAnimalType(description: string): Promise<Result<string>> {
    try {
      const messages = [
        {
          role: 'system',
          content:
            "You are an animal type detector. Extract the animal type directly mentioned in the description. For example, if the description says 'ladybug with hat', return 'ladybug'. If it says 'brown bear', return 'bear'. Return ONLY the single animal type word and nothing else. Common animals include: ladybug, squirrel, cat, dog, bear, lion, elephant, rabbit, fox, etc. If no animal is explicitly mentioned, return 'none'.",
        },
        {
          role: 'user',
          content: `Identify the animal type from this description: "${description}". Look for explicit animal names in the text.`,
        },
      ];

      const response = await axios.post(
        `${this.azureEndpoint}/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview`,
        {
          messages,
          max_tokens: 10,
          temperature: 0,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.azureApiKey,
          },
        },
      );

      const detectedAnimal =
        response.data.choices[0].message.content?.trim().toLowerCase() || '';
      console.log('Detected animal type:', detectedAnimal);

      // If the response is "none" or anything other than a simple animal word, return empty
      if (
        !detectedAnimal ||
        detectedAnimal === 'none' ||
        detectedAnimal.includes(' ') ||
        detectedAnimal.length > 20
      ) {
        return {
          data: '',
          error: null,
        };
      }

      return {
        data: detectedAnimal,
        error: null,
      };
    } catch (error) {
      console.error('Error detecting animal type:', error);
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  /**
   * Enhances a user's character description to be detailed and suitable for consistent illustration
   * If the description is already detailed, returns it with minor improvements
   * If brief, expands it with visual details while preserving the core concept
   * @param userInput The raw user description (e.g., "schwurti das fette schwein")
   * @param characterName The character's name
   * @returns A Result containing the enhanced detailed description
   */
  public async enhanceAnimalCharacterDescription(
    userInput: string,
    characterName: string,
  ): Promise<Result<string>> {
    try {
      if (!this.ai) {
        this.logger.warn(
          'Gemini AI not configured, cannot enhance character description',
        );
        return {
          data: userInput,
          error: null,
        };
      }

      const enhancementPrompt = `Analyze this character description: "${userInput}"
Character name: "${characterName}"

Your task:
- If the description is already detailed (includes specific physical features, colors, personality traits):
  Return it as-is with only minor grammar improvements if needed.

- If the description is brief or vague (e.g., "fat pig", "yellow sheep"):
  Expand it into a detailed visual description suitable for consistent Pixar-style illustration.

When expanding, include:
- Animal type and specific breed/variety if relevant
- Body shape and size (chubby, slim, tall, short, etc.)
- Specific colors and patterns
- Facial features (eyes, nose, ears, expression)
- Distinctive physical traits (tail, fur texture, markings)
- Personality traits that affect appearance (playful, wise, cheerful, etc.)
- Any clothing or accessories if mentioned or appropriate

CRITICAL RULES:
- Keep the original animal type - never change it
- Preserve all details from the original description
- Make it specific enough that the same character can be drawn consistently
- Write in third person
- Start with "${characterName} is a..."

Return ONLY the enhanced character description, nothing else.`;

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: enhancementPrompt,
        config: {
          systemInstruction:
            "You are a Pixar character designer expert. Your job is to create detailed, consistent character descriptions for children's book illustrations. Be specific about visual details while keeping the charm and personality of the original concept.",
        },
      });

      const enhancedDescription = response.text?.trim() || userInput;

      this.logger.log(`Enhanced character description: ${enhancedDescription}`);

      return {
        data: enhancedDescription,
        error: null,
      };
    } catch (error) {
      this.logger.error('Error enhancing character description:', error);
      // Fallback to original input if enhancement fails
      return {
        data: userInput,
        error: null,
      };
    }
  }

  public async createConsistentCharacterDescriptionPrompts(
    story: string,
    characterData?: any,
    storyId?: string,
  ): Promise<Result<StoryCharacter[]>> {
    // Log the character data being used
    if (characterData) {
      this.logger.log(
        `[Story ${storyId}] Creating character descriptions for: ${characterData.name}`,
      );
      this.logger.log(`  - ID: ${characterData.id}`);
      this.logger.log(
        `  - Original Description: ${characterData.original_description?.substring(
          0,
          100,
        )}...`,
      );
      this.logger.log(`  - Is Animal: ${characterData.is_animal}`);
      this.logger.log(`  - Animal Type: ${characterData.animal_type || 'N/A'}`);
    }

    // Try Azure OpenAI first
    this.logger.log(
      `[Story ${storyId}] Attempting character description with Azure OpenAI...`,
    );
    const azureResult = await this.createCharacterDescriptionsWithAzure(
      story,
      characterData,
      storyId,
    );

    if (!azureResult.error && azureResult.data && azureResult.data.length > 0) {
      this.logger.log(
        `[Story ${storyId}] Successfully created ${azureResult.data.length} character descriptions with Azure`,
      );
      return azureResult;
    }

    // If Azure fails and Gemini is available, try Gemini as fallback
    if (this.ai) {
      this.logger.warn(
        `[Story ${storyId}] Azure failed, falling back to Gemini. Error: ${azureResult.error}`,
      );
      const geminiResult = await this.createCharacterDescriptionsWithGemini(
        story,
        characterData,
        storyId,
      );

      if (
        !geminiResult.error &&
        geminiResult.data &&
        geminiResult.data.length > 0
      ) {
        this.logger.log(
          `[Story ${storyId}] Successfully created ${geminiResult.data.length} character descriptions with Gemini`,
        );
        return geminiResult;
      }

      this.logger.error(
        `[Story ${storyId}] Both Azure and Gemini failed to create character descriptions`,
      );
    } else {
      this.logger.error(
        `[Story ${storyId}] Azure failed and Gemini not available as fallback`,
      );
    }

    // Return the Azure error if all attempts failed
    return azureResult;
  }

  private async createCharacterDescriptionsWithAzure(
    story: string,
    characterData?: any,
    storyId?: string,
  ): Promise<Result<StoryCharacter[]>> {
    try {
      const characterInfo = characterData
        ? `The main character is: Name: "${
            characterData.name
          }". Description: "${characterData.character_description}". ${
            characterData.is_animal
              ? `Animal Type: ${characterData.animal_type}`
              : ''
          }`
        : 'Identify and describe the characters from the story';

      const messages = [
        {
          role: 'system',
          content:
            "You're a genius at storytelling and character development. You'll get a story and existing character descriptions. Create consistent character descriptions that preserve the EXACT character identity and appearance from the original descriptions. CRITICAL: Never change the character's core identity, animal type, or defining features. If the original description says a character is a ladybug, they MUST remain a ladybug. If they're a cat, they MUST remain a cat. The story text may have errors - always trust and use the original character description provided. IMPORTANT: Each character in the story should have their own unique name and identity - do not give multiple characters the same name unless they are explicitly the same character.",
        },
        {
          role: 'user',
          content: `Create character descriptions for the following story: ${story}. ${characterInfo}. IMPORTANT: Use the EXACT animal type and characteristics from the original description provided, even if the story text mentions something different. The original description is the source of truth. The main character's name is "${characterData?.name}" and must be referred to by that name. If there are multiple characters in the story (like a main character and supporting characters), each should have their own unique name and description - DO NOT name all characters with the same name. Also add the pages where the character appears.`,
        },
      ];

      const response = await this.callChatGPT(messages);
      const data = response?.data?.choices[0]?.message;
      const characters = JSON.parse(data?.content)?.characters;
      if (!characters) {
        return {
          error: 'Could not parse character descriptions from Azure response',
          data: null,
        };
      }

      // Log the generated characters
      this.logger.log(
        `[Story ${storyId}] Azure generated ${characters.length} characters:`,
      );
      characters.forEach((char: any, index: number) => {
        this.logger.log(
          `  Character ${index + 1}: ${char.characterDescription?.substring(
            0,
            100,
          )}...`,
        );
      });

      return {
        error: null,
        data: characters,
      };
    } catch (error) {
      this.logger.error(
        `[Story ${storyId}] Azure character description error:`,
        error,
      );
      return {
        error: error instanceof Error ? error.message : String(error),
        data: null,
      };
    }
  }

  private async createCharacterDescriptionsWithGemini(
    story: string,
    characterData?: any,
    storyId?: string,
  ): Promise<Result<StoryCharacter[]>> {
    if (!this.ai) {
      return {
        error: 'Gemini not configured',
        data: null,
      };
    }

    try {
      const characterInfo = characterData
        ? `The main character is: Name: "${
            characterData.name
          }". Description: "${characterData.character_description}". ${
            characterData.is_animal
              ? `Animal Type: ${characterData.animal_type}`
              : ''
          }`
        : 'Identify and describe the characters from the story';

      const prompt = `You are a genius at storytelling and character development. Create consistent character descriptions for the following story.

STORY:
${story}

CHARACTER INFO:
${characterInfo}

IMPORTANT RULES:
1. The main character's name is "${
        characterData?.name
      }" and must be referred to by that name
2. Use the EXACT animal type from the original description: ${
        characterData?.animal_type || 'not specified'
      }
3. Each character should have unique names - don't give all characters the same name
4. Preserve all defining features from the original description
5. Include which pages each character appears on

Return a JSON array of character objects with 'characterDescription' (detailed visual description) and 'pages' (array of page numbers).`;

      const config = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  characterDescription: {
                    type: Type.STRING,
                  },
                  pages: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.NUMBER,
                    },
                  },
                },
              },
            },
          },
        },
      };

      const model = 'gemini-2.0-flash';
      const response = await this.ai.models.generateContent({
        model,
        config,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      });

      const parsedResponse = JSON.parse(response?.text || '{}');
      const characters = parsedResponse.characters;

      if (!characters || characters.length === 0) {
        return {
          error: 'Gemini returned no character descriptions',
          data: null,
        };
      }

      // Log the generated characters
      this.logger.log(
        `[Story ${storyId}] Gemini generated ${characters.length} characters:`,
      );
      characters.forEach((char: any, index: number) => {
        this.logger.log(
          `  Character ${index + 1}: ${char.characterDescription?.substring(
            0,
            100,
          )}...`,
        );
      });

      return {
        error: null,
        data: characters,
      };
    } catch (error) {
      this.logger.error(
        `[Story ${storyId}] Gemini character description error:`,
        error,
      );
      return {
        error: error instanceof Error ? error.message : String(error),
        data: null,
      };
    }
  }

  private async callChatGPT(messages: { role: string; content: string }[]) {
    return await axios.post(
      `${this.azureEndpoint}/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview`,
      {
        messages,
        max_tokens: 15000,
        temperature: 0.8,
        response_format: CHARACTER_DESCRIPTION_PROMPT_FORMAT,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.azureApiKey,
        },
      },
    );
  }
}
