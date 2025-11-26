import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from './index';
import { Theme } from '@react-navigation/native';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: Theme;
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: lightTheme,
});

export const useAppTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  // Aktualisiere den Theme-Modus, wenn sich das System-Theme ändert
  useEffect(() => {
    setIsDarkMode(colorScheme === 'dark');
  }, [colorScheme]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {/* Wir verwenden die NativeWind-Klassen direkt in den Komponenten */}
      {children}
    </ThemeContext.Provider>
  );
}
