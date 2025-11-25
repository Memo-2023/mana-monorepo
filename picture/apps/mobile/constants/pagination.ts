/**
 * Pagination constants for different screens
 */
export const PAGINATION = {
  /** Page size for gallery screen */
  GALLERY_PAGE_SIZE: 20,

  /** Page size for explore screen */
  EXPLORE_PAGE_SIZE: 30,

  /** Initial load count */
  INITIAL_LOAD: 20,

  /** Load more threshold (0.5 = halfway through list) */
  LOAD_MORE_THRESHOLD: 0.5,
} as const;
