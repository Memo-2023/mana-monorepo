/**
 * Reserved slugs + hostname validation — server-authoritative lists.
 * The client carries mirror copies for fast pre-flight UX, but these
 * are the ones that matter at publish time.
 *
 * Rule (slugs): any slug that would shadow a SvelteKit route or
 * collide with a well-known subdomain goes in RESERVED_SLUGS. When a
 * new top-level route is added, append its segment here in the same
 * PR.
 *
 * Rule (hostnames): only hostnames the user genuinely owns should be
 * bindable. Anything ending in `.mana.how`, or the well-known CF /
 * auth / app endpoints, stays reserved.
 */

// ── Slugs ───────────────────────────────────────────────

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
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$/;

export function isValidSlug(slug: string): boolean {
	if (!SLUG_REGEX.test(slug)) return false;
	if (RESERVED_SLUGS.includes(slug.toLowerCase())) return false;
	return true;
}

// ── Hostnames ───────────────────────────────────────────

/**
 * Conservative hostname regex — lowercase letters, digits, dots,
 * hyphens. Length 4-253 per RFC. Rejects `localhost`, IPs, internal
 * names. Not a full RFC-compliant parser — a sanity check before we
 * hand the string to dns.resolve.
 */
const HOSTNAME_RE = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

/**
 * Reserved hostnames that must not be user-bound. mana.how itself +
 * every app subdomain (todo, chat, …) lives here so a user can't
 * point their CNAME at the app's root.
 */
export const RESERVED_HOSTNAMES: ReadonlySet<string> = new Set([
	'mana.how',
	'www.mana.how',
	'api.mana.how',
	'auth.mana.how',
	'app.mana.how',
	'admin.mana.how',
	'custom.mana.how',
	'events.mana.how',
	'research.mana.how',
]);

/**
 * True if `raw` is a syntactically valid hostname that isn't reserved
 * and doesn't live under `.mana.how` (which is ours end-to-end —
 * subdomain-publish handles `{slug}.mana.how` specifically, users
 * should bring an external domain to the custom-domain flow).
 */
export function isValidHostname(raw: string): boolean {
	if (!raw) return false;
	const lower = raw.toLowerCase().trim();
	if (!HOSTNAME_RE.test(lower)) return false;
	if (RESERVED_HOSTNAMES.has(lower)) return false;
	if (lower.endsWith('.mana.how')) return false;
	return true;
}
