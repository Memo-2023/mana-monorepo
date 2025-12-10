/**
 * @manacore/shared-help-ui
 * Svelte 5 components for the Help page system
 */

// Main page component
export { default as HelpPage } from './pages/HelpPage.svelte';

// Section components
export { default as FAQSection } from './components/FAQSection.svelte';
export { default as FAQItem } from './components/FAQItem.svelte';
export { default as FeaturesOverview } from './components/FeaturesOverview.svelte';
export { default as FeatureCard } from './components/FeatureCard.svelte';
export { default as KeyboardShortcuts } from './components/KeyboardShortcuts.svelte';
export { default as GettingStartedGuide } from './components/GettingStartedGuide.svelte';
export { default as ChangelogSection } from './components/ChangelogSection.svelte';
export { default as ChangelogEntry } from './components/ChangelogEntry.svelte';
export { default as ContactSection } from './components/ContactSection.svelte';
export { default as HelpSearch } from './components/HelpSearch.svelte';

// Types
export type {
	HelpPageProps,
	HelpPageTranslations,
	HelpSection,
	FAQSectionProps,
	FeaturesOverviewProps,
	KeyboardShortcutsProps,
	GettingStartedGuideProps,
	ChangelogSectionProps,
	ContactSectionProps,
	HelpSearchProps,
} from './types.js';
