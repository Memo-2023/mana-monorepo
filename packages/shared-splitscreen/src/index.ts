/**
 * @mana/shared-splitscreen
 *
 * Split-screen panel system for Mana apps.
 * Enables displaying two apps side-by-side using iFrames.
 */

// Types
export type {
	PanelConfig,
	SplitScreenState,
	AppDefinition,
	PanelEvent,
	StorageConfig,
	UrlState,
} from './types.js';

export { DIVIDER_CONSTRAINTS, MOBILE_BREAKPOINT } from './types.js';

// Store
export {
	createSplitPanelStore,
	setSplitPanelContext,
	getSplitPanelContext,
	hasSplitPanelContext,
	DEFAULT_APPS,
	type SplitPanelStore,
} from './stores/split-panel.svelte.js';

// Utils
export {
	parseUrlState,
	updateUrlState,
	clearUrlState,
	getCurrentUrlState,
	savePanelState,
	loadPanelState,
	clearPanelState,
	createStorageConfig,
} from './utils/index.js';

// Components (will be added)
export { default as SplitPaneContainer } from './components/SplitPaneContainer.svelte';
export { default as AppPanel } from './components/AppPanel.svelte';
export { default as PanelControls } from './components/PanelControls.svelte';
export { default as ResizeHandle } from './components/ResizeHandle.svelte';
