import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import {
	createNativeTheme,
	type NativeTheme,
	type ThemeVariant,
	type ColorMode,
} from '@picture/design-tokens/native';

// ThemeMode includes 'system' for automatic light/dark switching
type ThemeMode = ColorMode | 'system';
type Theme = NativeTheme;

const THEME_VARIANT_KEY = '@picture_app/theme_variant';
const THEME_MODE_KEY = '@picture_app/theme_mode';

interface ThemeStore {
	// State
	variant: ThemeVariant;
	mode: ThemeMode;
	currentTheme: Theme;
	isLoading: boolean;

	// Actions
	setVariant: (variant: ThemeVariant) => Promise<void>;
	setMode: (mode: ThemeMode) => Promise<void>;
	toggleMode: () => void;

	// Initialization
	loadTheme: () => Promise<void>;

	// Internal
	_updateCurrentTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
	// Initial state - will be loaded from AsyncStorage
	variant: 'default',
	mode: 'system',
	currentTheme: createNativeTheme('default', 'dark'), // Default fallback
	isLoading: true,

	// Set theme variant
	setVariant: async (variant: ThemeVariant) => {
		try {
			await AsyncStorage.setItem(THEME_VARIANT_KEY, variant);
			set({ variant });
			get()._updateCurrentTheme();
		} catch (error) {
			console.error('Error saving theme variant:', error);
		}
	},

	// Set theme mode
	setMode: async (mode: ThemeMode) => {
		try {
			await AsyncStorage.setItem(THEME_MODE_KEY, mode);
			set({ mode });
			get()._updateCurrentTheme();
		} catch (error) {
			console.error('Error saving theme mode:', error);
		}
	},

	// Toggle between light and dark (not system)
	toggleMode: () => {
		const currentMode = get().mode;
		const newMode: ThemeMode = currentMode === 'dark' ? 'light' : 'dark';
		get().setMode(newMode);
	},

	// Load theme from AsyncStorage
	loadTheme: async () => {
		try {
			const [savedVariant, savedMode] = await Promise.all([
				AsyncStorage.getItem(THEME_VARIANT_KEY),
				AsyncStorage.getItem(THEME_MODE_KEY),
			]);

			const variant = (savedVariant as ThemeVariant) || 'default';
			const mode = (savedMode as ThemeMode) || 'system';

			set({ variant, mode, isLoading: false });
			get()._updateCurrentTheme();
		} catch (error) {
			console.error('Error loading theme:', error);
			set({ isLoading: false });
		}
	},

	// Internal: Update current theme based on variant and mode
	_updateCurrentTheme: () => {
		const { variant, mode } = get();

		// Resolve actual mode (light or dark) from mode setting
		let resolvedMode: 'light' | 'dark' = 'dark';

		if (mode === 'system') {
			// This will be called from component that has access to useColorScheme
			// For now, default to dark
			resolvedMode = 'dark';
		} else {
			resolvedMode = mode;
		}

		const theme = createNativeTheme(variant, resolvedMode);
		set({ currentTheme: theme });
	},
}));

/**
 * Hook to get theme with system color scheme support
 */
export const useTheme = () => {
	const store = useThemeStore();
	const systemColorScheme = useColorScheme();

	// Determine actual mode
	let actualMode: 'light' | 'dark' = 'dark';
	if (store.mode === 'system') {
		actualMode = systemColorScheme === 'dark' ? 'dark' : 'light';
	} else {
		actualMode = store.mode;
	}

	// Get the correct theme based on actual mode
	const theme = createNativeTheme(store.variant, actualMode);

	return {
		theme,
		variant: store.variant,
		mode: store.mode,
		actualMode,
		isLoading: store.isLoading,
		setVariant: store.setVariant,
		setMode: store.setMode,
		toggleMode: store.toggleMode,
	};
};
