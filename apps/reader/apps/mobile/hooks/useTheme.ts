import { useStore } from '~/store/store';

export interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  surfaceSecondary: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Border colors
  border: string;
  borderSecondary: string;

  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;

  // Tab bar colors
  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
}

const lightTheme: ThemeColors = {
  // Background colors
  background: 'bg-gray-50',
  surface: 'bg-white',
  surfaceSecondary: 'bg-gray-100',

  // Text colors
  text: 'text-gray-900',
  textSecondary: 'text-gray-600',
  textTertiary: 'text-gray-500',

  // Border colors
  border: 'border-gray-200',
  borderSecondary: 'border-gray-300',

  // Primary colors
  primary: 'bg-blue-600',
  primaryLight: 'bg-blue-50',
  primaryDark: 'bg-blue-700',

  // Status colors
  success: 'bg-green-600',
  successLight: 'bg-green-100',
  warning: 'bg-orange-600',
  warningLight: 'bg-orange-100',
  error: 'bg-red-600',
  errorLight: 'bg-red-50',

  // Tab bar colors
  tabBarBackground: '#ffffff',
  tabBarBorder: '#e5e7eb',
  tabBarActive: '#3B82F6',
  tabBarInactive: '#6b7280',
};

const darkTheme: ThemeColors = {
  // Background colors
  background: 'bg-gray-900',
  surface: 'bg-gray-800',
  surfaceSecondary: 'bg-gray-700',

  // Text colors
  text: 'text-white',
  textSecondary: 'text-gray-300',
  textTertiary: 'text-gray-400',

  // Border colors
  border: 'border-gray-600',
  borderSecondary: 'border-gray-500',

  // Primary colors
  primary: 'bg-blue-600',
  primaryLight: 'bg-blue-900',
  primaryDark: 'bg-blue-700',

  // Status colors
  success: 'bg-green-600',
  successLight: 'bg-green-900',
  warning: 'bg-orange-600',
  warningLight: 'bg-orange-900',
  error: 'bg-red-600',
  errorLight: 'bg-red-900',

  // Tab bar colors
  tabBarBackground: '#1f2937',
  tabBarBorder: '#374151',
  tabBarActive: '#3B82F6',
  tabBarInactive: '#9ca3af',
};

export const useTheme = () => {
  const { settings } = useStore();
  const isDark = settings.theme === 'dark';

  const colors = isDark ? darkTheme : lightTheme;

  return {
    isDark,
    colors,
    theme: settings.theme,
  };
};

// Text color utilities
export const useTextColors = () => {
  const { colors } = useTheme();

  return {
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    primaryText: colors.text.replace('text-', 'text-'),
    secondaryText: colors.textSecondary.replace('text-', 'text-'),
    tertiaryText: colors.textTertiary.replace('text-', 'text-'),
  };
};

// Background color utilities
export const useBackgroundColors = () => {
  const { colors } = useTheme();

  return {
    main: colors.background,
    surface: colors.surface,
    surfaceSecondary: colors.surfaceSecondary,
  };
};

// Border color utilities
export const useBorderColors = () => {
  const { colors } = useTheme();

  return {
    main: colors.border,
    secondary: colors.borderSecondary,
  };
};

// Status color utilities
export const useStatusColors = () => {
  const { colors } = useTheme();

  return {
    success: colors.success,
    successLight: colors.successLight,
    warning: colors.warning,
    warningLight: colors.warningLight,
    error: colors.error,
    errorLight: colors.errorLight,
  };
};

// Primary color utilities
export const usePrimaryColors = () => {
  const { colors } = useTheme();

  return {
    main: colors.primary,
    light: colors.primaryLight,
    dark: colors.primaryDark,
  };
};
