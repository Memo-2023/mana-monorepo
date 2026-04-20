/**
 * Reactive queries for Calc — uses Dexie liveQuery on the unified DB.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import type { LocalCalculation, LocalSavedFormula } from './types';
import type { Calculation, SavedFormula } from '@calc/shared';

// ─── Type Converters ───────────────────────────────────────

export function toCalculation(local: LocalCalculation): Calculation {
	return {
		id: local.id,
		userId: local.userId ?? '',
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
		userId: local.userId ?? '',
		name: local.name,
		expression: local.expression,
		description: local.description ?? undefined,
		mode: local.mode,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

/** All calculations (history), newest first. */
export function useAllCalculations() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalCalculation, string>(
			'calc',
			'calculations'
		).toArray();
		return locals
			.filter((c) => !c.deletedAt)
			.map(toCalculation)
			.reverse();
	}, []);
}

/** All saved formulas. */
export function useAllSavedFormulas() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalSavedFormula, string>(
			'calc',
			'savedFormulas'
		).toArray();
		return locals.filter((f) => !f.deletedAt).map(toSavedFormula);
	}, []);
}
