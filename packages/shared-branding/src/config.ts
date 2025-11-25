import type { AppBranding, AppId } from './types';

/**
 * Branding configuration for all Mana ecosystem apps
 */
export const APP_BRANDING: Record<AppId, AppBranding> = {
	memoro: {
		id: 'memoro',
		name: 'Memoro',
		tagline: 'AI Voice Memos',
		primaryColor: '#f8d62b',
		secondaryColor: '#f7d44c',
		// Memoro smile/face logo
		logoPath: 'M280 140C280 217.32 217.32 280 140 280C62.6801 280 0 217.32 0 140C0 62.6801 62.6801 0 140 0C217.32 0 280 62.6801 280 140ZM247.988 140C247.988 199.64 199.64 241.988 140 241.988C80.3598 241.988 32.0118 199.64 32.0118 140C32.0118 111.918 36.7308 95.3397 54.3005 76.1331C58.5193 71.5212 70.5 63 79.3937 74.511L119.781 131.788C134.5 149 149 147 160.218 131.788L200.605 74.5101C208 64 221.48 71.5203 225.699 76.1321C243.269 95.3388 247.988 111.918 247.988 140Z',
		logoViewBox: '0 0 280 280',
		logoStroke: false,
	},
	manacore: {
		id: 'manacore',
		name: 'ManaCore',
		tagline: 'Central Hub',
		primaryColor: '#6366f1',
		secondaryColor: '#818cf8',
		// Hexagon/Core icon
		logoPath: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
		logoViewBox: '0 0 24 24',
		logoStroke: true,
		logoStrokeWidth: 2,
	},
	manadeck: {
		id: 'manadeck',
		name: 'ManaDeck',
		tagline: 'AI Flashcards',
		primaryColor: '#8b5cf6',
		secondaryColor: '#a78bfa',
		// Cards/Deck icon
		logoPath: 'M2 4h20v16H2zM6 2v2M18 2v2M6 20v2M18 20v2M2 10h20',
		logoViewBox: '0 0 24 24',
		logoStroke: true,
		logoStrokeWidth: 1.5,
	},
	maerchenzauber: {
		id: 'maerchenzauber',
		name: 'Märchenzauber',
		tagline: 'AI Story Creator',
		primaryColor: '#ec4899',
		secondaryColor: '#f472b6',
		// Book/Story icon
		logoPath: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
		logoViewBox: '0 0 24 24',
		logoStroke: true,
		logoStrokeWidth: 1.5,
	},
	uload: {
		id: 'uload',
		name: 'uLoad',
		tagline: 'Smart URL Shortener',
		primaryColor: '#3b82f6',
		secondaryColor: '#60a5fa',
		// Link/Chain icon
		logoPath: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
		logoViewBox: '0 0 24 24',
		logoStroke: true,
		logoStrokeWidth: 2,
	},
};

/**
 * Get branding config for an app
 */
export function getAppBranding(appId: AppId): AppBranding {
	return APP_BRANDING[appId];
}

/**
 * Get all app brandings
 */
export function getAllAppBrandings(): AppBranding[] {
	return Object.values(APP_BRANDING);
}
