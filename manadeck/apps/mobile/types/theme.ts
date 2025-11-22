export type ThemeName = 'default' | 'forest' | 'sunset';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  foreground: string;
  surface: string;
  surfaceElevated: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

export interface Theme {
  name: ThemeName;
  displayName: string;
  description: string;
  light: ThemeColors;
  dark: ThemeColors;
}

export interface ThemeContextType {
  theme: ThemeName;
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}
