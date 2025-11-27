/**
 * Consolidated Quotes Store
 * Kombiniert die Funktionalität aller Quote-Stores
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EnhancedQuote, Author } from '@quote/shared';
import { multilingualContentLoader } from '../services/multilingualContentLoader';
import { WidgetDataManager, WidgetQuote } from './widgetDataManager';
import { useSettingsStore } from './settingsStore';
import { STORAGE_KEYS } from '~/constants/storageKeys';
import { DataBackupService } from '~/services/dataBackup';

// User Quote Types
export interface UserQuote {
	id: string;
	text: string;
	author: string;
	categories?: string[];
	quoteDate?: string; // Date when the quote was said/written
	createdAt: string;
	updatedAt: string;
	isFavorite?: boolean;
}

export interface UserQuoteInput {
	text: string;
	author?: string;
	categories?: string[];
	quoteDate?: string;
}

interface QuotesState {
	// Core Data
	quotes: EnhancedQuote[];
	authors: Author[];
	favorites: string[]; // Only store IDs for persistence
	favoriteAuthors: string[]; // Store author IDs for persistence
	userQuotes: UserQuote[]; // User's own quotes
	dailyQuote: EnhancedQuote | null;

	// Navigation State
	currentQuote: EnhancedQuote | null;
	currentQuoteIndex: number;

	// Filter State
	selectedCategory: string | null;
	selectedAuthor: string | null;
	searchQuery: string;

	// Metadata
	categories: string[];
	tags: string[];
	isLoading: boolean;
	isInitialized: boolean;
	hasHydrated: boolean;
	currentLanguage: 'de' | 'en';

	// Core Actions
	initializeStore: () => Promise<void>;
	changeLanguage: (lang: 'de' | 'en') => void;
	reloadContent: () => void;
	resetStore: () => void;

	// Navigation Actions
	getNextQuote: () => void;
	getPreviousQuote: () => void;
	getRandomQuote: (category?: string) => void;
	setCurrentQuote: (quote: EnhancedQuote) => void;
	navigateToQuote: (quoteId: string) => void;

	// Favorite Actions
	toggleFavorite: (quoteId: string) => void;
	getFavorites: () => EnhancedQuote[];
	isFavorite: (quoteId: string) => boolean;
	clearFavorites: () => void;

	// Author Favorite Actions
	toggleAuthorFavorite: (authorId: string) => void;
	getFavoriteAuthors: () => Author[];
	isAuthorFavorite: (authorId: string) => boolean;
	clearAuthorFavorites: () => void;

	// User Quote Actions
	addUserQuote: (quote: UserQuoteInput) => void;
	updateUserQuote: (id: string, updates: Partial<UserQuote>) => void;
	deleteUserQuote: (id: string) => void;
	getUserQuotes: () => UserQuote[];
	toggleUserQuoteFavorite: (id: string) => void;

	// Filter Actions
	setCategory: (category: string | null) => void;
	setAuthor: (authorId: string | null) => void;
	setSearchQuery: (query: string) => void;
	clearFilters: () => void;
	getFilteredQuotes: () => EnhancedQuote[];

	// Daily Quote
	loadDailyQuote: () => void;

	// Statistics
	getStats: () => {
		totalQuotes: number;
		totalFavorites: number;
		quotesViewed: Set<string>;
		favoriteAuthors: Author[];
		favoriteCategories: string[];
	};

	// History tracking
	viewHistory: string[];
	addToHistory: (quoteId: string) => void;
	clearHistory: () => void;

	// Cloud Sync Actions
	exportToCloud: () => Promise<boolean>;
	importFromCloud: () => Promise<boolean>;
	lastSyncDate: string | null;
	isSyncing: boolean;
}

export const useQuotesStore = create<QuotesState>()(
	persist(
		(set, get) => ({
			// Initial State
			quotes: [],
			authors: [],
			favorites: [],
			favoriteAuthors: [],
			userQuotes: [],
			dailyQuote: null,
			currentQuote: null,
			currentQuoteIndex: 0,
			selectedCategory: null,
			selectedAuthor: null,
			searchQuery: '',
			categories: [],
			tags: [],
			isLoading: false,
			isInitialized: false,
			hasHydrated: false,
			currentLanguage: 'de',
			viewHistory: [],
			lastSyncDate: null,
			isSyncing: false,

			// Core Actions
			initializeStore: async () => {
				const state = get();

				// Prevent multiple simultaneous initializations
				if (state.isLoading) {
					console.log('[Store] Already initializing, skipping...');
					return;
				}

				if (state.isInitialized) {
					// If already initialized, just reload with current language
					const language = useSettingsStore.getState().language;
					multilingualContentLoader.setLanguage(language);
					set({ currentLanguage: language });
					state.reloadContent();
					return;
				}

				console.log('[Store] Starting initialization...');
				set({ isLoading: true });

				try {
					// Get current language from settings
					const language = useSettingsStore.getState().language;
					multilingualContentLoader.setLanguage(language);

					// Load all content - wrapped in try-catch for safety
					const quotes = multilingualContentLoader.getAllQuotes();
					const authors = multilingualContentLoader.getAllAuthors();
					const categories = multilingualContentLoader.getAllCategories();
					const tags = multilingualContentLoader.getAllTags();
					const dailyQuote = multilingualContentLoader.getDailyQuote();

					// Verify we have data
					if (!quotes || quotes.length === 0) {
						console.error('No quotes loaded from content loader');
						throw new Error('Failed to load quotes data');
					}

					// Restore favorite status
					const { favorites } = get();
					const favoritesSet = new Set(favorites);
					const quotesWithFavorites = quotes.map((quote) => ({
						...quote,
						isFavorite: favoritesSet.has(quote.id),
					}));

					set({
						quotes: quotesWithFavorites,
						authors,
						categories,
						tags,
						currentQuote: quotesWithFavorites[0] || null,
						dailyQuote: dailyQuote
							? {
									...dailyQuote,
									isFavorite: favorites.includes(dailyQuote.id),
								}
							: null,
						currentLanguage: language,
						isLoading: false,
						isInitialized: true,
					});

					// Add first quote to history if exists
					if (quotesWithFavorites[0]) {
						get().addToHistory(quotesWithFavorites[0].id);
					}

					// Send daily quote to widget
					if (dailyQuote && dailyQuote.author) {
						await WidgetDataManager.saveDailyQuote({
							quote: dailyQuote.text,
							author: dailyQuote.author.name,
							category: dailyQuote.category,
						});
					}

					// Send initial favorite quotes to widget
					const favoriteQuotes = quotesWithFavorites
						.filter((q) => favorites.includes(q.id))
						.slice(0, 20)
						.map(
							(q): WidgetQuote => ({
								quote: q.text,
								author: q.author?.name || 'Unbekannt',
								category: q.category || 'general',
							})
						);
					if (favoriteQuotes.length > 0) {
						await WidgetDataManager.saveFavoriteQuotes(favoriteQuotes);
					}

					// Erstelle automatisches Backup nach erfolgreicher Initialisierung
					// Dies schützt vor Datenverlust bei App-Updates
					DataBackupService.createBackup().catch((error) => {
						console.error('[Store] Error creating backup:', error);
					});
				} catch (error) {
					console.error('Error initializing store:', error);
					// Set initialized to true anyway to prevent infinite loading
					set({ isLoading: false, isInitialized: true });
				}
			},

			changeLanguage: (lang: 'de' | 'en') => {
				multilingualContentLoader.setLanguage(lang);
				set({ currentLanguage: lang });
				get().reloadContent();
			},

			reloadContent: () => {
				const { favorites } = get();

				// Reload all content with new language
				const quotes = multilingualContentLoader.getAllQuotes();
				const authors = multilingualContentLoader.getAllAuthors();
				const categories = multilingualContentLoader.getAllCategories();
				const tags = multilingualContentLoader.getAllTags();
				const dailyQuote = multilingualContentLoader.getDailyQuote();

				// Restore favorite status
				const favoritesSet = new Set(favorites);
				const quotesWithFavorites = quotes.map((quote) => ({
					...quote,
					isFavorite: favoritesSet.has(quote.id),
				}));

				set({
					quotes: quotesWithFavorites,
					authors,
					categories,
					tags,
					currentQuote: quotesWithFavorites[0] || null,
					dailyQuote: dailyQuote
						? {
								...dailyQuote,
								isFavorite: favorites.includes(dailyQuote.id),
							}
						: null,
				});
			},

			resetStore: () => {
				set({
					quotes: [],
					authors: [],
					favorites: [],
					favoriteAuthors: [],
					dailyQuote: null,
					currentQuote: null,
					currentQuoteIndex: 0,
					selectedCategory: null,
					selectedAuthor: null,
					searchQuery: '',
					categories: [],
					tags: [],
					isLoading: false,
					isInitialized: false,
					viewHistory: [],
				});
			},

			// Navigation Actions
			getNextQuote: () => {
				const filteredQuotes = get().getFilteredQuotes();
				if (filteredQuotes.length === 0) return;

				const { currentQuoteIndex } = get();
				const nextIndex = (currentQuoteIndex + 1) % filteredQuotes.length;
				const nextQuote = filteredQuotes[nextIndex];

				set({
					currentQuoteIndex: nextIndex,
					currentQuote: nextQuote,
				});

				get().addToHistory(nextQuote.id);
			},

			getPreviousQuote: () => {
				const filteredQuotes = get().getFilteredQuotes();
				if (filteredQuotes.length === 0) return;

				const { currentQuoteIndex } = get();
				const prevIndex =
					currentQuoteIndex === 0 ? filteredQuotes.length - 1 : currentQuoteIndex - 1;
				const prevQuote = filteredQuotes[prevIndex];

				set({
					currentQuoteIndex: prevIndex,
					currentQuote: prevQuote,
				});

				get().addToHistory(prevQuote.id);
			},

			getRandomQuote: (category?: string) => {
				const { quotes } = get();
				let availableQuotes = quotes;

				if (category) {
					availableQuotes = quotes.filter((q) => q.categories?.includes(category));
				} else {
					availableQuotes = get().getFilteredQuotes();
				}

				if (availableQuotes.length === 0) return;

				const randomIndex = Math.floor(Math.random() * availableQuotes.length);
				const randomQuote = availableQuotes[randomIndex];

				// Find index in filtered quotes
				const filteredQuotes = get().getFilteredQuotes();
				const index = filteredQuotes.findIndex((q) => q.id === randomQuote.id);

				set({
					currentQuoteIndex: index >= 0 ? index : 0,
					currentQuote: randomQuote,
				});

				get().addToHistory(randomQuote.id);
			},

			setCurrentQuote: (quote) => {
				const filteredQuotes = get().getFilteredQuotes();
				const index = filteredQuotes.findIndex((q) => q.id === quote.id);

				set({
					currentQuote: quote,
					currentQuoteIndex: index >= 0 ? index : 0,
				});

				get().addToHistory(quote.id);
			},

			navigateToQuote: (quoteId) => {
				const { quotes } = get();
				const quote = quotes.find((q) => q.id === quoteId);

				if (quote) {
					get().setCurrentQuote(quote);
				}
			},

			// Favorite Actions
			toggleFavorite: async (quoteId) => {
				const { favorites, quotes, currentQuote, dailyQuote } = get();
				const isFavorite = favorites.includes(quoteId);

				const newFavorites = isFavorite
					? favorites.filter((id) => id !== quoteId)
					: [...favorites, quoteId];

				const updatedQuotes = quotes.map((q) =>
					q.id === quoteId ? { ...q, isFavorite: !isFavorite } : q
				);

				// Update widget with favorite quotes
				const favoriteQuotes = updatedQuotes
					.filter((q) => newFavorites.includes(q.id))
					.map(
						(q): WidgetQuote => ({
							quote: q.text,
							author: q.author?.name || 'Unbekannt',
							category: q.category || 'general',
						})
					);
				await WidgetDataManager.saveFavoriteQuotes(favoriteQuotes);

				const updates: Partial<QuotesState> = {
					favorites: newFavorites,
					quotes: updatedQuotes,
				};

				if (currentQuote?.id === quoteId) {
					updates.currentQuote = { ...currentQuote, isFavorite: !isFavorite };
				}

				if (dailyQuote?.id === quoteId) {
					updates.dailyQuote = { ...dailyQuote, isFavorite: !isFavorite };
				}

				set(updates);

				// Erstelle Backup nach Favoriten-Änderung (throttled)
				DataBackupService.createBackup().catch((error) => {
					console.error('[Store] Error creating backup after favorite toggle:', error);
				});
			},

			getFavorites: () => {
				const { quotes, favorites } = get();
				return quotes.filter((q) => favorites.includes(q.id));
			},

			isFavorite: (quoteId) => {
				return get().favorites.includes(quoteId);
			},

			clearFavorites: () => {
				const { quotes } = get();
				set({
					favorites: [],
					quotes: quotes.map((q) => ({ ...q, isFavorite: false })),
					currentQuote: get().currentQuote ? { ...get().currentQuote!, isFavorite: false } : null,
				});
			},

			// Author Favorite Actions
			toggleAuthorFavorite: (authorId) => {
				const { favoriteAuthors } = get();
				const isFavorite = favoriteAuthors.includes(authorId);

				const newFavoriteAuthors = isFavorite
					? favoriteAuthors.filter((id) => id !== authorId)
					: [...favoriteAuthors, authorId];

				set({ favoriteAuthors: newFavoriteAuthors });
			},

			getFavoriteAuthors: () => {
				const { authors, favoriteAuthors } = get();
				return authors.filter((a) => favoriteAuthors.includes(a.id));
			},

			isAuthorFavorite: (authorId) => {
				return get().favoriteAuthors.includes(authorId);
			},

			clearAuthorFavorites: () => {
				set({ favoriteAuthors: [] });
			},

			// User Quote Actions
			addUserQuote: (quote) => {
				const newQuote: UserQuote = {
					id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
					text: quote.text,
					author: quote.author || 'Ich',
					categories: quote.categories || [],
					quoteDate: quote.quoteDate,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					isFavorite: false,
				};

				set((state) => ({
					userQuotes: [newQuote, ...state.userQuotes],
				}));
			},

			updateUserQuote: (id, updates) => {
				set((state) => ({
					userQuotes: state.userQuotes.map((quote) =>
						quote.id === id ? { ...quote, ...updates, updatedAt: new Date().toISOString() } : quote
					),
				}));
			},

			deleteUserQuote: (id) => {
				set((state) => ({
					userQuotes: state.userQuotes.filter((quote) => quote.id !== id),
				}));
			},

			getUserQuotes: () => {
				return get().userQuotes;
			},

			toggleUserQuoteFavorite: (id) => {
				set((state) => ({
					userQuotes: state.userQuotes.map((quote) =>
						quote.id === id ? { ...quote, isFavorite: !quote.isFavorite } : quote
					),
				}));
			},

			// Filter Actions
			setCategory: (category) => {
				set({
					selectedCategory: category,
					currentQuoteIndex: 0,
				});

				const filteredQuotes = get().getFilteredQuotes();
				if (filteredQuotes.length > 0) {
					const firstQuote = filteredQuotes[0];
					set({ currentQuote: firstQuote });
					get().addToHistory(firstQuote.id);
				}
			},

			setAuthor: (authorId) => {
				set({
					selectedAuthor: authorId,
					currentQuoteIndex: 0,
				});

				const filteredQuotes = get().getFilteredQuotes();
				if (filteredQuotes.length > 0) {
					const firstQuote = filteredQuotes[0];
					set({ currentQuote: firstQuote });
					get().addToHistory(firstQuote.id);
				}
			},

			setSearchQuery: (query) => {
				set({
					searchQuery: query,
					currentQuoteIndex: 0,
				});

				const filteredQuotes = get().getFilteredQuotes();
				if (filteredQuotes.length > 0) {
					const firstQuote = filteredQuotes[0];
					set({ currentQuote: firstQuote });
					get().addToHistory(firstQuote.id);
				}
			},

			clearFilters: () => {
				set({
					selectedCategory: null,
					selectedAuthor: null,
					searchQuery: '',
					currentQuoteIndex: 0,
				});

				const { quotes } = get();
				if (quotes.length > 0) {
					const firstQuote = quotes[0];
					set({ currentQuote: firstQuote });
					get().addToHistory(firstQuote.id);
				}
			},

			getFilteredQuotes: () => {
				const { quotes, selectedCategory, selectedAuthor, searchQuery } = get();

				let filtered = quotes;

				if (selectedCategory) {
					filtered = filtered.filter((q) => q.categories?.includes(selectedCategory));
				}

				if (selectedAuthor) {
					filtered = filtered.filter((q) => q.authorId === selectedAuthor);
				}

				if (searchQuery) {
					const query = searchQuery.toLowerCase();
					filtered = filtered.filter(
						(q) =>
							q.text.toLowerCase().includes(query) ||
							q.author?.name.toLowerCase().includes(query) ||
							q.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
							q.categories?.some((cat) => cat.toLowerCase().includes(query))
					);
				}

				return filtered;
			},

			// Daily Quote
			loadDailyQuote: () => {
				const dailyQuote = multilingualContentLoader.getDailyQuote();
				if (dailyQuote) {
					const { favorites } = get();
					set({
						dailyQuote: {
							...dailyQuote,
							isFavorite: favorites.includes(dailyQuote.id),
						},
					});
				}
			},

			// Statistics
			getStats: () => {
				const { quotes, favorites, authors, viewHistory } = get();

				// Find favorite authors based on favorites
				const authorCounts = new Map<string, number>();
				favorites.forEach((quoteId) => {
					const quote = quotes.find((q) => q.id === quoteId);
					if (quote?.authorId) {
						authorCounts.set(quote.authorId, (authorCounts.get(quote.authorId) || 0) + 1);
					}
				});

				const favoriteAuthors = Array.from(authorCounts.entries())
					.sort((a, b) => b[1] - a[1])
					.slice(0, 3)
					.map(([authorId]) => authors.find((a) => a.id === authorId))
					.filter(Boolean) as Author[];

				// Find favorite categories
				const categoryCounts = new Map<string, number>();
				favorites.forEach((quoteId) => {
					const quote = quotes.find((q) => q.id === quoteId);
					quote?.categories?.forEach((category) => {
						categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
					});
				});

				const favoriteCategories = Array.from(categoryCounts.entries())
					.sort((a, b) => b[1] - a[1])
					.slice(0, 5)
					.map(([category]) => category);

				return {
					totalQuotes: quotes.length,
					totalFavorites: favorites.length,
					quotesViewed: new Set(viewHistory),
					favoriteAuthors,
					favoriteCategories,
				};
			},

			// History Actions
			addToHistory: (quoteId) => {
				const { viewHistory } = get();

				// Limit history to last 100 items
				const newHistory = [quoteId, ...viewHistory.filter((id) => id !== quoteId)].slice(0, 100);
				set({ viewHistory: newHistory });
			},

			clearHistory: () => {
				set({ viewHistory: [] });
			},

			// Cloud Sync Actions
			exportToCloud: async () => {
				set({ isSyncing: true });
				try {
					const { CloudSyncService } = await import('../services/cloudSync/cloudSyncService');
					const state = get();
					const settingsState = useSettingsStore.getState();

					const syncData = {
						favorites: state.favorites,
						favoriteAuthors: state.favoriteAuthors,
						userQuotes: state.userQuotes,
						settings: {
							themeMode: settingsState.themeMode,
							themeType: settingsState.themeType,
							fontSize: settingsState.fontSize,
							language: settingsState.language,
							userName: settingsState.userName,
							enableHaptics: settingsState.enableHaptics,
							enableAnimations: settingsState.enableAnimations,
							autoPlayQuotes: settingsState.autoPlayQuotes,
							autoPlayInterval: settingsState.autoPlayInterval,
						},
						viewHistory: state.viewHistory.slice(0, 50),
						exportDate: new Date().toISOString(),
						version: '1.0',
						deviceId: await CloudSyncService.getDeviceId(),
					};

					const success = await CloudSyncService.exportData(syncData);
					if (success) {
						set({ lastSyncDate: new Date().toISOString() });
					}
					return success;
				} catch (error) {
					console.error('Export to cloud error:', error);
					return false;
				} finally {
					set({ isSyncing: false });
				}
			},

			importFromCloud: async () => {
				set({ isSyncing: true });
				try {
					const { CloudSyncService } = await import('../services/cloudSync/cloudSyncService');
					const syncData = await CloudSyncService.importData();

					if (!syncData) return false;

					const state = get();
					const settingsStore = useSettingsStore.getState();

					// Merge favorites (don't replace, add missing ones)
					const newFavorites = [...new Set([...state.favorites, ...syncData.favorites])];
					const newFavoriteAuthors = [
						...new Set([...state.favoriteAuthors, ...syncData.favoriteAuthors]),
					];

					// Merge user quotes (check for duplicates by id)
					const existingQuoteIds = state.userQuotes.map((q) => q.id);
					const newUserQuotes = [
						...state.userQuotes,
						...syncData.userQuotes.filter((q) => !existingQuoteIds.includes(q.id)),
					];

					// Update state
					set({
						favorites: newFavorites,
						favoriteAuthors: newFavoriteAuthors,
						userQuotes: newUserQuotes,
						viewHistory: [...new Set([...state.viewHistory, ...syncData.viewHistory])].slice(
							0,
							100
						),
						lastSyncDate: new Date().toISOString(),
					});

					// Update quotes with favorite status
					const updatedQuotes = state.quotes.map((quote) => ({
						...quote,
						isFavorite: newFavorites.includes(quote.id),
					}));
					set({ quotes: updatedQuotes });

					// Update settings if provided
					if (syncData.settings) {
						const settings = syncData.settings;
						settingsStore.setLanguage(settings.language || 'de');
						settingsStore.setThemeMode(settings.themeMode || 'system');
						settingsStore.setThemeType(settings.themeType || 'default');
						settingsStore.setFontSize(settings.fontSize || 'medium');
						settingsStore.setUserName(settings.userName || '');
						settingsStore.setHaptics(settings.enableHaptics ?? true);
						settingsStore.setAnimations(settings.enableAnimations ?? true);
						settingsStore.setAutoPlay(settings.autoPlayQuotes ?? false);
						settingsStore.setAutoPlayInterval(settings.autoPlayInterval || 10);
					}

					return true;
				} catch (error) {
					console.error('Import from cloud error:', error);
					return false;
				} finally {
					set({ isSyncing: false });
				}
			},
		}),
		{
			name: STORAGE_KEYS.QUOTES,
			storage: createJSONStorage(() => AsyncStorage),
			partialize: (state) => ({
				favorites: state.favorites,
				favoriteAuthors: state.favoriteAuthors,
				userQuotes: state.userQuotes,
				viewHistory: state.viewHistory.slice(0, 50), // Only persist last 50
				currentQuoteIndex: state.currentQuoteIndex,
				selectedCategory: state.selectedCategory,
				selectedAuthor: state.selectedAuthor,
			}),
			onRehydrateStorage: () => (state, error) => {
				if (error) {
					console.error('Error rehydrating quotes storage:', error);
				} else {
					console.log('Quotes storage rehydrated successfully');
				}
				// Mark as hydrated regardless of error to prevent infinite waiting
				if (state) {
					state.hasHydrated = true;
				}
			},
		}
	)
);

// Export convenience hooks
export const useQuote = () => useQuotesStore((state) => state.currentQuote);
export const useFavorites = () => useQuotesStore((state) => state.getFavorites());
export const useIsLoading = () => useQuotesStore((state) => state.isLoading);
export const useQuoteStats = () => useQuotesStore((state) => state.getStats());
