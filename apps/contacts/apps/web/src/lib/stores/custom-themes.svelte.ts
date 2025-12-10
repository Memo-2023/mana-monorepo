/**
 * Custom Themes Store - Manages user's custom themes and community themes
 */

import { createCustomThemesStore } from '@manacore/shared-theme';
import { authStore } from './auth.svelte';

// Auth URL for theme API calls
const MANA_AUTH_URL = 'http://localhost:3001';

// Create the custom themes store
export const customThemesStore = createCustomThemesStore({
	authUrl: MANA_AUTH_URL,
	getAccessToken: () => authStore.getAccessToken(),
});
