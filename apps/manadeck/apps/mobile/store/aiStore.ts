import { create } from 'zustand';
import {
  SupabaseAIService as AIService,
  GeneratedCard,
  GenerationOptions,
} from '../utils/supabaseAIService';
import { apiClient } from '../services/apiClient';
import { authService } from '../services/authService';
import { Card } from './cardStore';

interface AIState {
  // State
  isGenerating: boolean;
  generatedCards: GeneratedCard[];
  error: string | null;
  usage: {
    tokensUsed: number;
    cost: number;
  };

  // Actions
  generateCardsFromText: (text: string, options?: GenerationOptions) => Promise<GeneratedCard[]>;
  generateCardsFromImage: (imageUri: string, context?: string) => Promise<GeneratedCard[]>;
  enhanceCard: (card: Card) => Promise<Card>;
  generateRelatedCards: (card: Card) => Promise<GeneratedCard[]>;

  // Utility
  clearGeneratedCards: () => void;
  saveGeneratedCards: (deckId: string, cards: GeneratedCard[]) => Promise<void>;
  trackUsage: (tokens: number, cost: number) => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  // Initial State
  isGenerating: false,
  generatedCards: [],
  error: null,
  usage: {
    tokensUsed: 0,
    cost: 0,
  },

  // Generate cards from text
  generateCardsFromText: async (text: string, options?: GenerationOptions) => {
    set({ isGenerating: true, error: null });

    try {
      const cards = await AIService.generateCardsFromText(text, options);

      set((state) => ({
        generatedCards: [...state.generatedCards, ...cards],
        isGenerating: false,
      }));

      // Track usage (estimated)
      get().trackUsage(text.length / 4, text.length * 0.00002);

      return cards;
    } catch (error: any) {
      set({
        error: error.message || 'Fehler beim Generieren der Karten',
        isGenerating: false,
      });
      throw error;
    }
  },

  // Generate cards from image
  generateCardsFromImage: async (imageUri: string, context?: string) => {
    set({ isGenerating: true, error: null });

    try {
      // Read image file and convert to base64
      const { FileSystem } = await import('expo-file-system');
      const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const cards = await AIService.generateCardsFromImage(imageBase64, context);

      set((state) => ({
        generatedCards: [...state.generatedCards, ...cards],
        isGenerating: false,
      }));

      // Track usage (estimated for Vision API)
      get().trackUsage(2000, 0.03);

      return cards;
    } catch (error: any) {
      set({
        error: error.message || 'Fehler beim Verarbeiten des Bildes',
        isGenerating: false,
      });
      throw error;
    }
  },

  // Enhance existing card
  enhanceCard: async (card: Card) => {
    set({ isGenerating: true, error: null });

    try {
      const contentString = JSON.stringify(card.content);
      const enhancedContent = await AIService.enhanceCardContent(contentString, card.type);

      const enhancedCard: Card = {
        ...card,
        content: JSON.parse(enhancedContent),
      };

      set({ isGenerating: false });

      // Track usage (estimated)
      get().trackUsage(500, 0.01);

      return enhancedCard;
    } catch (error: any) {
      set({
        error: error.message || 'Fehler beim Verbessern der Karte',
        isGenerating: false,
      });
      throw error;
    }
  },

  // Generate related cards
  generateRelatedCards: async (card: Card) => {
    set({ isGenerating: true, error: null });

    try {
      const cards = await AIService.generateRelatedCards(card.content);

      set((state) => ({
        generatedCards: [...state.generatedCards, ...cards],
        isGenerating: false,
      }));

      // Track usage (estimated)
      get().trackUsage(800, 0.015);

      return cards;
    } catch (error: any) {
      set({
        error: error.message || 'Fehler beim Generieren verwandter Karten',
        isGenerating: false,
      });
      throw error;
    }
  },

  // Clear generated cards
  clearGeneratedCards: () => {
    set({ generatedCards: [], error: null });
  },

  // Save generated cards to deck via API
  saveGeneratedCards: async (deckId: string, cards: GeneratedCard[]) => {
    try {
      // Get user from auth service
      const appToken = await authService.getAppToken();
      const user = appToken ? authService.getUserFromToken(appToken) : null;
      if (!user) throw new Error('Nicht authentifiziert');

      // Save each card via API
      for (let index = 0; index < cards.length; index++) {
        const card = cards[index];
        const response = await apiClient.createCard({
          deckId,
          title: `Card ${index + 1}`,
          content: card.content,
          cardType: card.type,
          position: index,
        });

        if (response.error) {
          throw new Error(response.error);
        }
      }

      set({ generatedCards: [] });
    } catch (error) {
      console.error('Error saving generated cards:', error);
      throw error;
    }
  },

  // Track API usage
  trackUsage: (tokens: number, cost: number) => {
    set((state) => ({
      usage: {
        tokensUsed: state.usage.tokensUsed + tokens,
        cost: state.usage.cost + cost,
      },
    }));
  },
}));
