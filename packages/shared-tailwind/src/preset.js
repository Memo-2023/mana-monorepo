/**
 * Shared Tailwind CSS preset for all ManaCore apps
 * 
 * Usage in tailwind.config.js:
 * ```
 * import sharedPreset from '@manacore/shared-tailwind/preset';
 * 
 * export default {
 *   presets: [sharedPreset],
 *   content: ['./src/**\/*.{html,js,svelte,ts}'],
 *   // app-specific overrides...
 * }
 * ```
 */

import { colors } from './colors.js';

/** @type {import('tailwindcss').Config} */
const preset = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors
        mana: colors.mana,
        
        // Primary scale
        primary: colors.primary,
        
        // Semantic colors using CSS custom properties
        // These can be changed at runtime via themes.css
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        
        // Content areas
        content: {
          DEFAULT: 'var(--color-content)',
          hover: 'var(--color-content-hover)',
          page: 'var(--color-content-page)',
        },
        
        // Menu/sidebar
        menu: {
          DEFAULT: 'var(--color-menu)',
          hover: 'var(--color-menu-hover)',
        },
        
        // Text
        theme: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
        },
        
        // Borders
        border: {
          light: 'var(--color-border-light)',
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        
        // Buttons
        'primary-btn': {
          DEFAULT: 'var(--color-primary-button)',
          text: 'var(--color-primary-button-text)',
        },
        'secondary-btn': 'var(--color-secondary-button)',
        
        // Feedback colors
        error: 'var(--color-error)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        
        // Direct theme colors (for apps that don't use CSS vars)
        lume: {
          ...colors.lume.light,
          dark: colors.lume.dark,
        },
        nature: {
          ...colors.nature.light,
          dark: colors.nature.dark,
        },
        stone: {
          ...colors.stone.light,
          dark: colors.stone.dark,
        },
        ocean: {
          ...colors.ocean.light,
          dark: colors.ocean.dark,
        },
      },
      
      // Border radius tokens
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',
        DEFAULT: '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
      },
      
      // Box shadow tokens
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'none': 'none',
      },
      
      // Font family
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      
      // Animation
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      
      // Transition
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
    },
  },
  plugins: [],
};

export default preset;
