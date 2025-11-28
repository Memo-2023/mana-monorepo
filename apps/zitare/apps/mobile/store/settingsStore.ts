/**
 * Settings Store
 * Verwaltet alle App-Einstellungen (Theme, Preferences, etc.)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { STORAGE_KEYS } from '~/constants/storageKeys';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeType = 'default' | 'colorful' | 'nature';
export type FontSize = 'small' | 'medium' | 'large';
export type Language = 'de' | 'en';

interface SettingsState {
	// Theme
	themeMode: ThemeMode;
	themeType: ThemeType;
	isDarkMode: boolean;

	// Typography
	fontSize: FontSize;

	// Language
	language: Language;

	// User
	userName: string;

	// Notifications
	dailyQuoteNotification: boolean;
	notificationTime: string; // Format: "HH:MM"

	// Behavior
	enableHaptics: boolean;
	enableAnimations: boolean;
	autoPlayQuotes: boolean;
	autoPlayInterval: number; // in seconds

	// Privacy
	analyticsEnabled: boolean;
	crashReportingEnabled: boolean;

	// Actions
	setThemeMode: (mode: ThemeMode) => void;
	setThemeType: (type: ThemeType) => void;
	toggleDarkMode: () => void;
	setFontSize: (size: FontSize) => void;
	setLanguage: (language: Language) => void;
	setDailyNotification: (enabled: boolean) => void;
	setNotificationTime: (time: string) => void;
	setHaptics: (enabled: boolean) => void;
	setAnimations: (enabled: boolean) => void;
	setAutoPlay: (enabled: boolean) => void;
	setAutoPlayInterval: (seconds: number) => void;
	setAnalytics: (enabled: boolean) => void;
	setCrashReporting: (enabled: boolean) => void;
	setUserName: (name: string) => void;
	resetSettings: () => void;
}

const defaultSettings = {
	themeMode: 'system' as ThemeMode,
	themeType: 'default' as ThemeType,
	isDarkMode: true,
	fontSize: 'medium' as FontSize,
	language: 'de' as Language,
	userName: '',
	dailyQuoteNotification: false,
	notificationTime: '09:00',
	enableHaptics: true,
	enableAnimations: true,
	autoPlayQuotes: false,
	autoPlayInterval: 10,
	analyticsEnabled: false,
	crashReportingEnabled: false,
};

export const useSettingsStore = create<SettingsState>()(
	persist(
		(set, get) => {
			return {
				...defaultSettings,

				setThemeMode: (mode) => {
					let isDark;
					if (mode === 'dark') {
						isDark = true;
					} else if (mode === 'light') {
						isDark = false;
					} else {
						// System mode - will be updated by useSystemTheme hook
						const currentSystemTheme = get().isDarkMode;
						isDark = currentSystemTheme;
					}
					set({ themeMode: mode, isDarkMode: isDark });
				},

				setThemeType: (type) => set({ themeType: type }),

				toggleDarkMode: () => {
					const currentIsDark = get().isDarkMode;
					const newMode = currentIsDark ? 'light' : 'dark';
					set({
						themeMode: newMode,
						isDarkMode: newMode === 'dark',
					});
				},

				setFontSize: (size) => set({ fontSize: size }),

				setLanguage: (language) => {
					set({ language });
					// Update i18n when language changes
					import('../i18n/config').then(({ changeLanguage }) => {
						changeLanguage(language);
					});
				},

				setDailyNotification: (enabled) => set({ dailyQuoteNotification: enabled }),

				setNotificationTime: (time) => set({ notificationTime: time }),

				setHaptics: (enabled) => set({ enableHaptics: enabled }),

				setAnimations: (enabled) => set({ enableAnimations: enabled }),

				setAutoPlay: (enabled) => set({ autoPlayQuotes: enabled }),

				setAutoPlayInterval: (seconds) => set({ autoPlayInterval: seconds }),

				setAnalytics: (enabled) => set({ analyticsEnabled: enabled }),

				setCrashReporting: (enabled) => set({ crashReportingEnabled: enabled }),

				setUserName: (name) => set({ userName: name }),

				resetSettings: () => set(defaultSettings),
			};
		},
		{
			name: STORAGE_KEYS.SETTINGS,
			storage: createJSONStorage(() => AsyncStorage),
		}
	)
);

// Helper hooks
export const useIsDarkMode = () => {
	// Single store subscription for better performance
	const { isDarkMode, themeMode } = useSettingsStore((state) => ({
		isDarkMode: state.isDarkMode,
		themeMode: state.themeMode,
	}));
	const systemTheme = useColorScheme();

	// If theme mode is system, use the system theme
	if (themeMode === 'system') {
		return systemTheme === 'dark';
	}

	// Otherwise use the stored isDarkMode value
	return isDarkMode;
};
export const useThemeType = () => useSettingsStore((state) => state.themeType);
export const useFontSize = () => useSettingsStore((state) => state.fontSize);
export const useHaptics = () => useSettingsStore((state) => state.enableHaptics);
export const useAnimations = () => useSettingsStore((state) => state.enableAnimations);

// Legacy export for backward compatibility
export const useThemeStore = useSettingsStore;
