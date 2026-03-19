/**
 * Shared branding components and configuration for the Mana ecosystem
 *
 * This package provides:
 * - App logos (AppLogo, AppLogoWithName)
 * - Pre-configured app logos (MemoroLogo, ManaCoreLogo, etc.)
 * - Mana icon (ManaIcon)
 * - Branding configuration (colors, names, taglines)
 */

// Generic Components
export { default as AppLogo } from './AppLogo.svelte';
export { default as AppLogoWithName } from './AppLogoWithName.svelte';
export { default as ManaIcon } from './ManaIcon.svelte';

// Pre-configured App Logos
export {
	MemoroLogo,
	ManaCoreLogo,
	ManaDeckLogo,
	UloadLogo,
	ChatLogo,
	PresiLogo,
	NutriPhiLogo,
	ZitareLogo,
	ContactsLogo,
	CalendarLogo,
	StorageLogo,
	TodoLogo,
	MailLogo,
	MoodlitLogo,
	InventoryLogo,
	ClockLogo,
	QuestionsLogo,
	SkillTreeLogo,
	PlantaLogo,
	PlaygroundLogo,
	LightWriteLogo,
	MukkeLogo,
	ContextLogo,
} from './logos';

// Configuration
export { APP_BRANDING, getAppBranding, getAllAppBrandings } from './config';

// App Icons (SVG data URLs)
export { APP_ICONS, type AppIconId } from './app-icons';

// Mana Apps Configuration
export {
	MANA_APPS,
	getManaApp,
	getManaAppsByStatus,
	getAvailableManaApps,
	getActiveManaApps,
	APP_STATUS_LABELS,
	APP_SLIDER_LABELS,
	APP_URLS,
	getPillAppItems,
	type ManaApp,
	type AppStatus,
	type PillAppItemConfig,
} from './mana-apps';

// Types
export type { AppId, AppBranding, LogoProps, AppLogoWithNameProps } from './types';
