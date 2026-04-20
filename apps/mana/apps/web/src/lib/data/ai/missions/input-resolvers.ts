/**
 * Input-resolver registry.
 *
 * A Mission references records in other modules via {@link MissionInputRef}.
 * The Runner needs to fetch those records and project them to plain text
 * so the Planner can drop them into its prompt. Each module registers a
 * resolver once on app init (`registerInputResolver`) — the Runner then
 * looks up by module name and falls back to a no-op with a console warning
 * if nothing's registered (keeps Missions robust against module removal).
 *
 * Why a registry instead of a central switch statement: cross-module
 * imports here would couple `data/ai/` to every product module. The
 * registry pattern lets each module own its own projection in its own
 * module-init file.
 */

import type { MissionInputRef } from './types';
import type { ResolvedInput } from '@mana/shared-ai';

export type InputResolver = (ref: MissionInputRef) => Promise<ResolvedInput | null>;

const resolvers = new Map<string, InputResolver>();

/** Register a resolver for a module. Idempotent — last registration wins. */
export function registerInputResolver(moduleName: string, resolver: InputResolver): void {
	resolvers.set(moduleName, resolver);
}

/** Remove a resolver (test helper). */
export function unregisterInputResolver(moduleName: string): void {
	resolvers.delete(moduleName);
}

export function getInputResolver(moduleName: string): InputResolver | undefined {
	return resolvers.get(moduleName);
}

/**
 * Resolve every ref a Mission declares, in parallel. Refs whose module has
 * no resolver registered, or whose resolver returns null, are dropped with
 * a warning — the Planner just sees fewer inputs, never crashes the run.
 */
export async function resolveMissionInputs(
	refs: readonly MissionInputRef[]
): Promise<ResolvedInput[]> {
	const results = await Promise.all(
		refs.map(async (ref) => {
			const resolver = resolvers.get(ref.module);
			if (!resolver) {
				console.warn(`[MissionRunner] no input resolver registered for module "${ref.module}"`);
				return null;
			}
			try {
				return await resolver(ref);
			} catch (err) {
				console.error(`[MissionRunner] input resolver for ${ref.module} threw on ${ref.id}:`, err);
				return null;
			}
		})
	);
	return results.filter((r): r is ResolvedInput => r !== null);
}
