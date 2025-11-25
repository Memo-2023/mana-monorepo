/**
 * @memoro/design-tokens - Tailwind Preset
 *
 * Tailwind CSS preset that includes all design tokens.
 * Import this in your tailwind.config.js to use design tokens.
 *
 * @example
 * ```javascript
 * // tailwind.config.js
 * module.exports = {
 *   presets: [require('@memoro/design-tokens/tailwind/preset')],
 *   // ... your config
 * }
 * ```
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      // Colors from design tokens
      colors: {
        // Dark mode semantic colors
        dark: {
          bg: '#000000',
          surface: '#1a1a1a',
          elevated: '#242424',
          border: '#383838',
          input: '#1f1f1f',
        },

        // Light mode semantic colors
        light: {
          bg: '#ffffff',
          surface: '#f9fafb',
          elevated: '#ffffff',
          border: '#e5e7eb',
        },

        // Primary (Indigo) - default theme
        primary: {
          DEFAULT: '#818cf8', // indigo-400 (dark mode default)
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },

        // Secondary (Violet)
        secondary: {
          DEFAULT: '#a78bfa', // violet-400
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },

        // Status colors
        success: '#10b981', // emerald-500
        warning: '#f59e0b', // amber-500
        error: '#ef4444',   // red-500
        info: '#3b82f6',    // blue-500

        // Sunset theme colors
        sunset: {
          primary: '#fb923c', // orange-400
          secondary: '#f472b6', // pink-400
        },

        // Ocean theme colors
        ocean: {
          primary: '#2dd4bf', // teal-400
          secondary: '#22d3ee', // cyan-400
        },
      },

      // Spacing from design tokens
      spacing: {
        0: '0px',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        7: '28px',
        8: '32px',
        9: '36px',
        10: '40px',
        11: '44px',
        12: '48px',
        14: '56px',
        16: '64px',
        20: '80px',
        24: '96px',
        28: '112px',
        32: '128px',
      },

      // Border radius from design tokens
      borderRadius: {
        none: '0',
        sm: '4px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
        full: '9999px',
      },

      // Font sizes from design tokens
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px',
        '5xl': '48px',
        '6xl': '60px',
        '7xl': '72px',
        '8xl': '96px',
      },

      // Font weights from design tokens
      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },

      // Box shadows
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },

      // Opacity from design tokens
      opacity: {
        disabled: '0.5',
        overlay: '0.8',
        hover: '0.9',
        pressed: '0.7',
      },
    },
  },
};
