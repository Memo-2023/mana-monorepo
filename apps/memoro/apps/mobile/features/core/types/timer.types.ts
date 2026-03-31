/**
 * Timer type definitions for React Native
 *
 * React Native uses number for timer IDs, but TypeScript's setTimeout/setInterval
 * return types are platform-specific. These type aliases ensure compatibility.
 */

/**
 * Type for setTimeout return value in React Native
 */
export type TimeoutId = ReturnType<typeof setTimeout>;

/**
 * Type for setInterval return value in React Native
 */
export type IntervalId = ReturnType<typeof setInterval>;

/**
 * Type for requestAnimationFrame return value
 */
export type AnimationFrameId = ReturnType<typeof requestAnimationFrame>;
