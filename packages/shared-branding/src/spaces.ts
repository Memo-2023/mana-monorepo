/**
 * Space Types & Module Allowlist
 *
 * A "Space" is the unit of data ownership in Mana. Every record belongs to
 * exactly one Space. Users join Spaces via Better Auth's `member` relation.
 *
 * Space = Better Auth Organization with a typed `metadata.type` field. The
 * type drives which modules are available inside the space (see
 * `SPACE_MODULE_ALLOWLIST` below).
 *
 * See docs/plans/spaces-foundation.md for the full RFC.
 */

/**
 * The six canonical Space types. Every Better Auth organization must have
 * exactly one of these as `metadata.type`.
 *
 * - `personal` — single-member, auto-created on signup. Holds private data
 *   like mood, sleep, dreams that don't belong in a shared context.
 * - `brand`    — external communication identity (e.g. Edisconet, a creator
 *   persona). Hosts social-relay, mail, landing, public content.
 * - `club`     — association/Verein. Member management, dues, events,
 *   governance. Target for the ClubDesk-replacement roadmap.
 * - `family`   — household/family/WG. Shared calendar, shopping, recipes.
 * - `team`     — work team / project. Tasks, chat, docs.
 * - `practice` — freelancer/solo-business. Invoicing, clients, time tracking.
 */
export type SpaceType = 'personal' | 'brand' | 'club' | 'family' | 'team' | 'practice';

export const SPACE_TYPES: readonly SpaceType[] = [
	'personal',
	'brand',
	'club',
	'family',
	'team',
	'practice',
] as const;

export const SPACE_TYPE_LABELS = {
	de: {
		personal: 'Persönlich',
		brand: 'Marke',
		club: 'Verein',
		family: 'Familie',
		team: 'Team',
		practice: 'Praxis',
	},
	en: {
		personal: 'Personal',
		brand: 'Brand',
		club: 'Club',
		family: 'Family',
		team: 'Team',
		practice: 'Practice',
	},
} as const;

export const SPACE_TYPE_DESCRIPTIONS = {
	de: {
		personal: 'Dein eigener Bereich — wird beim Signup automatisch angelegt.',
		brand: 'Externe Kommunikations-Identität (z.B. eine Marke, ein öffentlicher Account).',
		club: 'Vereinsverwaltung mit Mitgliedern, Beiträgen und Events.',
		family: 'Geteilter Bereich für Haushalt, Familie oder WG.',
		team: 'Arbeitsteam oder Projekt mit mehreren Mitwirkenden.',
		practice: 'Freelancer- oder Solo-Business mit Kunden und Rechnungen.',
	},
	en: {
		personal: 'Your own space — created automatically at signup.',
		brand: 'External communication identity (e.g. a brand, a public account).',
		club: 'Club management with members, dues, and events.',
		family: 'Shared space for household, family, or flatshare.',
		team: 'Work team or project with multiple collaborators.',
		practice: 'Freelancer or solo business with clients and invoices.',
	},
} as const;

/**
 * Module IDs referenced by the allowlist. Strings (not a strict enum) because
 * the allowlist intentionally includes modules that don't exist yet — e.g.
 * `club-finance`, `social-relay` — so features can be gated before the code
 * lands.
 */
export type SpaceModuleId = string;

/**
 * Which modules are available inside each Space type.
 *
 * The personal space gets everything (sentinel `'*'`). Other types get a
 * curated subset — modules dealing with intimate personal data (mood,
 * dreams, period, body measurements, …) are intentionally excluded from
 * shared spaces.
 *
 * Rule of thumb: if a module's data would feel wrong shared with co-workers
 * or club members, keep it out.
 */
export const SPACE_MODULE_ALLOWLIST: Record<SpaceType, readonly SpaceModuleId[] | '*'> = {
	personal: '*',

	brand: [
		'mana',
		'social-relay', // future — not yet built
		'mail',
		'contacts',
		'calendar',
		'storage',
		'uload',
		'landing', // future
		'presi',
		'cards',
		'picture',
		'quotes',
		'news',
		'news-research',
		'research-lab',
		'ai-agents',
		'companion',
		'times',
		'notes',
		'photos',
		'invoices',
		'activity',
		'goals',
	],

	club: [
		'mana',
		'contacts',
		'calendar',
		'events',
		'mail',
		'storage',
		'uload',
		'news',
		'research-lab',
		'club-members', // future — ClubDesk Paket A
		'club-finance', // future — ClubDesk Paket B
		'invoices',
		'finance',
		'landing', // future — Paket C (Vereinswebsite)
		'presi',
		'cards',
		'quotes',
		'companion',
		'times',
		'notes',
		'photos',
		'activity',
		'goals',
	],

	family: [
		'mana',
		'contacts',
		'calendar',
		'events',
		'mail',
		'storage',
		'uload',
		'recipes',
		'food',
		'places',
		'presi',
		'cards',
		'photos',
		'notes',
		'companion',
		'goals',
		'activity',
		'wetter',
		'wisekeep',
		'firsts',
	],

	team: [
		'mana',
		'contacts',
		'calendar',
		'events',
		'storage',
		'mail',
		'uload',
		'news',
		'news-research',
		'research-lab',
		'presi',
		'cards',
		'picture',
		'notes',
		'quotes',
		'invoices',
		'companion',
		'ai-agents',
		'times',
		'activity',
		'goals',
	],

	practice: [
		'mana',
		'contacts',
		'calendar',
		'storage',
		'mail',
		'uload',
		'invoices',
		'finance',
		'times',
		'notes',
		'presi',
		'cards',
		'quotes',
		'companion',
		'research-lab',
		'activity',
		'goals',
	],
} as const;

/**
 * Check whether a module is available inside a given Space type.
 *
 * Used by:
 *   - Scope wrapper (apps/mana/.../data/scope/scoped-db.ts) to block queries
 *     against disallowed modules — structural guard against UI bypass.
 *   - UI module launcher to hide disabled modules in the active space.
 *   - Route guards that check before mounting a module page.
 */
export function isModuleAllowedInSpace(moduleId: SpaceModuleId, spaceType: SpaceType): boolean {
	const allow = SPACE_MODULE_ALLOWLIST[spaceType];
	if (allow === '*') return true;
	return allow.includes(moduleId);
}
