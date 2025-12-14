export { default as InputBar } from './InputBar.svelte';
// Alias for backwards compatibility
export { default as QuickInputBar } from './InputBar.svelte';
export { default as InputBarContextMenu } from './InputBarContextMenu.svelte';
export { default as InputBarHelpModal } from './InputBarHelpModal.svelte';
export type { QuickInputItem, QuickAction, CreatePreview } from './types';

// Recent input history (tags, references)
export {
	getRecentTags,
	getRecentReferences,
	addRecentTag,
	addRecentReference,
	extractAndSaveFromInput,
	clearRecentHistory,
	createRecentInputHistoryStore,
} from './recentInputHistory';

// InputBar settings
export {
	loadInputBarSettings,
	saveInputBarSettings,
	updateInputBarSetting,
	resetInputBarSettings,
	createInputBarSettingsStore,
	getInputBarSettingsStore,
} from './inputBarSettings.svelte';
export type { InputBarSettings } from './inputBarSettings.svelte';
