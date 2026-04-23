/**
 * Reserved slugs — server-authoritative list. The client carries a
 * mirror copy in `apps/mana/apps/web/src/lib/modules/website/constants.ts`
 * for fast pre-flight UX, but this list is the one that matters at
 * publish time.
 *
 * Rule: any slug that would shadow a SvelteKit route or collide with
 * a well-known subdomain goes here. When a new top-level route is
 * added, append its segment here in the same PR.
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
	's', // the public-renderer prefix /s/<slug>
];

/** Same regex as the client uses — 2-40 lowercase alphanumerics + hyphens. */
const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

export function isValidSlug(slug: string): boolean {
	if (!SLUG_REGEX.test(slug)) return false;
	if (RESERVED_SLUGS.includes(slug.toLowerCase())) return false;
	return true;
}
