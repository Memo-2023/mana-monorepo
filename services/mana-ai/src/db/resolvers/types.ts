/**
 * Server-side input resolvers.
 *
 * **Privacy constraint**: the server sees `sync_changes.data` rows as
 * they were written by the client. For tables in the webapp's encryption
 * registry (notes, kontextDoc, journal, dreams, etc.) that payload is
 * already ciphertext — the master key lives in mana-auth KEK-wrapped
 * and never reaches this service. Resolvers for encrypted tables are
 * therefore either:
 *
 *   1. Not implemented server-side at all (user should run those
 *      missions via the foreground Runner which decrypts client-side)
 *   2. Return metadata-only (record exists, last-updated timestamp) and
 *      a fixed "content encrypted — use foreground runner" content blob
 *      so the Planner can still generate meaningful plans
 *
 * Today we take route (1) for notes + kontext and skip silently; only
 * plaintext tables (goals, the mission record itself) resolve fully.
 */

import type { Sql } from '../connection';
import type { MissionInputRef, ResolvedInput } from '@mana/shared-ai';

/**
 * Per-tick context passed into every resolver. Lets encrypted resolvers
 * read the Mission Data Key (MDK) + allowlist without the registry
 * having to know which resolvers need it. Plaintext resolvers ignore
 * these fields entirely.
 */
export interface ResolverContext {
	/** Mission whose input is being resolved — used for audit attribution. */
	missionId: string;
	/** Unwrapped AES-GCM Mission Data Key, if the mission carries a
	 *  currently-valid grant. Undefined for missions without a grant or
	 *  when the unwrap failed; plaintext resolvers don't care. */
	mdk?: CryptoKey;
	/** Record-ID allowlist from the grant, in `${table}:${recordId}` form.
	 *  Encrypted resolvers MUST refuse to decrypt anything outside this
	 *  set (cryptographically enforced by the scope-bound HKDF, but
	 *  double-checked at runtime to produce clean audit trails). */
	allowlist?: ReadonlySet<string>;
}

export type ServerInputResolver = (
	sql: Sql,
	ref: MissionInputRef,
	userId: string,
	context: ResolverContext
) => Promise<ResolvedInput | null>;
