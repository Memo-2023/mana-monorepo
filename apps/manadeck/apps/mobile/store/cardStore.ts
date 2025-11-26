import { create } from 'zustand';
import { supabase, getAuthenticatedSupabase } from '../utils/supabase';

// Content types for different card types
export interface TextContent {
  text: string;
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
}

export interface FlashcardContent {
  front: string;
  back: string;
  hint?: string;
}

export interface QuizContent {
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

export interface MixedContent {
  blocks: ContentBlock[];
}

export type ContentBlock =
  | { type: 'text'; data: { text: string } }
  | { type: 'image'; data: { url: string; caption?: string } }
  | { type: 'quiz'; data: QuizContent }
  | { type: 'flashcard'; data: FlashcardContent };

export type CardContent = TextContent | FlashcardContent | QuizContent | MixedContent;

export interface Card {
  id: string;
  deck_id: string;
  position: number;
  title?: string;
  content: CardContent;
  card_type: 'text' | 'flashcard' | 'quiz' | 'mixed';
  ai_model?: string;
  ai_prompt?: string;
  version: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

interface CardState {
  cards: Card[];
  currentCard: Card | null;
  isLoading: boolean;
  error: string | null;

  // CRUD Operations
  fetchCards: (deckId: string) => Promise<void>;
  fetchCard: (id: string) => Promise<void>;
  createCard: (deckId: string, cardData: Partial<Card>) => Promise<Card>;
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  duplicateCard: (id: string) => Promise<Card>;

  // Organization
  reorderCards: (deckId: string, cardIds: string[]) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;

  // Bulk operations
  deleteMultipleCards: (ids: string[]) => Promise<void>;
  moveCardsToDecks: (cardIds: string[], targetDeckId: string) => Promise<void>;

  // Utility
  clearError: () => void;
  resetCards: () => void;
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  currentCard: null,
  isLoading: false,
  error: null,

