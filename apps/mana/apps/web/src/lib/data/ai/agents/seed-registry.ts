/**
 * Seed-Handler registry — module-local bridges between a
 * WorkbenchTemplate's `seeds` field and each module's own store.
 *
 * When a user applies a template, `apply-template.ts` walks
 * `template.seeds` (a map `moduleName → items[]`) and calls the
 * registered handler for each module. The handler unpacks each item's
 * `data` payload according to its own schema + is responsible for
 * idempotency via the optional `stableId`.
 *
 * Handlers register themselves at module-load time via
 * `registerSeedHandler(...)`. To ensure the registry is populated
 * before a template is applied, the seed modules must be imported
 * from somewhere in the eager boot path — usually via the mission-
 * tick setup in `$lib/data/ai/missions/setup.ts`.
 */

import type { WorkbenchTemplateSeedItem } from '@mana/shared-ai';

export interface SeedOutcome {
	/** Carried through from the input item so callers can correlate. */
	readonly stableId?: string;
	readonly outcome: 'created' | 'skipped-exists' | 'failed';
	readonly error?: string;
}

export interface SeedHandler {
	/** Module name matching keys in `WorkbenchTemplate.seeds`. */
	readonly moduleName: string;
	/** Applies all items for this module. Should return one outcome
	 *  per input item in input order. Must NOT throw — failures are
	 *  returned as `{outcome: 'failed'}` entries. */
	readonly apply: (items: readonly WorkbenchTemplateSeedItem[]) => Promise<readonly SeedOutcome[]>;
}

const handlers = new Map<string, SeedHandler>();

export function registerSeedHandler(handler: SeedHandler): void {
	handlers.set(handler.moduleName, handler);
}

export function getSeedHandler(moduleName: string): SeedHandler | undefined {
	return handlers.get(moduleName);
}

/** For tests that want to reset the registry between runs. Not
 *  exported from any barrel; import directly when needed. */
export function _clearSeedHandlersForTesting(): void {
	handlers.clear();
}
