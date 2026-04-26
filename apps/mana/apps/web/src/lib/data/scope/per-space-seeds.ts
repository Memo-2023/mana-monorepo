/**
 * Per-Space Seeds Registry — single chokepoint for "what does every Space
 * get pre-populated with on first visit?".
 *
 * Why a registry:
 * - Replaces the three race-prone ad-hoc seeding paths in the scenes
 *   store (count==0 init seed + replay-on-register seed + per-Space-
 *   change seed) with one deterministic call from `setActiveSpace`.
 * - Each seeder is responsible for its own idempotency (deterministic
 *   primary key + Dexie `put` upsert). The registry stays
 *   pattern-agnostic — it only iterates and isolates errors.
 *
 * Modules register themselves via side-effect imports (see
 * `data/seeds/index.ts`). The +layout boot path imports the seeds
 * barrel before `loadActiveSpace`, so by the time `setActiveSpace`
 * fires, every seeder is already in the map.
 *
 * See docs/plans/workbench-seeding-cleanup.md.
 */

type Seeder = (spaceId: string) => Promise<void>;

const seeders = new Map<string, Seeder>();

/**
 * Register a per-Space seeder. The `name` is used purely for diagnostic
 * logging — duplicate names overwrite, so re-registering the same
 * seeder during HMR is safe.
 */
export function registerSpaceSeed(name: string, fn: Seeder): void {
	seeders.set(name, fn);
}

/**
 * Run every registered seeder against the given Space id. Errors are
 * caught per-seeder and logged — a failure in one module's seed must
 * not prevent the others from running.
 *
 * Fire-and-forget by convention: callers shouldn't block UI on seeds.
 * The active-space switch propagates immediately; seeds catch up
 * asynchronously.
 */
export async function runSpaceSeeds(spaceId: string): Promise<void> {
	for (const [name, fn] of seeders) {
		try {
			await fn(spaceId);
		} catch (err) {
			console.error(`[per-space-seeds] '${name}' failed for space ${spaceId}:`, err);
		}
	}
}

/**
 * Test-only: drop every registered seeder. Production code never needs
 * this — vitest suites that exercise the registry use it to keep
 * tests independent.
 */
export function __resetSpaceSeedsForTests(): void {
	seeders.clear();
}