  fetchCards: async (deckId: string) => {
    try {
      set({ isLoading: true, error: null });

      // Use authenticated Supabase client with Mana token for RLS
      const authenticatedSupabase = await getAuthenticatedSupabase();

      const { data, error } = await authenticatedSupabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId)
        .order('position', { ascending: true });

      console.log('[DEBUG] fetchCards - Deck ID:', deckId);
      console.log('[DEBUG] fetchCards - Cards found:', data?.length || 0);
      console.log('[DEBUG] fetchCards - Error:', error);

      if (error) throw error;

      set({ cards: data || [] });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch cards' });
      console.error('[ERROR] fetchCards:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCard: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      // Use authenticated Supabase client with Mana token for RLS
      const authenticatedSupabase = await getAuthenticatedSupabase();

      const { data, error } = await authenticatedSupabase
        .from('cards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      set({ currentCard: data });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch card' });
      console.error('[ERROR] fetchCard:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createCard: async (deckId: string, cardData: Partial<Card>) => {
    try {
      set({ isLoading: true, error: null });

      // Use authenticated Supabase client with Mana token for RLS
      const authenticatedSupabase = await getAuthenticatedSupabase();

      // Get next position
      const { data: existingCards } = await authenticatedSupabase
        .from('cards')
        .select('position')
        .eq('deck_id', deckId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existingCards?.[0]?.position ? existingCards[0].position + 1 : 1;

      const { data, error } = await authenticatedSupabase
        .from('cards')
        .insert({
          deck_id: deckId,
          position: nextPosition,
          title: cardData.title || '',
          content: cardData.content || { text: '' },
          card_type: cardData.card_type || 'text',
          ai_model: cardData.ai_model,
          ai_prompt: cardData.ai_prompt,
          version: 1,
          is_favorite: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const cards = get().cards;
      set({ cards: [...cards, data] });

      return data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create card' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateCard: async (id: string, updates: Partial<Card>) => {
    try {
      set({ isLoading: true, error: null });

      // Use authenticated Supabase client with Mana token for RLS
      const authenticatedSupabase = await getAuthenticatedSupabase();

      const { error } = await authenticatedSupabase
        .from('cards')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          version: updates.version ? updates.version + 1 : undefined,
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      const cards = get().cards;
      set({
        cards: cards.map((card) => (card.id === id ? { ...card, ...updates } : card)),
      });

      // Update current card if it's the one being edited
      if (get().currentCard?.id === id) {
        set({ currentCard: { ...get().currentCard!, ...updates } });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to update card' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteCard: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      // Use authenticated Supabase client with Mana token for RLS
      const authenticatedSupabase = await getAuthenticatedSupabase();

      const { error } = await authenticatedSupabase.from('cards').delete().eq('id', id);

      if (error) throw error;

      // Remove from local state
      const cards = get().cards;
      set({ cards: cards.filter((card) => card.id !== id) });

      // Clear current card if it was deleted
      if (get().currentCard?.id === id) {
        set({ currentCard: null });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete card' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  duplicateCard: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      const cardToDuplicate = get().cards.find((card) => card.id === id);
      if (!cardToDuplicate) throw new Error('Card not found');

      // Use authenticated Supabase client with Mana token for RLS
      const authenticatedSupabase = await getAuthenticatedSupabase();

      const { data, error } = await authenticatedSupabase
        .from('cards')
        .insert({
          deck_id: cardToDuplicate.deck_id,
          position: cardToDuplicate.position + 1,
          title: cardToDuplicate.title ? `${cardToDuplicate.title} (Kopie)` : '',
          content: cardToDuplicate.content,
          card_type: cardToDuplicate.card_type,
          ai_model: cardToDuplicate.ai_model,
          ai_prompt: cardToDuplicate.ai_prompt,
          version: 1,
          is_favorite: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const cards = get().cards;
      const insertIndex = cards.findIndex((card) => card.id === id) + 1;
      const newCards = [...cards];
      newCards.splice(insertIndex, 0, data);
      set({ cards: newCards });

      return data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to duplicate card' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  reorderCards: async (deckId: string, cardIds: string[]) => {
    try {
      set({ isLoading: true, error: null });

      // Use authenticated Supabase client with Mana token for RLS
      const authenticatedSupabase = await getAuthenticatedSupabase();

      // Update positions in database
      const updates = cardIds.map((cardId, index) => ({
        id: cardId,
        position: index + 1,
      }));

      for (const update of updates) {
        await authenticatedSupabase
          .from('cards')
          .update({ position: update.position })
          .eq('id', update.id);
      }

      // Refresh cards to get correct order
      await get().fetchCards(deckId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to reorder cards' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (id: string) => {
    try {
      const card = get().cards.find((c) => c.id === id);
      if (!card) return;

      const newFavoriteState = !card.is_favorite;

      await get().updateCard(id, {
        is_favorite: newFavoriteState,
      });
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
    }
  },

  deleteMultipleCards: async (ids: string[]) => {
    try {
      set({ isLoading: true, error: null });

      // Use authenticated Supabase client with Mana token for RLS
      const authenticatedSupabase = await getAuthenticatedSupabase();

      const { error } = await authenticatedSupabase.from('cards').delete().in('id', ids);

      if (error) throw error;

      // Remove from local state
      const cards = get().cards;
      set({ cards: cards.filter((card) => !ids.includes(card.id)) });
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete cards' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  moveCardsToDecks: async (cardIds: string[], targetDeckId: string) => {
    try {
      set({ isLoading: true, error: null });

      // Use authenticated Supabase client with Mana token for RLS
      const authenticatedSupabase = await getAuthenticatedSupabase();

      // Get highest position in target deck
      const { data: targetCards } = await authenticatedSupabase
        .from('cards')
        .select('position')
        .eq('deck_id', targetDeckId)
        .order('position', { ascending: false })
        .limit(1);

      let nextPosition = targetCards?.[0]?.position ? targetCards[0].position + 1 : 1;

      // Move each card
      for (const cardId of cardIds) {
        await authenticatedSupabase
          .from('cards')
          .update({
            deck_id: targetDeckId,
            position: nextPosition++,
          })
          .eq('id', cardId);
      }

      // Remove moved cards from local state
      const cards = get().cards;
      set({ cards: cards.filter((card) => !cardIds.includes(card.id)) });
    } catch (error: any) {
      set({ error: error.message || 'Failed to move cards' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  resetCards: () => set({ cards: [], currentCard: null }),
}));
