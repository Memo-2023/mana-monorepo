import { DefaultTheme, DarkTheme } from '@react-navigation/native';

export const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#F2F2F7',
    card: '#FFFFFF',
    text: '#000000',
    border: '#E5E5EA',
    notification: '#FF3B30',
    placeholder: '#8E8E93',
    accent: '#34C759',
    muted: '#C7C7CC',
    // Hover-States für Buttons und Menüpunkte
    buttonHover: 'rgba(255, 255, 255, 0.7)',   // Neutral weiß, heller
    menuItemHover: 'rgba(255, 255, 255, 0.5)', // Neutral weiß, weniger intensiv
    cardHover: 'rgba(255, 255, 255, 0.3)',     // Neutral weiß, subtil
    dangerHover: 'rgba(255, 255, 255, 0.5)',   // Neutral weiß für Danger-Buttons
  },
};

export const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#1C1C1E',
    card: '#2C2C2E',
    text: '#FFFFFF',
    border: '#38383A',
    notification: '#FF453A',
    placeholder: '#8E8E93',
    accent: '#30D158',
    muted: '#48484A',
    // Hover-States für Buttons und Menüpunkte
    buttonHover: 'rgba(255, 255, 255, 0.15)',  // Neutral weiß, heller für Dark Mode
    menuItemHover: 'rgba(255, 255, 255, 0.1)',  // Neutral weiß, dezent
    cardHover: 'rgba(255, 255, 255, 0.05)',     // Neutral weiß, sehr dezent
    dangerHover: 'rgba(255, 255, 255, 0.15)',   // Neutral weiß für Danger-Buttons
  },
};

// Tailwind-kompatible Farbpalette für die Verwendung in der tailwind.config.js
export const tailwindColors = {
  // Light Mode Colors
  light: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#F2F2F7',
    card: '#FFFFFF',
    text: '#000000',
    border: '#E5E5EA',
    notification: '#FF3B30',
    placeholder: '#8E8E93',
    accent: '#34C759',
    muted: '#C7C7CC',
    buttonHover: 'rgba(255, 255, 255, 0.7)',
    menuItemHover: 'rgba(255, 255, 255, 0.5)',
    cardHover: 'rgba(255, 255, 255, 0.3)',
    dangerHover: 'rgba(255, 255, 255, 0.5)',
  },
  // Dark Mode Colors
  dark: {
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    background: '#1C1C1E',
    card: '#2C2C2E',
    text: '#FFFFFF',
    border: '#38383A',
    notification: '#FF453A',
    placeholder: '#8E8E93',
    accent: '#30D158',
    muted: '#48484A',
    buttonHover: 'rgba(255, 255, 255, 0.15)',
    menuItemHover: 'rgba(255, 255, 255, 0.1)',
    cardHover: 'rgba(255, 255, 255, 0.05)',
    dangerHover: 'rgba(255, 255, 255, 0.15)',
  },
};
