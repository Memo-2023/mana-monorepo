/**
 * Centralized localStorage keys for the Mana web app.
 * All keys should be prefixed with 'mana-' to avoid collisions.
 */
export const STORAGE_KEYS = {
	/** User's preferred locale (e.g., 'de', 'en') */
	LOCALE: 'locale',
	/** Whether the sidebar navigation is collapsed */
	NAV_COLLAPSED: 'mana-nav-collapsed',
	/** Whether the welcome page has been seen */
	HAS_SEEN_WELCOME: 'hasSeenWelcome',
	/** Onboarding wizard state (JSON) */
	ONBOARDING: 'mana-onboarding',
	/** Dashboard widget layout (JSON) — defined in default-dashboard.ts */
	// DASHBOARD: 'mana-dashboard-config',
} as const;
