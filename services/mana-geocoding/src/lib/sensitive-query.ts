/**
 * Detects search queries that touch privacy-sensitive categories — health,
 * mental health, sexual/reproductive health, crisis services. These should
 * never be forwarded to a public geocoding endpoint, where the query content
 * (paired with our backend's IP and timestamp) could feed an aggregate
 * location-intent profile.
 *
 * Behavior in the chain:
 *   - Sensitive query → only providers with `privacy: 'local'` are tried
 *   - If no local provider answers → return empty results + notice
 *     (rather than silently fall through to public APIs)
 *
 * Trade-offs:
 *   - False positives are OK (a user searching for "Praxis Müller" who
 *     wanted the dance studio gets 0 results when Pelias is down — not
 *     ideal but better than a privacy leak)
 *   - False negatives are NOT OK (we'd rather over-block than under-block)
 *   - The list is intentionally narrow: only words with clear medical or
 *     crisis-service intent. Generic "Beratung" / "Hilfe" are not blocked
 *     because they're too broad — most aren't health-related.
 *
 * We DON'T block:
 *   - "Apotheke" — too common as a landmark / street name in DACH
 *   - "Krankenhaus" alone (often a street name); only specific clinic
 *     names like "Klinikum X" trigger
 *   - LGBTQ+ / religion / financial-distress keywords — those would
 *     need their own UX (the user often wants those results found),
 *     and false positives there would hurt more than help.
 */

/**
 * Word-boundary patterns. Each must match the FULL token (so
 * "hausarztstrasse" doesn't trigger). German umlauts use Unicode
 * letter classes via `[a-zäöüß]` since `\w` and `\b` are ASCII-only
 * in JavaScript regex.
 *
 * The `(?:^|[^a-zäöüß])` and `(?:[^a-zäöüß]|$)` lookarounds simulate
 * Unicode word boundaries.
 */
const SENSITIVE_PATTERNS: RegExp[] = [
	// Doctors / specialist medical professionals
	/(?:^|[^a-zäöüß])(arzt|ärztin|ärzte|hausarzt|kinderarzt|frauenarzt|gynäkologe|gynäkologin|urologe|urologin|dermatologe|dermatologin|orthopäde|orthopädin|augenarzt|augenärztin|hno-?arzt|hno-?ärztin|psychiater|psychiaterin|neurologe|neurologin|kardiologe|kardiologin|onkologe|onkologin|radiologe|radiologin)(?:[^a-zäöüß]|$)/i,

	// Clinic / hospital terms (paired with another word — "Klinikum X")
	/(?:^|[^a-zäöüß])(klinikum|hospiz|reha-?klinik|psychiatrie|psychotherapie|psychotherapeut|psychotherapeutin|psychologe|psychologin|therapeutin|therapeut)(?:[^a-zäöüß]|$)/i,

	// Substance / addiction services
	/(?:^|[^a-zäöüß])(suchtberatung|drogenberatung|alkoholberatung|methadon|substitution)(?:[^a-zäöüß]|$)/i,

	// Sexual / reproductive health.
	// "pro familia" (German pregnancy-counselling org) gets its own pattern
	// because the inter-word space breaks the word-boundary trick used in
	// the others. Match it whether spelled with space, hyphen, or fused.
	/(?:^|[^a-zäöüß])(hiv|aids|geschlechtskrank|schwangerschaftsabbruch|abtreibung|sexualberatung)(?:[^a-zäöüß]|$)/i,
	/(?:^|[^a-zäöüß])(pro[ -]?familia)(?:[^a-zäöüß]|$)/i,

	// Crisis / domestic-violence services
	/(?:^|[^a-zäöüß])(opferschutz|frauenhaus|männerhaus|gewaltschutz|telefonseelsorge|krisendienst|krisentelefon)(?:[^a-zäöüß]|$)/i,
];

export interface SensitivityCheck {
	sensitive: boolean;
	/** Which pattern matched, for logging. Not exposed to clients. */
	matchedToken?: string;
}

export function isSensitiveQuery(q: string): SensitivityCheck {
	if (!q || q.length < 3) return { sensitive: false };

	const normalized = q.toLowerCase();
	for (const pattern of SENSITIVE_PATTERNS) {
		const match = normalized.match(pattern);
		if (match) {
			// match[1] is the captured group — the actual sensitive token.
			return { sensitive: true, matchedToken: match[1] };
		}
	}
	return { sensitive: false };
}
