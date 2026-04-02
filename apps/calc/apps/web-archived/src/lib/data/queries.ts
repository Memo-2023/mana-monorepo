/**
 * Reactive Queries for Calc
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	calculationCollection,
	savedFormulaCollection,
	type LocalCalculation,
	type LocalSavedFormula,
} from './local-store';
import type { Calculation, SavedFormula } from '@calc/shared';

// ─── Type Converters ───────────────────────────────────────

export function toCalculation(local: LocalCalculation): Calculation {
	return {
		id: local.id,
		userId: 'local',
		mode: local.mode,
		expression: local.expression,
		result: local.result,
		skin: local.skin,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

export function toSavedFormula(local: LocalSavedFormula): SavedFormula {
	return {
		id: local.id,
		userId: 'local',
		name: local.name,
		expression: local.expression,
		description: local.description ?? undefined,
		mode: local.mode,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Query Hooks ──────────────────────────────────────

/** All calculations (history), newest first. */
export function useAllCalculations() {
	return useLiveQueryWithDefault(async () => {
		const locals = await calculationCollection.getAll();
		return locals.map(toCalculation).reverse();
	}, [] as Calculation[]);
}

/** All saved formulas. */
export function useAllSavedFormulas() {
	return useLiveQueryWithDefault(async () => {
		const locals = await savedFormulaCollection.getAll();
		return locals.map(toSavedFormula);
	}, [] as SavedFormula[]);
}
