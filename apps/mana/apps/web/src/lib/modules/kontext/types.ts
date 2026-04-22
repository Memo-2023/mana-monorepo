/**
 * Kontext module types — per-Space markdown document.
 *
 * Since Phase 2d.2 of the space-scoped rollout, each Space can have its
 * own kontextDoc (was: user-level singleton keyed by id='singleton').
 * Personal-Space's pre-migration singleton row stays usable because its
 * stamped spaceId falls inside the in-scope set returned by
 * getInScopeSpaceIds(); fresh rows use random UUIDs.
 */

import type { BaseRecord } from '@mana/local-store';

/**
 * Legacy singleton id — pre-Phase-2d.2 the whole module was one row
 * keyed by this. Kept for backward-compat lookups on Personal-Space
 * records that predate the refactor; new rows use crypto.randomUUID().
 */
export const KONTEXT_SINGLETON_ID = 'singleton' as const;

export interface LocalKontextDoc extends BaseRecord {
	id: string;
	content: string;
}

export interface KontextDoc {
	id: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}
