import { create } from 'zustand';
import {
  SupabaseAIService as AIService,
  GeneratedCard,
  GenerationOptions,
} from '../utils/supabaseAIService';
import { supabase } from '../utils/supabase';
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
  audioRecording: {
    isRecording: boolean;
    uri: string | null;
    duration: number;
  };

  // Actions
  generateCardsFromText: (text: string, options?: GenerationOptions) => Promise<GeneratedCard[]>;
  generateCardsFromAudio: (audioUri: string) => Promise<GeneratedCard[]>;
  generateCardsFromImage: (imageUri: string, context?: string) => Promise<GeneratedCard[]>;
  enhanceCard: (card: Card) => Promise<Card>;
  generateRelatedCards: (card: Card) => Promise<GeneratedCard[]>;

  // Audio Recording
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string>;

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
  audioRecording: {
    isRecording: false,
    uri: null,
    duration: 0,
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

  // Generate cards from audio
  generateCardsFromAudio: async (audioUri: string) => {
    set({ isGenerating: true, error: null });

    try {
      // Read audio file and convert to base64
      const { FileSystem } = await import('expo-file-system');
      const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const cards = await AIService.generateCardsFromSpeech(audioBase64);

      set((state) => ({
        generatedCards: [...state.generatedCards, ...cards],
        isGenerating: false,
      }));

      // Track usage (estimated for Whisper + GPT)
      get().trackUsage(1000, 0.02);

      return cards;
    } catch (error: any) {
      set({
        error: error.message || 'Fehler beim Verarbeiten der Audioaufnahme',
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

  // Audio Recording
  startRecording: async () => {
    try {
      const { Audio } = await import('expo-av');

      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Mikrofonzugriff verweigert');
      }

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      // Store recording instance (we'll need to manage this differently in production)
      (global as any).currentRecording = recording;

      set({
        audioRecording: {
          isRecording: true,
          uri: null,
          duration: 0,
        },
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  },

  stopRecording: async () => {
    try {
      const recording = (global as any).currentRecording;
      if (!recording) {
        throw new Error('Keine aktive Aufnahme');
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (!uri) {
        throw new Error('Keine Aufnahme-URI erhalten');
      }

      // Clean up
      delete (global as any).currentRecording;

      set({
        audioRecording: {
          isRecording: false,
          uri,
          duration: 0,
        },
      });

      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  },

  // Clear generated cards
  clearGeneratedCards: () => {
    set({ generatedCards: [], error: null });
  },

  // Save generated cards to deck
  saveGeneratedCards: async (deckId: string, cards: GeneratedCard[]) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht authentifiziert');

      // Convert generated cards to database format
      const cardsToInsert = cards.map((card, index) => ({
        deck_id: deckId,
        type: card.type,
        content: card.content,
        position: index,
        created_by: user.id,
      }));

      const { error } = await supabase.from('cards').insert(cardsToInsert);

      if (error) throw error;

      // Track AI-generated cards
      const aiTracking = cards.map((card) => ({
        generation_method: card.metadata.source,
        confidence_score: card.metadata.confidence,
        source_data: { tags: card.metadata.tags },
      }));

      await supabase.from('ai_generated_cards').insert(aiTracking);

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
