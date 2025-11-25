/**
 * @memoro/design-tokens - Shadows
 *
 * Shadow definitions for React Native and web.
 * React Native requires specific shadow properties.
 */

/**
 * Shadow definitions for React Native
 */
export const shadows = {
  dark: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2, // Android
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 15,
      elevation: 8,
    },
  },
  light: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
      elevation: 8,
    },
  },
} as const;

/**
 * Opacity values for various UI states
 */
export const opacity = {
  disabled: 0.5,
  overlay: 0.8,
  hover: 0.9,
  pressed: 0.7,
} as const;

/**
 * Type exports
 */
export type Shadows = typeof shadows;
export type Opacity = typeof opacity;
