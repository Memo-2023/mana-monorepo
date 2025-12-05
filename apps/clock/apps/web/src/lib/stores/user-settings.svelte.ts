/**
 * User Settings Store for Clock
 *
 * This store syncs settings with mana-core-auth and provides:
 * - Global settings that apply to all apps
 * - Per-app overrides for customization
 * - localStorage caching for offline support
 */

import { createUserSettingsStore } from '@manacore/shared-theme';
import { authStore } from './auth.svelte';

const MANA_AUTH_URL = 'http://localhost:3001';

export const userSettings = createUserSettingsStore({
	appId: 'clock',
	authUrl: MANA_AUTH_URL,
	getAccessToken: () => authStore.getAccessToken(),
});
