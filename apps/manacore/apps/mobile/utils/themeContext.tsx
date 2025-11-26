import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Definiere die möglichen Theme-Modi
export type ThemeMode = 'light' | 'dark' | 'system';

// Theme-Kontext-Interface
interface ThemeContextType {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

// Erstelle den Theme-Kontext
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme Provider-Komponente
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Hole das Systemthema
  const systemColorScheme = useColorScheme();
  
  // State für den Theme-Modus
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  
  // Berechne, ob der Dark Mode aktiv ist
  const isDarkMode = themeMode === 'system' 
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  // Lade den gespeicherten Theme-Modus beim Start
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem('themeMode');
        if (savedThemeMode) {
          setThemeModeState(savedThemeMode as ThemeMode);
        }
      } catch (error) {
        console.error('Fehler beim Laden des Theme-Modus:', error);
      }
    };

    loadThemeMode();
  }, []);

  // Funktion zum Ändern des Theme-Modus
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Fehler beim Speichern des Theme-Modus:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeMode, isDarkMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook zum Verwenden des Theme-Kontexts
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme muss innerhalb eines ThemeProviders verwendet werden');
  }
  return context;
};

// Farbpaletten für Light und Dark Mode
export const lightColors = {
  background: '#FFFFFF',
  backgroundSecondary: '#F5F5F5',
  text: '#1F2937',
  textSecondary: '#6B7280',
  primary: '#0055FF',
  primaryDark: '#0044CC',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  card: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
};

export const darkColors = {
  background: '#121212',
  backgroundSecondary: '#1E1E1E',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  border: '#374151',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  card: '#1E1E1E',
  cardShadow: 'rgba(0, 0, 0, 0.5)',
};

// Funktion zum Abrufen der aktuellen Farbpalette basierend auf dem Theme-Modus
export const useThemeColors = () => {
  const { isDarkMode } = useTheme();
  return isDarkMode ? darkColors : lightColors;
};
