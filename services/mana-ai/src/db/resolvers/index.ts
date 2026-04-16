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
import type { ResolverContext, ServerInputResolver } from './types';
import { goalsResolver } from './goals';
import {
	eventsResolver,
	journalResolver,
	kontextResolver,
	notesResolver,
	tasksResolver,
	userContextResolver,
} from './encrypted';

const resolvers = new Map<string, ServerInputResolver>();

export function registerServerResolver(moduleName: string, resolver: ServerInputResolver): void {
	resolvers.set(moduleName, resolver);
}

export function unregisterServerResolver(moduleName: string): void {
	resolvers.delete(moduleName);
}

// Plaintext resolvers run for every mission — no grant needed.
registerServerResolver('goals', goalsResolver);

// Encrypted resolvers require a currently-valid Mission Grant. Without
// one they return null per ref; the Planner then runs with fewer inputs
// and the foreground runner picks up the slack on the user's next
// browser visit. Encryption registry source: `apps/mana/apps/web/src/
// lib/data/crypto/registry.ts` — keep the table set here in sync with
// the set flipped to `enabled: true` there.
registerServerResolver('notes', notesResolver);
registerServerResolver('tasks', tasksResolver);
registerServerResolver('todo', tasksResolver);
registerServerResolver('calendar', eventsResolver);
registerServerResolver('journal', journalResolver);
registerServerResolver('kontext', kontextResolver);
registerServerResolver('profile', userContextResolver);

export async function resolveServerInputs(
	sql: Sql,
	refs: readonly MissionInputRef[],
	userId: string,
	context: ResolverContext
): Promise<ResolvedInput[]> {
	const results = await Promise.all(
		refs.map(async (ref) => {
			const resolver = resolvers.get(ref.module);
			if (!resolver) return null;
			try {
				return await resolver(sql, ref, userId, context);
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

export type { ResolverContext, ServerInputResolver } from './types';
