/**
 * User Settings Store for ManaCore
 *
 * This store syncs settings with mana-core-auth and provides:
 * - Global settings that apply to all apps
 * - Per-app overrides for customization
 * - localStorage caching for offline support
 */

import { createUserSettingsStore } from '@manacore/shared-theme';
import { authStore } from './auth.svelte';

// TODO: Use PUBLIC_MANA_CORE_AUTH_URL from env when available
const MANA_AUTH_URL = 'http://localhost:3001';

export const userSettings = createUserSettingsStore({
	appId: 'manacore',
	authUrl: MANA_AUTH_URL,
	getAccessToken: () => authStore.getAccessToken(),
});
