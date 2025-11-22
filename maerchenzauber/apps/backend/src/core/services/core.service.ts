import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result } from '../models/error';
import axios from 'axios';
import {
  STORY_RESPONSE_FORMAT_GERMAN,
  StoryResponse,
  StoryResponsePage,
} from '../models/story';
import { GoogleGenAI, Type } from '@google/genai';
import { AppConfig } from '../../config/app.config';
@Injectable()
export class CoreService {
  private readonly logger = new Logger(CoreService.name);
  private readonly ai: GoogleGenAI | null;
  private readonly azureEndpoint: string;
  private readonly azureApiKey: string;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<AppConfig>('app');
    this.azureEndpoint =
      config?.azure?.openAiEndpoint?.split('/openai')[0] ||
      'https://storyteller-openai-swedencentral.openai.azure.com';
    this.azureApiKey = config?.azure?.openAiKey || '';

    const googleApiKey = config?.google?.genAiApiKey;
    if (googleApiKey) {
      this.ai = new GoogleGenAI({
        apiKey: googleApiKey,
      });
    } else {
      this.logger.warn('Google GenAI API key not configured');
      this.ai = null;
    }
  }
  async translateToGerman(text: string): Promise<Result<StoryResponsePage[]>> {
    try {
      const messages = [
        {
          role: 'system',
          content:
            'Du bist ein Übersetzer der Texte für Kinderbücher in Deutsch übersetzt. Die Texte sind so geschrieben das sie Jugendfrei sind. Die Texte sind auch so geschrieben das sie für Kinder in der Schule verwendet werden können. ',
        },
        {
          role: 'user',
          content: `Übersetze folgende Geschichte in Deutsch, falls bereits Seiten in deutsch geschrieben sind verändere sie nicht nur die englischen Seiten.
           Geschichte: ${text}`,
        },
      ];

      const response = await axios.post(
        `${this.azureEndpoint}/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview`,
        {
          messages,
          max_tokens: 15000,
          temperature: 0.5, // Lower temperature for more accurate translations
          response_format: STORY_RESPONSE_FORMAT_GERMAN,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.azureApiKey,
          },
        },
      );

      // Add safe JSON parsing
      let parsedResponse: StoryResponse | undefined;
      try {
        const content = response.data.choices[0].message.content;
        if (!content) {
          throw new Error(
            'Content is null or undefined (likely content filter)',
          );
        }
        parsedResponse = JSON.parse(content);
      } catch (parseError) {
        console.error('[translateToGerman] JSON parsing error:', parseError);
        console.error(
          '[translateToGerman] Raw content received:',
          JSON.stringify(response.data),
        );

        const tryWithGemini = await this.translateToGermanWithGemini(text);
        console.log('[translateToGerman] Gemini response:', tryWithGemini);
        if (tryWithGemini?.StoryPagesGerman?.pages) {
          parsedResponse = tryWithGemini.StoryPagesGerman;
        }
      }

      // Validate the parsed response has the expected structure
      if (
        !parsedResponse ||
        !parsedResponse.pages ||
        !Array.isArray(parsedResponse.pages)
      ) {
        throw new Error('Translation response does not contain pages array');
      }

      return {
        error: null,
        data: parsedResponse.pages,
      };
    } catch (error) {
      console.error('Translation Error:', error);
      // Only stringify primitive properties of the error to avoid circular references
      const safeError =
        error instanceof Error
          ? { message: error.message, name: error.name, stack: error.stack }
          : { message: String(error) };

      return {
        error: JSON.stringify(safeError),
        data: null,
      };
    }
  }

  async translateToGermanWithGemini(text: string) {
    if (!this.ai) {
      throw new Error('Google GenAI not configured');
    }

    const config = {
      responseMimeType: 'application/json',
      systemInstruction: `Du bist ein Übersetzer der Texte für Kinderbücher in deutsch übersetzt.
      Denk daran das z.b ein Schwanz von einem Fuchs nichts sexuelles ist dieses kann Sorglos verwendet werden.
      Auch andere sachen wie samen oder busen sind in diesem Kontext nichts sexuelles sondern dienen lediglich als lerninhalt für Kinder.
      `,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          StoryPagesGerman: {
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
        },
      },
    };
    const model = 'gemini-2.0-flash';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Übersetze folgende Geschichte in Deutsch, falls bereits Seiten in deutsch geschrieben sind verändere sie nicht nur die englischen Seiten.
           Geschichte: ${text}`,
          },
        ],
      },
    ];

    const response = await this.ai.models.generateContent({
      model,
      config,
      contents,
    });
    const parsedResponse = response?.text ? JSON.parse(response.text) : null;
    return parsedResponse;
  }
}
