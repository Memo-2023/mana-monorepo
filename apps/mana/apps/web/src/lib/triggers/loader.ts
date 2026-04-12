/**
 * Automation Loader — Reads automation rules from IndexedDB and registers triggers.
 *
 * Called once at app startup. Watches for changes to re-register.
 */

import { db } from '$lib/data/database';
import { register, unregisterAll } from './registry';
import { evaluateCondition, type ConditionOp } from './conditions';
import { getAction } from './actions';

export interface LocalAutomation {
	id: string;
	name: string;
	enabled: boolean;
	sourceApp: string;
	sourceCollection: string;
	sourceOp: string;
	conditionField?: string;
	conditionOp?: ConditionOp;
	conditionValue?: string;
	targetApp: string;
	targetAction: string;
	targetParams?: Record<string, string>;
	deletedAt?: string;
	createdAt?: string;
	updatedAt?: string;
}

/**
 * Load all enabled automations from IndexedDB and register them as triggers.
 */
export async function loadAutomations(): Promise<void> {
	unregisterAll();

	const all = await db.table<LocalAutomation>('automations').toArray();
	const active = all.filter((a) => a.enabled && !a.deletedAt);

	for (const auto of active) {
		const actionFn = getAction(auto.targetApp, auto.targetAction);
		if (!actionFn) {
			console.warn(`[Triggers] Unknown action: ${auto.targetApp}.${auto.targetAction}`);
			continue;
		}

		register({
			id: auto.id,
			sourceApp: auto.sourceApp,
			sourceCollection: auto.sourceCollection,
			sourceOp: auto.sourceOp,
			condition:
				auto.conditionField && auto.conditionOp && auto.conditionValue
					? (data) =>
							evaluateCondition(data, auto.conditionField!, auto.conditionOp!, auto.conditionValue!)
					: undefined,
			action: async (data) => {
				await actionFn(auto.targetParams ?? {}, data);
			},
		});
	}

	if (import.meta.env.DEV && active.length > 0) {
		console.log(`[Triggers] Loaded ${active.length} automation(s)`);
	}
}
