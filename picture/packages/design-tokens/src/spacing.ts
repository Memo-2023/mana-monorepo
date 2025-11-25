/**
 * @memoro/design-tokens - Spacing
 *
 * Spacing scale following Tailwind convention.
 * All values in pixels for easy conversion to React Native and web.
 */

/**
 * Spacing scale (follows Tailwind naming)
 * Use these for margins, padding, gaps, etc.
 */
export const spacing = {
  0: 0,
  1: 4,      // 0.25rem
  2: 8,      // 0.5rem
  3: 12,     // 0.75rem
  4: 16,     // 1rem
  5: 20,     // 1.25rem
  6: 24,     // 1.5rem
  7: 28,     // 1.75rem
  8: 32,     // 2rem
  9: 36,     // 2.25rem
  10: 40,    // 2.5rem
  11: 44,    // 2.75rem
  12: 48,    // 3rem
  14: 56,    // 3.5rem
  16: 64,    // 4rem
  20: 80,    // 5rem
  24: 96,    // 6rem
  28: 112,   // 7rem
  32: 128,   // 8rem
} as const;

/**
 * Border radius values
 */
export const borderRadius = {
  none: 0,
  sm: 4,
  DEFAULT: 8,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

/**
 * Border width values
 */
export const borderWidth = {
  DEFAULT: 1,
  0: 0,
  2: 2,
  4: 4,
  8: 8,
} as const;

/**
 * Type exports
 */
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type BorderWidth = typeof borderWidth;
