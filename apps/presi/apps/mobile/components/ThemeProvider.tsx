import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { getTheme, Theme, ThemeVariant } from '../constants/theme';

export type ColorMode = 'system' | 'light' | 'dark';
export type ContrastLevel = 1 | 2 | 3 | 4 | 5;

type ColorType = 'text' | 'primary' | 'background';

// Hilfsfunktion zum Konvertieren von Hex zu RGB
const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substr(0, 2), 16),
    g: parseInt(h.substr(2, 2), 16),
    b: parseInt(h.substr(4, 2), 16),
  };
};

// Hilfsfunktion zum Konvertieren von RGB zu Hex mit Alpha
const rgbaToHex = (r: number, g: number, b: number, a: number = 1) => {
  const alpha = Math.round(a * 255);
  return '#' + [r, g, b, alpha].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

// Funktion zum Anpassen des Kontrasts
const adjustContrast = (color: string, level: ContrastLevel, type: ColorType, isDark: boolean): string => {
  if (level === 3) return color;

  const { r, g, b } = hexToRgb(color);
  
  if (level < 3) {
    // Niedrigerer Kontrast: Nur Text-Opacity wird reduziert
    if (type === 'text') {
      const opacity = 0.5 + (level - 1) * 0.25; // 0.5 für Level 1, 0.75 für Level 2
      return rgbaToHex(r, g, b, opacity);
    }
    return color;
  } else {
    // Höherer Kontrast: Nur Hintergründe werden angepasst
    if (type === 'background') {
      const factor = (level - 3) * 0.45; // 0.45 für Level 4, 0.9 für Level 5
      if (isDark) {
        // Im Dark Mode: Hintergründe werden schwärzer
        return rgbaToHex(
          Math.round(r * (1 - factor)),
          Math.round(g * (1 - factor)),
          Math.round(b * (1 - factor))
        );
      } else {
        // Im Light Mode: Hintergründe werden weißer
        return rgbaToHex(
          Math.round(r + (255 - r) * factor),
          Math.round(g + (255 - g) * factor),
          Math.round(b + (255 - b) * factor)
        );
      }
    }
    return color;
  }
};

const adjustThemeContrast = (theme: Theme, level: ContrastLevel, isDark: boolean): Theme => {
  if (level === 3) return theme;

  const adjustedColors = Object.entries(theme.colors).reduce((acc, [key, value]) => {
    if (typeof value === 'string' && value.startsWith('#')) {
      let colorType: ColorType = 'background';
      if (key.toLowerCase().includes('text')) {
        colorType = 'text';
      } else if (key.toLowerCase().includes('primary')) {
        colorType = 'primary';
      }
      
      acc[key] = adjustContrast(value, level, colorType, isDark);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);

  return {
    ...theme,
    colors: adjustedColors,
  };
};

type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  themeVariant: ThemeVariant;
  setThemeVariant: (variant: ThemeVariant) => void;
  contrastLevel: ContrastLevel;
  setContrastLevel: (level: ContrastLevel) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: getTheme('light'),
  isDark: false,
  colorMode: 'system',
  setColorMode: () => {},
  themeVariant: 'default',
  setThemeVariant: () => {},
  contrastLevel: 3,
  setContrastLevel: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [colorMode, setColorMode] = useState<ColorMode>('system');
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>('default');
  const [contrastLevel, setContrastLevel] = useState<ContrastLevel>(3);
  
  const isDark = useMemo(() => {
    if (colorMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return colorMode === 'dark';
  }, [colorMode, systemColorScheme]);

  const theme = useMemo(() => {
    const baseTheme = getTheme(isDark ? 'dark' : 'light', themeVariant);
    return adjustThemeContrast(baseTheme, contrastLevel, isDark);
  }, [isDark, themeVariant, contrastLevel]);

  const contextValue = useMemo(() => ({
    theme,
    isDark,
    colorMode,
    setColorMode,
    themeVariant,
    setThemeVariant,
    contrastLevel,
    setContrastLevel,
  }), [theme, isDark, colorMode, themeVariant, contrastLevel]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};