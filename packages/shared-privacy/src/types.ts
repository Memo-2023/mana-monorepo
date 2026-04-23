/**
 * Canonical visibility levels for any user-owned record in Mana.
 *
 * See docs/plans/visibility-system.md for the full design. Short form:
 *
 *   private   — only the owner (personal space) sees it
 *   space     — all space members per spaceModulePermissions
 *   unlisted  — reachable via direct link + token; not listed, noindex
 *   public    — embeddable on websites, discoverable to anonymous visitors
 */
export type VisibilityLevel = 'private' | 'space' | 'unlisted' | 'public';

/** Iteration-safe ordering. Used by the picker to render radio-list choices. */
export const VISIBILITY_LEVELS: readonly VisibilityLevel[] = [
	'private',
	'space',
	'unlisted',
	'public',
] as const;

/**
 * UI-agnostic descriptors so non-Svelte surfaces (CLI, audit logs, AI
 * agent explanations) can label a level consistently without reaching
 * into the Svelte component.
 *
 * German copy lives in the metadata because the whole Mana UI is German
 * today — i18n for privacy copy is a concrete follow-up when we add a
 * locale switch, not something to solve upfront.
 */
export interface VisibilityMeta {
	label: string;
	description: string;
	/** Phosphor icon name — resolved at render time via @mana/shared-icons. */
	icon: 'Lock' | 'UsersThree' | 'LinkSimple' | 'Globe';
}

export const VISIBILITY_METADATA: Record<VisibilityLevel, VisibilityMeta> = {
	private: {
		label: 'Privat',
		description: 'Nur du siehst es.',
		icon: 'Lock',
	},
	space: {
		label: 'Bereich',
		description: 'Alle Mitglieder dieses Bereichs sehen es.',
		icon: 'UsersThree',
	},
	unlisted: {
		label: 'Per Link',
		description: 'Wer den Link hat, kann es sehen. Nicht gelistet.',
		icon: 'LinkSimple',
	},
	public: {
		label: 'Öffentlich',
		description: 'Auf deiner Website und für alle sichtbar.',
		icon: 'Globe',
	},
};

/**
 * Payload for the `VisibilityChanged` domain event — emitted by module
 * stores whenever a record's visibility flips. The event catalog in the
 * web app registers this type when the first module adopts the system
 * (see docs/plans/visibility-system.md §M2).
 */
export interface VisibilityChangedPayload {
	recordId: string;
	collection: string;
	before: VisibilityLevel;
	after: VisibilityLevel;
}
