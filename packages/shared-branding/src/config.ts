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
		logoPath:
			'M280 140C280 217.32 217.32 280 140 280C62.6801 280 0 217.32 0 140C0 62.6801 62.6801 0 140 0C217.32 0 280 62.6801 280 140ZM247.988 140C247.988 199.64 199.64 241.988 140 241.988C80.3598 241.988 32.0118 199.64 32.0118 140C32.0118 111.918 36.7308 95.3397 54.3005 76.1331C58.5193 71.5212 70.5 63 79.3937 74.511L119.781 131.788C134.5 149 149 147 160.218 131.788L200.605 74.5101C208 64 221.48 71.5203 225.699 76.1321C243.269 95.3388 247.988 111.918 247.988 140Z',
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
		logoPath:
			'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
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
		logoPath:
			'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
		logoViewBox: '0 0 24 24',
		logoStroke: true,
		logoStrokeWidth: 2,
	},
	chat: {
		id: 'chat',
		name: 'ManaChat',
		tagline: 'AI Chat Assistant',
		primaryColor: '#0ea5e9',
		secondaryColor: '#38bdf8',
		// Chat bubble icon
		logoPath:
			'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z',
		logoViewBox: '0 0 24 24',
		logoStroke: true,
		logoStrokeWidth: 1.5,
	},
	presi: {
		id: 'presi',
		name: 'Presi',
		tagline: 'Presentation Creator',
		primaryColor: '#f97316',
		secondaryColor: '#fb923c',
		// Presentation/slides icon
		logoPath:
			'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6',
		logoViewBox: '0 0 24 24',
		logoStroke: true,
		logoStrokeWidth: 1.5,
	},
	nutriphi: {
		id: 'nutriphi',
		name: 'Nutriphi',
		tagline: 'AI Nutrition Tracker',
		primaryColor: '#10b981',
		secondaryColor: '#34d399',
		// Heart with sparkle for healthy nutrition
		logoPath:
			'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
		logoViewBox: '0 0 24 24',
		logoStroke: true,
		logoStrokeWidth: 1.5,
	},
	zitare: {
		id: 'zitare',
		name: 'Zitare',
		tagline: 'Daily Inspiration',
		primaryColor: '#f59e0b',
		secondaryColor: '#fbbf24',
		// Quote/chat bubble icon
		logoPath:
			'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z',
		logoViewBox: '0 0 24 24',
		logoStroke: true,
		logoStrokeWidth: 1.5,
	},
	picture: {
		id: 'picture',
		name: 'Picture',
		tagline: 'AI Image Generation',
		primaryColor: '#3b82f6',
		secondaryColor: '#60a5fa',
		// Image/picture icon
		logoPath:
			'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
		logoViewBox: '0 0 24 24',
		logoStroke: true,
		logoStrokeWidth: 1.5,
	},
	contacts: {
		id: 'contacts',
		name: 'Contacts',
		tagline: 'Contact Management',
		primaryColor: '#3b82f6',
		secondaryColor: '#60a5fa',
		// Users/contacts icon
		logoPath:
			'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
		logoViewBox: '0 0 24 24',
		logoStroke: true,
		logoStrokeWidth: 1.5,
	},
	calendar: {
		id: 'calendar',
		name: 'Kalender',
		tagline: 'Smart Calendar Management',
		primaryColor: '#0ea5e9',
		secondaryColor: '#38bdf8',
		// Calendar icon
		logoPath:
			'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z',
		logoViewBox: '0 0 24 24',
		logoStroke: true,
		logoStrokeWidth: 1.5,
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
