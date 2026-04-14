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

export type ServerInputResolver = (
	sql: Sql,
	ref: MissionInputRef,
	userId: string
) => Promise<ResolvedInput | null>;
