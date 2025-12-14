/**
 * Social Media Platform Configuration
 * Centralized config for all social media platforms used in the contacts app
 */

export interface SocialPlatform {
	/** Unique identifier matching Contact field name */
	id: string;
	/** Display name */
	name: string;
	/** Short badge label */
	badge: string;
	/** Input type for form fields */
	inputType: 'url' | 'text' | 'tel';
	/** Placeholder text for form input */
	placeholder: string;
	/** Whether this platform has a clickable link */
	hasLink: boolean;
	/** Function to build the full URL from a value */
	buildUrl?: (value: string) => string;
}

/**
 * All supported social media platforms
 */
export const SOCIAL_PLATFORMS: SocialPlatform[] = [
	{
		id: 'linkedin',
		name: 'LinkedIn',
		badge: 'in',
		inputType: 'url',
		placeholder: 'https://linkedin.com/in/...',
		hasLink: true,
		buildUrl: (v) => (v.startsWith('http') ? v : `https://linkedin.com/in/${v}`),
	},
	{
		id: 'twitter',
		name: 'Twitter / X',
		badge: 'X',
		inputType: 'text',
		placeholder: '@username',
		hasLink: true,
		buildUrl: (v) => (v.startsWith('http') ? v : `https://x.com/${v.replace('@', '')}`),
	},
	{
		id: 'facebook',
		name: 'Facebook',
		badge: 'f',
		inputType: 'url',
		placeholder: 'https://facebook.com/...',
		hasLink: true,
		buildUrl: (v) => (v.startsWith('http') ? v : `https://facebook.com/${v}`),
	},
	{
		id: 'instagram',
		name: 'Instagram',
		badge: 'ig',
		inputType: 'text',
		placeholder: '@username',
		hasLink: true,
		buildUrl: (v) => (v.startsWith('http') ? v : `https://instagram.com/${v.replace('@', '')}`),
	},
	{
		id: 'xing',
		name: 'Xing',
		badge: 'xi',
		inputType: 'url',
		placeholder: 'https://xing.com/profile/...',
		hasLink: true,
		buildUrl: (v) => (v.startsWith('http') ? v : `https://xing.com/profile/${v}`),
	},
	{
		id: 'github',
		name: 'GitHub',
		badge: 'gh',
		inputType: 'text',
		placeholder: 'username',
		hasLink: true,
		buildUrl: (v) => (v.startsWith('http') ? v : `https://github.com/${v}`),
	},
	{
		id: 'youtube',
		name: 'YouTube',
		badge: 'yt',
		inputType: 'url',
		placeholder: 'https://youtube.com/@...',
		hasLink: true,
		buildUrl: (v) => (v.startsWith('http') ? v : `https://youtube.com/@${v}`),
	},
	{
		id: 'tiktok',
		name: 'TikTok',
		badge: 'tt',
		inputType: 'text',
		placeholder: '@username',
		hasLink: true,
		buildUrl: (v) => (v.startsWith('http') ? v : `https://tiktok.com/@${v.replace('@', '')}`),
	},
	{
		id: 'telegram',
		name: 'Telegram',
		badge: 'tg',
		inputType: 'text',
		placeholder: '@username',
		hasLink: true,
		buildUrl: (v) => `https://t.me/${v.replace('@', '')}`,
	},
	{
		id: 'whatsapp',
		name: 'WhatsApp',
		badge: 'wa',
		inputType: 'tel',
		placeholder: '+49...',
		hasLink: true,
		buildUrl: (v) => `https://wa.me/${v.replace(/[^0-9]/g, '')}`,
	},
	{
		id: 'signal',
		name: 'Signal',
		badge: 'sg',
		inputType: 'tel',
		placeholder: '+49...',
		hasLink: false,
	},
	{
		id: 'discord',
		name: 'Discord',
		badge: 'dc',
		inputType: 'text',
		placeholder: 'username#1234',
		hasLink: false,
	},
	{
		id: 'bluesky',
		name: 'Bluesky',
		badge: 'bs',
		inputType: 'text',
		placeholder: '@handle.bsky.social',
		hasLink: true,
		buildUrl: (v) => (v.startsWith('http') ? v : `https://bsky.app/profile/${v.replace('@', '')}`),
	},
];

/**
 * Get platform config by ID
 */
export function getPlatform(id: string): SocialPlatform | undefined {
	return SOCIAL_PLATFORMS.find((p) => p.id === id);
}

/**
 * Check if a contact has any social media data
 */
export function hasSocialMedia(contact: Record<string, unknown>): boolean {
	return SOCIAL_PLATFORMS.some((p) => !!contact[p.id]);
}

/**
 * Get all social media entries for a contact
 */
export function getSocialMediaEntries(
	contact: Record<string, unknown>
): Array<{ platform: SocialPlatform; value: string }> {
	return SOCIAL_PLATFORMS.filter((p) => !!contact[p.id]).map((platform) => ({
		platform,
		value: contact[platform.id] as string,
	}));
}
