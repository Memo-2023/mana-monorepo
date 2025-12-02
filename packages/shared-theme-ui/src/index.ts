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

// Pages
export { default as ThemePage } from './pages/ThemePage.svelte';

// Types
export type {
	ThemeStatus,
	ThemeCardData,
	ThemePageProps,
	ThemePageTranslations,
	A11yTranslations,
} from './types';
export { defaultTranslations, defaultA11yTranslations } from './types';
