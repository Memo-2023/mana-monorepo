/**
 * Split-Screen — barrel exports.
 */

export { splitStore } from './store.svelte';
export { loadAppComponent, SPLIT_APP_IDS, SPLIT_APP_LABELS } from './registry';
export type { SplitAppId } from './registry';
export { default as SplitPaneLayout } from './SplitPaneLayout.svelte';
export { default as ResizeHandle } from './ResizeHandle.svelte';
export { default as PanelHeader } from './PanelHeader.svelte';
