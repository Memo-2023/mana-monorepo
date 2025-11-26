import { Platform } from 'react-native';

// Scroll-related constants
export const SCROLL_THRESHOLD = 100;
export const SCROLL_TO_INDEX_DELAY = 100;
export const CLEAR_LAST_VIEWED_DELAY = 600;

// Gesture-related constants
export const PINCH_DEBOUNCE_MS = 300;
export const PINCH_OUT_SCALE = 1.15;
export const PINCH_IN_SCALE = 0.85;

// Prefetch-related constants
export const PREFETCH_DEBOUNCE_MS = 500;

// FlatList performance props
export const FLATLIST_PERFORMANCE_PROPS = {
  removeClippedSubviews: Platform.OS === 'android',
  maxToRenderPerBatch: 10,
  windowSize: 5,
  initialNumToRender: 6,
  updateCellsBatchingPeriod: 50,
} as const;
