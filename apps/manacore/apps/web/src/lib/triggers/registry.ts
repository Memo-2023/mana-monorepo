/**
 * Trigger Registry — Cross-Module Automation Engine
 *
 * Listens to Dexie write operations and fires matching triggers.
 * Triggers are evaluated synchronously, actions run async (fire-and-forget).
 */

type TriggerHandler = (data: Record<string, unknown>) => Promise<void> | void;

export interface RegisteredTrigger {
	id: string;
	sourceApp: string;
	sourceCollection: string;
	sourceOp: string;
	condition?: (data: Record<string, unknown>) => boolean;
	action: TriggerHandler;
}

const triggers: RegisteredTrigger[] = [];

/** Prevent triggers from firing triggers (infinite loops). */
let _firingTriggers = false;

export function register(trigger: RegisteredTrigger): void {
	// Avoid duplicates
	if (triggers.some((t) => t.id === trigger.id)) return;
	triggers.push(trigger);
}

export function unregister(id: string): void {
	const idx = triggers.findIndex((t) => t.id === id);
	if (idx !== -1) triggers.splice(idx, 1);
}

export function unregisterAll(): void {
	triggers.length = 0;
}

/**
 * Fire matching triggers for a database write.
 * Called from Dexie hooks in database.ts.
 */
export function fire(
	appId: string,
	collection: string,
	op: string,
	data: Record<string, unknown>
): void {
	if (_firingTriggers) return;

	const matching = triggers.filter(
		(t) => t.sourceApp === appId && t.sourceCollection === collection && t.sourceOp === op
	);

	if (matching.length === 0) return;

	_firingTriggers = true;

	for (const trigger of matching) {
		try {
			if (trigger.condition && !trigger.condition(data)) continue;

			// Fire-and-forget — don't block the Dexie hook
			Promise.resolve(trigger.action(data)).catch((err) => {
				console.error(`[Trigger] Action failed for ${trigger.id}:`, err);
			});
		} catch (err) {
			console.error(`[Trigger] Error evaluating ${trigger.id}:`, err);
		}
	}

	_firingTriggers = false;
}

export function getRegisteredTriggers(): readonly RegisteredTrigger[] {
	return triggers;
}
