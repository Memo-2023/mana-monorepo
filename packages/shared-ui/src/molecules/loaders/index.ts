/**
 * Loading state components
 *
 * Primitives:
 * - SkeletonBox: Base rectangular skeleton with shimmer
 * - SkeletonText: Multi-line text skeleton
 * - SkeletonAvatar: Circular avatar skeleton
 *
 * Composites:
 * - SkeletonRow: Single list row with avatar + text
 * - SkeletonList: Multiple rows with fade effect
 * - SkeletonCard: Card with avatar, title, body, footer
 * - SkeletonGrid: Grid of cards with fade effect
 *
 * Full Page:
 * - AppLoadingSkeleton: Full page loading skeleton with layout presets
 */

// Primitives
export { default as SkeletonBox } from './SkeletonBox.svelte';
export { default as SkeletonText } from './SkeletonText.svelte';
export { default as SkeletonAvatar } from './SkeletonAvatar.svelte';

// Composites
export { default as SkeletonRow } from './SkeletonRow.svelte';
export { default as SkeletonList } from './SkeletonList.svelte';
export { default as SkeletonCard } from './SkeletonCard.svelte';
export { default as SkeletonGrid } from './SkeletonGrid.svelte';

// Full Page
export { default as AppLoadingSkeleton } from './AppLoadingSkeleton.svelte';

// Utilities
export { calculateFadeOpacity } from './utils';
