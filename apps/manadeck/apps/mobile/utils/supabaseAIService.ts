import { CardContent } from '../store/cardStore';
import { apiClient } from '../services/apiClient';

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
 * AI Service for card generation operations
 * Uses the NestJS backend API for all AI operations
 */
export class SupabaseAIService {
  static async generateCardsFromText(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<GeneratedCard[]> {
    try {
      // Call backend API for deck generation
      const response = await apiClient.generateDeckWithAI({
        prompt: prompt,
        deckTitle: options.topic || 'AI Generated Deck',
        deckDescription: `Deck created from prompt: ${prompt.substring(0, 100)}`,
        cardCount: options.count || 10,
        cardTypes: options.cardTypes || ['flashcard', 'quiz'],
        difficulty: options.difficulty || 'medium',
        tags: [],
      });

      if (response.error) {
        // Re-throw credit errors so they can be handled by the UI
        if (
          response.error.includes('insufficient_credits') ||
          response.error.includes('Insufficient mana')
        ) {
          throw new Error(response.error);
        }
        console.error('Error generating cards from text:', response.error);
        return [];
      }

      // Convert backend cards to GeneratedCard format
      if (response.data?.cards) {
        return response.data.cards.map((card: any) => ({
          type: card.cardType || card.card_type || 'flashcard',
          content: card.content,
          metadata: {
            confidence: 1,
            source: 'ai',
            tags: card.tags || [],
          },
        }));
      }

      return [];
    } catch (error: any) {
      console.error('Error generating cards from text:', error);

      // Re-throw credit errors so they can be handled by the UI
      if (
        error.message?.includes('insufficient_credits') ||
        error.message?.includes('Insufficient mana')
      ) {
        throw error;
      }

      return [];
    }
  }

  static async generateCardsFromImage(
    imageBase64: string,
    context?: string
  ): Promise<GeneratedCard[]> {
    try {
      const response = await apiClient.generateCardsFromImage(imageBase64, context, 5);

      if (response.error) {
        throw new Error(response.error);
      }

      return (response.data?.cards || []).map((card) => ({
        type: card.type as GeneratedCard['type'],
        content: card.content as CardContent,
        metadata: card.metadata,
      }));
    } catch (error) {
      console.error('Error generating cards from image:', error);
      return [];
    }
  }

  static async enhanceCardContent(content: string, cardType: string): Promise<string> {
    try {
      const response = await apiClient.enhanceContent(content, cardType);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data?.enhancedContent || content;
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
}
