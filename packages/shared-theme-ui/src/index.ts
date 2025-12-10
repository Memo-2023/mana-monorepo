// Theme UI Components (existing)
export { default as ThemeToggle } from './ThemeToggle.svelte';
export { default as ThemeSelector } from './ThemeSelector.svelte';
export { default as ThemeModeSelector } from './ThemeModeSelector.svelte';

// Theme Components
export { default as ThemeColorPreview } from './components/ThemeColorPreview.svelte';
export { default as ThemeCard } from './components/ThemeCard.svelte';
export { default as ThemeGrid } from './components/ThemeGrid.svelte';

// A11y Components
export { default as A11ySettings } from './components/A11ySettings.svelte';
export { default as A11yQuickToggles } from './components/A11yQuickToggles.svelte';

// Theme Editor Components
export { default as ColorPicker } from './components/editor/ColorPicker.svelte';
export { default as ThemeEditor } from './components/editor/ThemeEditor.svelte';
export { default as ThemeLivePreview } from './components/editor/ThemeLivePreview.svelte';

// Community Theme Components
export { default as ThemeCommunityCard } from './components/community/ThemeCommunityCard.svelte';
export { default as CommunityThemeGallery } from './components/community/CommunityThemeGallery.svelte';

// Pages
export { default as ThemePage } from './pages/ThemePage.svelte';
export { default as ThemeEditorPage } from './pages/ThemeEditorPage.svelte';
export { default as CommunityThemesPage } from './pages/CommunityThemesPage.svelte';

// Types
export type {
	ThemeStatus,
	ThemeCardData,
	ThemePageProps,
	ThemePageTranslations,
	A11yTranslations,
} from './types';
export { defaultTranslations, defaultA11yTranslations } from './types';
