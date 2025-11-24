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
	StorytellerLogo
} from './logos';

// Configuration
export { APP_BRANDING, getAppBranding, getAllAppBrandings } from './config';

// Types
export type {
	AppId,
	AppBranding,
	LogoProps,
	AppLogoWithNameProps,
} from './types';
