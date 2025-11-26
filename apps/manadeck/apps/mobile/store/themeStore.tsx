import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Appearance, ColorSchemeName, Platform } from 'react-native';
import { ThemeName, ThemeMode, ThemeColors } from '~/types/theme';
import { themes } from '~/themes';

interface ThemeState {
  theme: ThemeName;
  mode: ThemeMode;
  systemColorScheme: ColorSchemeName;
}

interface ThemeContextValue extends ThemeState {
  // Actions
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setSystemColorScheme: (scheme: ColorSchemeName) => void;
  // Computed values
  isDark: boolean;
  currentColors: ThemeColors;
  rootClassName: string;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'theme-storage';

// Helper functions
const getIsDark = (mode: ThemeMode, systemColorScheme: ColorSchemeName): boolean => {
  if (mode === 'system') {
    return systemColorScheme === 'dark';
  }
  return mode === 'dark';
};

const getCurrentColors = (theme: ThemeName, isDark: boolean): ThemeColors => {
  const themeData = themes[theme];
  return isDark ? themeData.dark : themeData.light;
};

const getRootClassName = (theme: ThemeName, isDark: boolean): string => {
  const themeClass = `theme-${theme}`;
  const modeClass = isDark ? 'dark' : '';
  return [themeClass, modeClass].filter(Boolean).join(' ');
};

// Storage helpers
const storage = {
  getItem: async (): Promise<Partial<ThemeState> | null> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          const str = window.localStorage.getItem(STORAGE_KEY);
          return str ? JSON.parse(str) : null;
        }
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const str = await AsyncStorage.getItem(STORAGE_KEY);
        return str ? JSON.parse(str) : null;
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
    return null;
  },
  setItem: async (value: Partial<ThemeState>) => {
    try {
      const str = JSON.stringify(value);
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, str);
        }
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(STORAGE_KEY, str);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }
};

export const ThemeStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>('default');
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Load persisted state on mount
  useEffect(() => {
    storage.getItem().then((persisted) => {
      if (persisted) {
        if (persisted.theme) setThemeState(persisted.theme);
        if (persisted.mode) setModeState(persisted.mode);
      }
    });
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });
    return () => subscription?.remove();
  }, []);

  // Persist changes
  const persistState = useCallback((theme: ThemeName, mode: ThemeMode) => {
    storage.setItem({ theme, mode });
  }, []);

  // Actions
  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme);
    persistState(newTheme, mode);
  }, [mode, persistState]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    persistState(theme, newMode);
  }, [theme, persistState]);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
    setMode(newMode);
  }, [mode, setMode]);

  // Computed values
  const isDark = getIsDark(mode, systemColorScheme);
  const currentColors = getCurrentColors(theme, isDark);
  const rootClassName = getRootClassName(theme, isDark);

  const value: ThemeContextValue = {
    theme,
    mode,
    systemColorScheme,
    setTheme,
    setMode,
    toggleMode,
    setSystemColorScheme,
    isDark,
    currentColors,
    rootClassName,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// Hook to use the theme store
export const useThemeStore = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeStore must be used within ThemeStoreProvider');
  }
  return context;
};

// Selector hooks for backward compatibility
export const useIsDark = () => {
  const { isDark } = useThemeStore();
  return isDark;
};

export const useCurrentColors = () => {
  const { currentColors } = useThemeStore();
  return currentColors;
};

export const useRootClassName = () => {
  const { rootClassName } = useThemeStore();
  return rootClassName;
};