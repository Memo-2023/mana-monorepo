/**
 * Feature object structure for branding emails
 */
export interface BrandingFeature {
	icon: string; // Emoji icon
	titleDe: string; // German title
	titleEn: string; // English title
	descriptionDe: string; // German description
	descriptionEn: string; // English description
}

/**
 * Email branding configuration for signup confirmation emails
 * All fields are optional and will fall back to app-branding.config.ts defaults
 */
export interface BrandingConfig {
	appName?: string; // App display name
	logoUrl?: string; // Logo filename or URL
	primaryColor?: string; // Primary brand color (hex)
	secondaryColor?: string; // Secondary color (hex)
	websiteUrl?: string; // Website URL
	taglineDe?: string; // German tagline
	taglineEn?: string; // English tagline
	features?: BrandingFeature[]; // Feature list
	copyright?: string; // Footer copyright text
}

/**
 * Metadata object that can be passed in signup requests
 */
export interface SignupMetadata {
	branding?: BrandingConfig;
	[key: string]: any; // Allow custom fields for email personalization
}
