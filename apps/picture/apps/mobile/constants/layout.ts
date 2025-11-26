/**
 * Layout constants for UI components
 */
export const LAYOUT = {
  /** Standard iOS tab bar height */
  TAB_BAR_HEIGHT: 49,

  /** Quick generate bar height */
  QUICK_GENERATE_BAR_HEIGHT: 60,

  /** Filter bar height */
  FILTER_BAR_HEIGHT: 50,

  /** Standard padding */
  PADDING: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  /** Grid spacing */
  GRID: {
    /** Total horizontal spacing (left + right + between items) */
    COLUMN_SPACING: 16,
    COLUMNS: 2,
  },
} as const;

/**
 * Animation durations in milliseconds
 */
export const ANIMATION = {
  /** Short animation (e.g., button press) */
  SHORT: 150,

  /** Medium animation (e.g., modal) */
  MEDIUM: 250,

  /** Long animation (e.g., page transition) */
  LONG: 350,
} as const;
