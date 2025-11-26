/**
 * Central spacing configuration for consistent layout across the app
 *
 * Usage:
 * ```tsx
 * import { spacing } from '~/utils/spacing';
 *
 * <View style={{ padding: spacing.container.horizontal, marginBottom: spacing.section }}>
 * ```
 */

export const spacing = {
  // Base spacing units (multiples of 4)
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,

  // Container spacing (standard padding for screen containers)
  container: {
    horizontal: 16,
    vertical: 24,
    top: 24,      // Top padding after PageHeader
    bottom: 24,   // Bottom padding before tab bar
  },

  // Section spacing (between major sections/cards)
  section: 24,

  // Card spacing
  card: {
    gap: 24,        // Gap between cards
    padding: 16,    // Internal padding (maps to "lg" in Card component)
  },

  // Content spacing
  content: {
    title: 16,      // Space after section titles
    item: 16,       // Space between list items
    small: 12,      // Small spacing between related elements
    micro: 8,       // Very small spacing
  },

  // Layout specific
  header: {
    paddingBottom: 16,
  },

  tabBar: {
    clearance: 100, // Bottom padding to clear tab bar
  },
} as const;

// Type for spacing values
export type Spacing = typeof spacing;

/**
 * Hook to access spacing values
 * Future: Could be extended to provide different spacing scales per theme
 */
export function useSpacing() {
  return spacing;
}
