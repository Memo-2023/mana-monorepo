import type { ThemeConfig, NavConfig, FooterConfig, SiteSettings } from './types';

/**
 * Reserved slugs that cannot be used as site slugs. Enforced client-side
 * in the store pre-check and (authoritatively) in the backend publish
 * endpoint. See docs/plans/website-builder.md §D11 — a site with
 * slug='api' would shadow the API route tree.
 */
export const RESERVED_SLUGS: readonly string[] = [
	'app',
	'api',
	'auth',
	'admin',
	'settings',
	'docs',
	'blog',
	'www',
	'mail',
	'dashboard',
	'login',
	'logout',
	'register',
	'signup',
	'signin',
	'account',
	'billing',
	'help',
	'support',
	's', // conflicts with the public-renderer prefix /s/<slug>
];

export function isReservedSlug(slug: string): boolean {
	return RESERVED_SLUGS.includes(slug.toLowerCase());
}

/**
 * Slug regex — lowercase alphanumerics + hyphens, 2-40 chars, no leading
 * or trailing hyphen. Mirrored in the backend for authoritative checks.
 */
export const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

export function isValidSlug(slug: string): boolean {
	return SLUG_REGEX.test(slug) && !isReservedSlug(slug);
}

export const DEFAULT_THEME: ThemeConfig = {
	preset: 'classic',
};

export const DEFAULT_NAV: NavConfig = {
	items: [],
};

export const DEFAULT_FOOTER: FooterConfig = {
	text: '',
	links: [],
};

export const DEFAULT_SETTINGS: SiteSettings = {};

export const DEFAULT_HOME_PAGE = {
	path: '/',
	title: 'Start',
} as const;
