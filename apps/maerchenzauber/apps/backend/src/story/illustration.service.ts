import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { FLUX_ILLUSTRATION_PROMPT_GUIDE } from '../core/consts/flux.const';
import { Result } from '../core/models/error';
import {
  ILLUSTRATION_PROMPT_FORMAT,
  StoryCharacter,
  StoryResponsePage,
} from '../core/models/story';
import { AppConfig } from '../config/app.config';

@Injectable()
export class IllustrationService {
  private readonly azureEndpoint: string;
  private readonly azureApiKey: string;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<AppConfig>('app');
    this.azureEndpoint =
      config?.azure?.openAiEndpoint?.split('/openai')[0] ||
      'https://storyteller-openai-swedencentral.openai.azure.com';
    this.azureApiKey = config?.azure?.openAiKey || '';
  }

  public async createIllustrtaionWithCharacterAndGuide(
    storyPage: StoryResponsePage,
    storyCharacters: StoryCharacter[],
    illustrationSystemPrompt: string,
  ): Promise<Result<StoryResponsePage>> {
    try {
      // Get character descriptions
      const characterDescriptions = storyCharacters
        .filter((char) => char.pages.includes(storyPage.page))
        .map((char) => char.characterDescription)
        .join('\n');
      console.log(
        '[createIllustrtaionWithCharacterAndGuide] INPUT -> CHARACTERS: ',
        characterDescriptions,
      );
      const messages = [
        {
          role: 'system',
          content: `${illustrationSystemPrompt}. Important: Keep the characters' descriptions accurate so we know how they look and who they are. Each character should be distinct and recognizable. Act on this guide: ${FLUX_ILLUSTRATION_PROMPT_GUIDE}`,
        },
        {
          role: 'user',
          content: `Create an illustration of ${storyPage.text}. The characters appearing in this scene are described as follows (pay attention to each character's unique features and names): ${characterDescriptions}`,
        },
      ];

      const response = await this.callChatGPT(messages);
      const responseData = response.data.choices[0].message;
      console.log(
        '[createIllustrtaionWithCharacterAndGuide] OUTPUT -> CHARACTERS: ',
        responseData.content,
      );
      if (!JSON.parse(responseData.content)) {
        return {
          error: 'Invalid illustration',
          data: null,
        };
      }
      return {
        error: null,
        data: {
          page: storyPage.page,
          text: JSON.parse(responseData.content).illustration,
        },
      };
    } catch (error) {
      console.error('Create Illustrations Error:', error);
      return {
        error,
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
        temperature: 0.7,
        response_format: ILLUSTRATION_PROMPT_FORMAT,
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
