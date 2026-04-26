/**
 * Reactive Queries for Automations module.
 *
 * Uses useLiveQueryWithDefault on the unified database.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { deriveUpdatedAt } from '$lib/data/sync';
import { automationTable } from './collections';
import type { LocalAutomation } from './types';

// ─── Type Converter ──────────────────────────────────────

export interface Automation {
	id: string;
	name: string;
	enabled: boolean;
	sourceApp: string;
	sourceCollection: string;
	sourceOp: 'insert' | 'update';
	conditionField?: string;
	conditionOp?: string;
	conditionValue?: string;
	targetApp: string;
	targetAction: string;
	targetParams?: Record<string, string>;
	createdAt: string;
	updatedAt: string;
}

export function toAutomation(local: LocalAutomation): Automation {
	return {
		id: local.id,
		name: local.name,
		enabled: local.enabled,
		sourceApp: local.sourceApp,
		sourceCollection: local.sourceCollection,
		sourceOp: local.sourceOp,
		conditionField: local.conditionField,
		conditionOp: local.conditionOp,
		conditionValue: local.conditionValue,
		targetApp: local.targetApp,
		targetAction: local.targetAction,
		targetParams: local.targetParams,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: deriveUpdatedAt(local),
	};
}

// ─── Live Queries ────────────────────────────────────────

export function useAllAutomations() {
	return useLiveQueryWithDefault(async () => {
		const locals = await automationTable.toArray();
		return locals.filter((a) => !a.deletedAt).map(toAutomation);
	}, [] as Automation[]);
}

export function useEnabledAutomations() {
	return useLiveQueryWithDefault(async () => {
		const locals = await automationTable.toArray();
		return locals.filter((a) => !a.deletedAt && a.enabled).map(toAutomation);
	}, [] as Automation[]);
}
