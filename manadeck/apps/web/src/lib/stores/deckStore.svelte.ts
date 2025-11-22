import type { Deck, CreateDeckInput, UpdateDeckInput } from '$lib/types/deck';
import { getAuthenticatedSupabase } from '$lib/utils/supabase';
import { authService } from '$lib/services/authService';

// Svelte 5 runes-based deck store
let decks = $state<Deck[]>([]);
let currentDeck = $state<Deck | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);

export const deckStore = {
	get decks() {
		return decks;
	},
	get currentDeck() {
		return currentDeck;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	/**
	 * Fetch all decks for current user
	 */
	async fetchDecks() {
		loading = true;
		error = null;

		try {
			const appToken = authService.getAppToken();
			if (!appToken) {
				throw new Error('Not authenticated');
			}

			const user = authService.getCurrentUser();
			if (!user) {
				throw new Error('No user found');
			}

			const supabase = await getAuthenticatedSupabase(appToken);

			const { data, error: fetchError } = await supabase
				.from('decks')
				.select('*, cards(count)')
				.or(`user_id.eq.${user.id},and(is_public.eq.true,user_id.eq.00000000-0000-0000-0000-000000000001)`)
				.order('updated_at', { ascending: false });

			if (fetchError) throw fetchError;

			// Map card count
			decks = (data || []).map((deck: any) => ({
				...deck,
				card_count: deck.cards?.[0]?.count || 0
			}));
		} catch (err: any) {
			error = err.message || 'Failed to fetch decks';
			console.error('Fetch decks error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Fetch single deck by ID
	 */
	async fetchDeck(id: string) {
		loading = true;
		error = null;

		try {
			const appToken = authService.getAppToken();
			if (!appToken) throw new Error('Not authenticated');

			const supabase = await getAuthenticatedSupabase(appToken);

			const { data, error: fetchError } = await supabase
				.from('decks')
				.select('*, cards(count)')
				.eq('id', id)
				.single();

			if (fetchError) throw fetchError;

			currentDeck = {
				...data,
				card_count: data.cards?.[0]?.count || 0
			};
		} catch (err: any) {
			error = err.message || 'Failed to fetch deck';
			console.error('Fetch deck error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Create new deck
	 */
	async createDeck(input: CreateDeckInput): Promise<Deck | null> {
		loading = true;
		error = null;

		try {
			const appToken = authService.getAppToken();
			if (!appToken) throw new Error('Not authenticated');

			const user = authService.getCurrentUser();
			if (!user) throw new Error('No user found');

			const supabase = await getAuthenticatedSupabase(appToken);

			const newDeck = {
				user_id: user.id,
				title: input.title,
				description: input.description || '',
				is_public: input.is_public ?? false,
				tags: input.tags || [],
				settings: input.settings || {},
				metadata: {}
			};

			const { data, error: createError } = await supabase
				.from('decks')
				.insert(newDeck)
				.select()
				.single();

			if (createError) throw createError;

			const deck = { ...data, card_count: 0 };
			decks = [deck, ...decks];
			return deck;
		} catch (err: any) {
			error = err.message || 'Failed to create deck';
			console.error('Create deck error:', err);
			return null;
		} finally {
			loading = false;
		}
	},

	/**
	 * Update deck
	 */
	async updateDeck(id: string, updates: UpdateDeckInput) {
		loading = true;
		error = null;

		try {
			const appToken = authService.getAppToken();
			if (!appToken) throw new Error('Not authenticated');

			const supabase = await getAuthenticatedSupabase(appToken);

			const { data, error: updateError } = await supabase
				.from('decks')
				.update(updates)
				.eq('id', id)
				.select()
				.single();

			if (updateError) throw updateError;

			// Update in list
			decks = decks.map((d) => (d.id === id ? { ...d, ...data } : d));

			// Update current if it's the same
			if (currentDeck?.id === id) {
				currentDeck = { ...currentDeck, ...data };
			}
		} catch (err: any) {
			error = err.message || 'Failed to update deck';
			console.error('Update deck error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Delete deck
	 */
	async deleteDeck(id: string) {
		loading = true;
		error = null;

		try {
			const appToken = authService.getAppToken();
			if (!appToken) throw new Error('Not authenticated');

			const supabase = await getAuthenticatedSupabase(appToken);

			const { error: deleteError } = await supabase.from('decks').delete().eq('id', id);

			if (deleteError) throw deleteError;

			// Remove from list
			decks = decks.filter((d) => d.id !== id);

			// Clear current if it's the same
			if (currentDeck?.id === id) {
				currentDeck = null;
			}
		} catch (err: any) {
			error = err.message || 'Failed to delete deck';
			console.error('Delete deck error:', err);
		} finally {
			loading = false;
		}
	},

	/**
	 * Clear error
	 */
	clearError() {
		error = null;
	}
};
