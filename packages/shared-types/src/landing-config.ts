/**
 * Landing Page Configuration Types
 *
 * Used by the Admin UI (Mana Web) and the Landing Builder Service
 * to configure and generate static Astro landing pages for organizations.
 */

// --- Section Configs ---

export interface LandingHeroConfig {
	title: string;
	subtitle: string;
	variant?: 'default' | 'centered' | 'fullwidth';
	primaryCta?: { text: string; href: string };
	secondaryCta?: { text: string; href: string };
	image?: { src: string; alt: string };
}

export interface LandingAboutFeature {
	icon: string;
	title: string;
	description: string;
}

export interface LandingAboutConfig {
	title: string;
	subtitle?: string;
	features: LandingAboutFeature[];
	columns?: 2 | 3;
}

export interface LandingTeamMember {
	name: string;
	role: string;
	image?: string;
	bio?: string;
}

export interface LandingTeamConfig {
	title: string;
	subtitle?: string;
	members: LandingTeamMember[];
}

export interface LandingContactConfig {
	title: string;
	subtitle?: string;
	email?: string;
	phone?: string;
	address?: string;
}

export interface LandingFooterLink {
	label: string;
	href: string;
}

export interface LandingFooterConfig {
	copyright?: string;
	links?: LandingFooterLink[];
	socialLinks?: Array<{ platform: string; href: string }>;
}

// --- Main Config ---

export type LandingTheme = 'classic' | 'warm';

export type LandingBuildStatus = 'success' | 'failed' | 'building';

export interface LandingCustomColors {
	primary?: string;
	primaryHover?: string;
	primaryGlow?: string;
}

export interface LandingPageConfig {
	enabled: boolean;
	theme: LandingTheme;
	customColors?: LandingCustomColors;
	sections: {
		hero: LandingHeroConfig;
		about: LandingAboutConfig;
		team: LandingTeamConfig;
		contact: LandingContactConfig;
		footer: LandingFooterConfig;
	};
	lastBuiltAt?: string;
	lastBuildStatus?: LandingBuildStatus;
	publishedUrl?: string;
}
