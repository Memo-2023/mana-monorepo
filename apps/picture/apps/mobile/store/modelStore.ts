import { create } from 'zustand';
import { Model, getActiveModels } from '~/services/models';
import { logger } from '~/utils/logger';

interface ModelState {
	// State
	models: Model[];
	selectedModel: Model | null;
	isLoading: boolean;
	error: string | null;
	lastFetch: number | null;

	// Actions
	loadModels: (force?: boolean) => Promise<void>;
	setSelectedModel: (model: Model | null) => void;
	clearError: () => void;
	resetLoadingState: () => void;

	// Derived state
	getDefaultModel: () => Model | null;
	isStale: () => boolean;
}

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

export const useModelStore = create<ModelState>((set, get) => ({
	// Initial state
	models: [],
	selectedModel: null,
	isLoading: false,
	error: null,
	lastFetch: null,

	// Load models with caching
	loadModels: async (force = false) => {
		const state = get();

		// Check if we should skip loading (cache is fresh and not forced)
		// IMPORTANT: Don't use cache if there was an error or no models
		if (!force && state.models.length > 0 && !state.error && !state.isStale()) {
			logger.debug('Using cached models');

			// If no model is selected yet, select the default one
			if (!state.selectedModel && state.models.length > 0) {
				const defaultModel = state.getDefaultModel();
				if (defaultModel) {
					set({ selectedModel: defaultModel });
				}
			}

			return;
		}

		// If already loading, just return without waiting
		// This prevents multiple components from creating race conditions
		if (state.isLoading && !force) {
			logger.debug('Model loading already in progress, skipping...');
			return;
		}

		logger.info('Loading models from server');
		set({ isLoading: true, error: null });

		// Set up a safety timeout to prevent stuck loading state
		const timeoutId = setTimeout(() => {
			const currentState = get();
			if (currentState.isLoading) {
				logger.warn('Model loading timeout, resetting state');
				set({
					isLoading: false,
					error: 'Timeout beim Laden der Modelle. Bitte erneut versuchen.',
				});
			}
		}, 10000); // 10 second timeout

		try {
			const models = await getActiveModels();
			const now = Date.now();

			// Clear the timeout since we completed successfully
			clearTimeout(timeoutId);

			// Check if we actually got models
			if (!models || models.length === 0) {
				logger.warn('No models returned from API');
				set({
					models: [],
					selectedModel: null,
					isLoading: false,
					error: 'Keine Modelle verfügbar. Bitte wende dich an den Support.',
					lastFetch: now,
				});
				return;
			}

			// Find default model
			const defaultModel = models.find((m) => m.isDefault) || models[0] || null;

			set({
				models,
				selectedModel: state.selectedModel || defaultModel,
				isLoading: false,
				error: null,
				lastFetch: now,
			});

			logger.success(`Loaded ${models.length} models`);
		} catch (error: any) {
			// Clear the timeout since we completed (with error)
			clearTimeout(timeoutId);

			logger.error('Error loading models:', error);

			// More specific error messages
			let errorMessage = 'Fehler beim Laden der Modelle';
			if (error.message?.includes('Failed to fetch')) {
				errorMessage = 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.';
			} else if (error.message?.includes('401') || error.message?.includes('403')) {
				errorMessage = 'Authentifizierungsfehler. Bitte melde dich erneut an.';
			} else if (error.message) {
				errorMessage = error.message;
			}

			set({
				models: [],
				selectedModel: null,
				isLoading: false,
				error: errorMessage,
				lastFetch: null, // Don't cache failed requests
			});
		}
	},

	// Set selected model
	setSelectedModel: (model) => {
		set({ selectedModel: model });
	},

	// Clear error
	clearError: () => {
		set({ error: null });
	},

	// Reset loading state - emergency function to fix stuck loading
	resetLoadingState: () => {
		set({ isLoading: false });
		logger.debug('Loading state reset');
	},

	// Get default model
	getDefaultModel: () => {
		const { models } = get();
		return models.find((m) => m.isDefault) || models[0] || null;
	},

	// Check if cache is stale
	isStale: () => {
		const { lastFetch } = get();
		if (!lastFetch) return true;
		return Date.now() - lastFetch > CACHE_TTL;
	},
}));

// Helper hook for convenient access to commonly used values
export const useModelSelection = () => {
	const {
		models,
		selectedModel,
		isLoading,
		error,
		setSelectedModel,
		loadModels,
		clearError,
		resetLoadingState,
	} = useModelStore();

	return {
		models,
		selectedModel,
		isLoading,
		error,
		hasModels: models.length > 0,
		setSelectedModel,
		loadModels,
		clearError,
		resetLoadingState,
	};
};

// Background loader - can be called from app initialization
export const preloadModels = async () => {
	logger.info('Preloading models in background');
	const store = useModelStore.getState();
	await store.loadModels();
};
