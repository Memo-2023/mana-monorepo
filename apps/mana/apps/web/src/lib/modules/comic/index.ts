/**
 * Comic module — public surface.
 *
 * Plan: docs/plans/comic-module.md. M1 ships the datenschicht only
 * (types, collections, queries, stores, module registration). UI +
 * generate-flow follows in M2.
 */

export * from './types';
export { comicStoriesTable } from './collections';
export { comicStoriesStore } from './stores/stories.svelte';
export {
	useAllStories,
	useStoriesByStyle,
	useStory,
	useStoryPanels,
	useStoriesByInput,
	usePanelImage,
} from './queries';
export { STYLE_LABELS, STYLE_ORDER, MAX_PANELS_PER_STORY } from './constants';
export { STYLE_PREFIXES, composePanelPrompt } from './styles';
