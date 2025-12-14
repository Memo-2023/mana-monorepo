/**
 * User Settings Store for Contacts
 *
 * This store syncs settings with mana-core-auth and provides:
 * - Global settings that apply to all apps
 * - Per-app overrides for customization
 * - localStorage caching for offline support
 */

import { createUserSettingsStore } from '@manacore/shared-theme';
import { authStore } from './auth.svelte';
import { MANA_AUTH_URL } from '$lib/api/config';

export const userSettings = createUserSettingsStore({
	appId: 'contacts',
	authUrl: MANA_AUTH_URL,
	getAccessToken: () => authStore.getAccessToken(),
});
