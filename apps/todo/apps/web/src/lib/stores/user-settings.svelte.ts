import { createUserSettingsStore } from '@manacore/shared-theme';
import { authStore } from './auth.svelte';

const MANA_AUTH_URL = import.meta.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

export const userSettings = createUserSettingsStore({
	appId: 'todo',
	authUrl: MANA_AUTH_URL,
	getAccessToken: () => authStore.getAccessToken(),
});
