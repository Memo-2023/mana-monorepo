/**
 * Shared branding components and configuration for the Mana ecosystem
 *
 * This package provides:
 * - App logos (AppLogo, AppLogoWithName)
 * - Mana icon (ManaIcon)
 * - Branding configuration (colors, names, taglines)
 */

// Components
export { default as AppLogo } from './AppLogo.svelte';
export { default as AppLogoWithName } from './AppLogoWithName.svelte';
export { default as ManaIcon } from './ManaIcon.svelte';

// Configuration
export { APP_BRANDING, getAppBranding, getAllAppBrandings } from './config';

// Types
export type {
	AppId,
	AppBranding,
	LogoProps,
	AppLogoWithNameProps,
} from './types';
