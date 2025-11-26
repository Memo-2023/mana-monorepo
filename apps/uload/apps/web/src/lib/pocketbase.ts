import PocketBase from 'pocketbase';
import { dev } from '$app/environment';

// URL Konfiguration - automatische Umgebungserkennung
// Development: http://localhost:8090 (aus .env.development)
// Production: https://pb.ulo.ad (aus .env.production)
const POCKETBASE_URL = import.meta.env.PUBLIC_POCKETBASE_URL || (dev ? 'http://localhost:8090' : 'https://pb.ulo.ad');

// Debug logging (nur in Development)
if (dev) {
	console.log('🔧 PocketBase URL:', POCKETBASE_URL);
	console.log('🔧 Environment:', import.meta.env.MODE);
	console.log('🔧 Dev mode:', dev);
}

export const pb = new PocketBase(POCKETBASE_URL);

export interface User {
	id: string;
	email: string;
	username?: string;
	name?: string;
	avatar?: string;
	bio?: string;
	location?: string;
	website?: string;
	github?: string;
	twitter?: string;
	linkedin?: string;
	instagram?: string;
	publicProfile?: boolean;
	showClickStats?: boolean;
	emailNotifications?: boolean;
	defaultExpiry?: number;
	profileBackground?: string;
	created: string;
	updated: string;
	verified?: boolean;
}

export interface Tag {
	id: string;
	user_id: string;
	name: string;
	slug: string;
	color?: string;
	icon?: string;
	is_public: boolean;
	usage_count?: number;
	created: string;
	updated: string;
	expand?: {
		user?: User;
	};
}

export interface LinkTag {
	id: string;
	link_id: string;
	tag_id: string;
	created: string;
	updated: string;
	expand?: {
		link_id?: Link;
		tag_id?: Tag;
	};
}

export interface Link {
	id: string;
	user_id: string;
	created_by?: string;
	original_url: string;
	short_code: string;
	title?: string;
	description?: string;
	is_active: boolean;
	expires_at?: string;
	password?: string;
	max_clicks?: number;
	// use_username removed - now handled by short_code format
	click_count?: number;
	last_clicked_at?: string;
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
	created: string;
	updated: string;
	expand?: {
		user?: User;
		'linktags(link_id)'?: LinkTag[];
	};
}

export interface Click {
	id: string;
	link_id: string;
	ip_address?: string;
	user_agent?: string;
	referer?: string;
	country?: string;
	device_type?: string;
	browser?: string;
	clicked_at?: string;
	created: string;
	expand?: {
		link?: Link;
	};
}

export interface CustomDomain {
	id: string;
	user_id: string;
	domain: string;
	is_verified: boolean;
	created: string;
	updated: string;
}

export function generateShortCode(length: number = 6): string {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

export function generateTagSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

export const DEFAULT_TAG_COLORS = [
	'#3B82F6', // blue
	'#EF4444', // red
	'#10B981', // green
	'#F59E0B', // yellow
	'#8B5CF6', // purple
	'#EC4899', // pink
	'#06B6D4', // cyan
	'#84CC16', // lime
	'#F97316', // orange
	'#6366F1' // indigo
];

export function parseUserAgent(userAgent: string) {
	const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
	const isTablet = /iPad|Tablet/i.test(userAgent);
	const isDesktop = !isMobile && !isTablet;

	let browser = 'Unknown';
	if (/Chrome/i.test(userAgent)) browser = 'Chrome';
	else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
	else if (/Safari/i.test(userAgent)) browser = 'Safari';
	else if (/Edge/i.test(userAgent)) browser = 'Edge';
	else if (/Opera/i.test(userAgent)) browser = 'Opera';

	const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

	let os = 'Unknown';
	if (/Windows NT/i.test(userAgent)) os = 'Windows';
	else if (/Mac OS X/i.test(userAgent)) os = 'macOS';
	else if (/Linux/i.test(userAgent)) os = 'Linux';
	else if (/Android/i.test(userAgent)) os = 'Android';
	else if (/iPhone|iPad/i.test(userAgent)) os = 'iOS';

	return { browser, deviceType, os };
}

export async function getLocationFromIP(
	ipAddress: string
): Promise<{ country: string; city: string }> {
	// For localhost/development, return mock data
	if (
		ipAddress === '::1' ||
		ipAddress === '127.0.0.1' ||
		ipAddress.startsWith('192.168.') ||
		ipAddress.startsWith('10.')
	) {
		return { country: 'Germany', city: 'Munich' };
	}

	try {
		// Use ipapi.co for geolocation (free tier: 30k requests/month)
		const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
		if (response.ok) {
			const data = await response.json();
			return {
				country: data.country_name || 'Unknown',
				city: data.city || 'Unknown'
			};
		}
	} catch (error) {
		console.error('Geolocation lookup failed:', error);
	}

	return { country: 'Unknown', city: 'Unknown' };
}
