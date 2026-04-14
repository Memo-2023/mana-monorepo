/**
 * Resolver registry + bulk-resolve helper.
 *
 * Each module that wants server-side Planner context registers a
 * {@link ServerInputResolver} here. Missions referencing modules without
 * a registered resolver silently drop those inputs — the Planner sees
 * fewer inputs, never crashes. Drift-tolerant by design.
 */

import type { Sql } from '../connection';
import type { MissionInputRef, ResolvedInput } from '@mana/shared-ai';
import type { ServerInputResolver } from './types';
import { goalsResolver } from './goals';

const resolvers = new Map<string, ServerInputResolver>();

export function registerServerResolver(moduleName: string, resolver: ServerInputResolver): void {
	resolvers.set(moduleName, resolver);
}

export function unregisterServerResolver(moduleName: string): void {
	resolvers.delete(moduleName);
}

// Seed with the built-in plaintext resolvers. Encrypted modules (notes,
// kontext, journal, dreams, …) are intentionally NOT registered — the
// server only sees ciphertext for those tables and can't produce useful
// Planner context. Missions referencing them should use the foreground
// runner; see CLAUDE.md → "Privacy constraint" for rationale.
registerServerResolver('goals', goalsResolver);

export async function resolveServerInputs(
	sql: Sql,
	refs: readonly MissionInputRef[],
	userId: string
): Promise<ResolvedInput[]> {
	const results = await Promise.all(
		refs.map(async (ref) => {
			const resolver = resolvers.get(ref.module);
			if (!resolver) return null;
			try {
				return await resolver(sql, ref, userId);
			} catch (err) {
				console.error(
					`[mana-ai resolver] module=${ref.module} ref=${ref.id} threw:`,
					err instanceof Error ? err.message : String(err)
				);
				return null;
			}
		})
	);
	return results.filter((r): r is ResolvedInput => r !== null);
}

export type { ServerInputResolver } from './types';
