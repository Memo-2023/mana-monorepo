/**
 * Space — UI-facing labels and descriptions
 *
 * The canonical type/allowlist definitions live in `@mana/shared-types`
 * (framework-free so Bun services can import them). This file adds only
 * the i18n strings that belong to the UI branding layer.
 *
 * See docs/plans/spaces-foundation.md for the full RFC.
 */

import type { SpaceType } from '@mana/shared-types';

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
} as const satisfies Record<'de' | 'en', Record<SpaceType, string>>;

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
} as const satisfies Record<'de' | 'en', Record<SpaceType, string>>;

// Re-export canonical types from shared-types so frontend consumers can
// import everything space-related from `@mana/shared-branding` for
// convenience.
export {
	SPACE_TYPES,
	SPACE_MODULE_ALLOWLIST,
	isModuleAllowedInSpace,
	isSpaceType,
	parseSpaceMetadata,
	type SpaceType,
	type SpaceModuleId,
	type SpaceMetadata,
} from '@mana/shared-types';
