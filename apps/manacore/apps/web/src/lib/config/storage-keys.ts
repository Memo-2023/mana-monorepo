/**
 * Centralized localStorage keys for the ManaCore web app.
 * All keys should be prefixed with 'manacore-' to avoid collisions.
 */
export const STORAGE_KEYS = {
	/** User's preferred locale (e.g., 'de', 'en') */
	LOCALE: 'locale',
	/** Whether the sidebar navigation is collapsed */
	NAV_COLLAPSED: 'manacore-nav-collapsed',
	/** Whether the welcome page has been seen */
	HAS_SEEN_WELCOME: 'hasSeenWelcome',
	/** Onboarding wizard state (JSON) */
	ONBOARDING: 'manacore-onboarding',
	/** Dashboard widget layout (JSON) — defined in default-dashboard.ts */
	// DASHBOARD: 'manacore-dashboard-config',
} as const;
