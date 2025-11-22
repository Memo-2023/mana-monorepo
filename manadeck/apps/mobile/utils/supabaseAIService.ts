import { getAuthenticatedSupabase } from './supabase';
import { CardContent } from '../store/cardStore';
import { post } from './apiClient';

const BASE_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manadeck-backend-111768794939.europe-west3.run.app';

export interface GeneratedCard {
  type: 'text' | 'flashcard' | 'quiz' | 'mixed';
  content: CardContent;
  metadata: {
    confidence: number;
    source: string;
    tags: string[];
  };
}

export interface GenerationOptions {
  cardTypes?: ('flashcard' | 'quiz' | 'text')[];
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
  language?: 'de' | 'en';
  topic?: string;
}

/**
 * Service for AI operations using Supabase Edge Functions
 * This keeps the OpenAI API key secure on the server side
 */
export class SupabaseAIService {
  private static async callEdgeFunction(functionName: string, data: any) {
    try {
      // Get authenticated Supabase client with Mana token
      const supabase = await getAuthenticatedSupabase();

      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: data,
      });

      if (error) {
        console.error(`Error calling edge function (${functionName}):`, error);

        // Check for authentication errors
        if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          throw new Error('Bitte melde dich an, um KI-Funktionen zu nutzen.');
        }

        // Check for CORS errors
        if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
          throw new Error(
            'Edge Function nicht erreichbar. Bitte stelle sicher, dass CORS korrekt konfiguriert ist.'
          );
        }

        throw error;
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Unknown error occurred');
      }

      return result.data;
    } catch (error: any) {
      console.error(`Error calling edge function (${functionName}):`, error);
      throw error;
    }
  }

  static async generateCardsFromText(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<GeneratedCard[]> {
    try {
      // Call backend API instead of edge function directly
      // Backend handles: authentication, credit validation/consumption, and edge function invocation
      const response = await post(`${BASE_API_URL}/v1/api/decks/generate`, {
        prompt: prompt,
        deckTitle: options.topic || 'AI Generated Deck',
        deckDescription: `Deck created from prompt: ${prompt.substring(0, 100)}`,
        cardCount: options.count || 10,
        cardTypes: options.cardTypes || ['flashcard', 'quiz'],
        difficulty: options.difficulty || 'medium',
        tags: []
      });

      // Backend returns: { success, deck, cards, creditsUsed, message }
      if (response.success && response.cards) {
        // Convert backend cards to GeneratedCard format
        return response.cards.map((card: any) => ({
          type: card.card_type || 'flashcard',
          content: card.content,
          metadata: {
            confidence: 1,
            source: 'ai',
            tags: card.tags || []
          }
        }));
      }

      return [];
    } catch (error: any) {
      console.error('Error generating cards from text:', error);

      // Re-throw credit errors so they can be handled by the UI
      if (error.message?.includes('insufficient_credits') || error.message?.includes('Insufficient mana')) {
        throw error;
      }

      return [];
    }
  }

  static async generateCardsFromSpeech(audioBase64: string): Promise<GeneratedCard[]> {
    try {
      // First transcribe the audio
      const { text } = await this.callEdgeFunction('transcribeAudio', {
        audioBase64,
      });

      // Then generate cards from the transcribed text
      return await this.generateCardsFromText(text, {
        cardTypes: ['flashcard', 'quiz'],
        difficulty: 'medium',
        count: 5,
        language: 'de',
      });
    } catch (error) {
      console.error('Error generating cards from speech:', error);
      return [];
    }
  }

  static async generateCardsFromImage(
    imageBase64: string,
    context?: string
  ): Promise<GeneratedCard[]> {
    try {
      const cards = await this.callEdgeFunction('generate-deck-from-image', {
        image: imageBase64,
        context,
      });
      return cards || [];
    } catch (error) {
      console.error('Error generating cards from image:', error);
      return [];
    }
  }

  static async enhanceCardContent(content: string, cardType: string): Promise<string> {
    try {
      const { enhancedContent } = await this.callEdgeFunction('enhanceContent', {
        content,
        cardType,
      });
      return enhancedContent || content;
    } catch (error) {
      console.error('Error enhancing card content:', error);
      return content;
    }
  }

  static async generateRelatedCards(card: CardContent): Promise<GeneratedCard[]> {
    try {
      // Convert card content to text for processing
      const cardText = JSON.stringify(card);

      return await this.generateCardsFromText(
        `Basierend auf dieser Lernkarte, erstelle 3 verwandte Karten, die das Thema vertiefen: ${cardText}`,
        {
          count: 3,
          cardTypes: ['flashcard', 'quiz', 'text'],
        }
      );
    } catch (error) {
      console.error('Error generating related cards:', error);
      return [];
    }
  }

  static async transcribeAudio(audioUri: string): Promise<string> {
    console.warn(
      'Direct audio transcription from URI not implemented. Use generateCardsFromSpeech instead.'
    );
    throw new Error('Audio transcription not yet implemented for mobile');
  }
}
