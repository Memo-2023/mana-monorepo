import { create } from 'zustand';
import { apiClient } from '../services/apiClient';
import { useAuthStore } from './authStore';

export interface Deck {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  is_public: boolean;
  settings: Record<string, any>;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  card_count?: number;
}

// Helper to map backend response to frontend format
function mapDeckFromApi(deck: any): Deck {
  return {
    id: deck.id,
    user_id: deck.userId,
    title: deck.title,
    description: deck.description,
    cover_image_url: deck.coverImageUrl,
    is_public: deck.isPublic,
    settings: deck.settings || {},
    tags: deck.tags || [],
    metadata: deck.metadata || {},
    created_at: deck.createdAt,
    updated_at: deck.updatedAt,
    card_count: deck.card_count || 0,
  };
}

interface DeckState {
  decks: Deck[];
  currentDeck: Deck | null;
  isLoading: boolean;
  error: string | null;

  fetchDecks: () => Promise<void>;
  fetchDeck: (id: string) => Promise<void>;
  createDeck: (deck: Partial<Deck>) => Promise<Deck>;
  updateDeck: (id: string, updates: Partial<Deck>) => Promise<void>;
  deleteDeck: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useDeckStore = create<DeckState>((set, get) => ({
  decks: [],
  currentDeck: null,
  isLoading: false,
  error: null,

  fetchDecks: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.getDecks();

      if (response.error) {
        // Check for auth errors
        if (response.error.includes('expired') || response.error.includes('Not authenticated')) {
          useAuthStore.setState({ user: null });
          throw new Error('Session expired. Please sign in again.');
        }
        throw new Error(response.error);
      }

      const decksWithCount = (response.data?.decks || []).map(mapDeckFromApi);
      set({ decks: decksWithCount });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch decks' });
      console.error('Error fetching decks:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDeck: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.getDeck(id);

      if (response.error) {
        if (response.error.includes('expired') || response.error.includes('Not authenticated')) {
          useAuthStore.setState({ user: null });
          throw new Error('Session expired. Please sign in again.');
        }
        throw new Error(response.error);
      }

      const deck = mapDeckFromApi(response.data?.deck);
      set({ currentDeck: deck });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch deck' });
      console.error('Error fetching deck:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createDeck: async (deckData: Partial<Deck>) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.createDeck({
        title: deckData.title || 'Untitled Deck',
        description: deckData.description,
        coverImageUrl: deckData.cover_image_url,
        isPublic: deckData.is_public,
        settings: deckData.settings,
        tags: deckData.tags,
        metadata: deckData.metadata,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const newDeck = mapDeckFromApi(response.data?.deck);
      const decks = get().decks;
      set({ decks: [newDeck, ...decks] });

      return newDeck;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create deck' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateDeck: async (id: string, updates: Partial<Deck>) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.updateDeck(id, {
        title: updates.title,
        description: updates.description,
        coverImageUrl: updates.cover_image_url,
        isPublic: updates.is_public,
        settings: updates.settings,
        tags: updates.tags,
        metadata: updates.metadata,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const decks = get().decks;
      set({
        decks: decks.map((deck) => (deck.id === id ? { ...deck, ...updates } : deck)),
      });

      if (get().currentDeck?.id === id) {
        set({ currentDeck: { ...get().currentDeck!, ...updates } });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to update deck' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteDeck: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.deleteDeck(id);

      if (response.error) {
        throw new Error(response.error);
      }

      const decks = get().decks;
      set({ decks: decks.filter((deck) => deck.id !== id) });

      if (get().currentDeck?.id === id) {
        set({ currentDeck: null });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete deck' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (id: string) => {
    try {
      const deck = get().decks.find((d) => d.id === id);
      if (!deck) return;

      const isFavorite = deck.metadata?.is_favorite || false;

      await get().updateDeck(id, {
        metadata: {
          ...deck.metadata,
          is_favorite: !isFavorite,
        },
      });
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
    }
  },

  clearError: () => set({ error: null }),
}));
