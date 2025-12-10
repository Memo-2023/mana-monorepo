/**
 * @manacore/shared-help-mobile
 * React Native components for the Help system
 */

// Main screen
export { HelpScreen } from './screens/HelpScreen';

// Components
export { FAQList } from './components/FAQList';
export { FAQItem } from './components/FAQItem';
export { FeaturesList } from './components/FeaturesList';
export { FeatureCard } from './components/FeatureCard';
export { HelpSearchBar } from './components/HelpSearchBar';
export { CategoryTabs } from './components/CategoryTabs';
export { ContactCard } from './components/ContactCard';

// Hooks
export { useHelpContent, useHelpSearch } from './hooks/useHelpContent';

// Types
export type {
	HelpScreenProps,
	HelpTranslations,
	HelpSection,
	UseHelpContentOptions,
	UseHelpContentResult,
	FAQListProps,
	FeaturesListProps,
	HelpSearchBarProps,
	HelpSearchResultsProps,
} from './types';
