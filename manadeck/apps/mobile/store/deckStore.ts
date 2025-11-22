import { create } from 'zustand';
import { getAuthenticatedSupabase } from '../utils/supabase';
import { authService } from '../services/authService';
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

      // Get authenticated Supabase client with Mana token (auto-refreshes if needed)
      const supabase = await getAuthenticatedSupabase();

      // Get current user ID from token
      const appToken = await authService.getAppToken();
      const user = appToken ? authService.getUserFromToken(appToken) : null;

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('decks')
        .select(
          `
          *,
          card_count:cards(count)
        `
        )
        .or(`user_id.eq.${user.id},and(is_public.eq.true,user_id.eq.00000000-0000-0000-0000-000000000001)`)
        .order('updated_at', { ascending: false });

      if (error) {
        // Check if it's a JWT expiration error
        if (error.code === 'PGRST303' || error.message?.includes('JWT expired') || error.message?.includes('token expired')) {
          // Token expired, clear invalid token and let user re-authenticate
          await authService.clearAuthStorage();
          // Clear user from auth store to trigger redirect to login
          useAuthStore.setState({ user: null });
          throw new Error('Session expired. Please sign in again.');
        }
        throw error;
      }

      const decksWithCount =
        data?.map((deck) => ({
          ...deck,
          card_count: deck.card_count?.[0]?.count || 0,
        })) || [];

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

      // Get authenticated Supabase client with Mana token (auto-refreshes if needed)
      const supabase = await getAuthenticatedSupabase();

      const { data, error } = await supabase
        .from('decks')
        .select(
          `
          *,
          card_count:cards(count)
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        // Check if it's a JWT expiration error
        if (error.code === 'PGRST303' || error.message?.includes('JWT expired') || error.message?.includes('token expired')) {
          // Token expired, clear invalid token and let user re-authenticate
          await authService.clearAuthStorage();
          // Clear user from auth store to trigger redirect to login
          useAuthStore.setState({ user: null });
          throw new Error('Session expired. Please sign in again.');
        }
        throw error;
      }

      const deckWithCount = {
        ...data,
        card_count: data.card_count?.[0]?.count || 0,
      };

      set({ currentDeck: deckWithCount });
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

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('decks')
        .insert({
          ...deckData,
          user_id: user.id,
          settings: deckData.settings || {},
          tags: deckData.tags || [],
          metadata: deckData.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;

      const decks = get().decks;
      set({ decks: [data, ...decks] });

      return data;
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

      const { error } = await supabase
        .from('decks')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

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

      const { error } = await supabase.from('decks').delete().eq('id', id);

      if (error) throw error;

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
