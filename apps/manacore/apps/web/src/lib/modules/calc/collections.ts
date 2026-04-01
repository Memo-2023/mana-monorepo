/**
 * Calc module — collection accessors and guest seed data.
 */

import { db } from '$lib/data/database';
import type { LocalCalculation, LocalSavedFormula } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const calculationTable = db.table<LocalCalculation>('calculations');
export const savedFormulaTable = db.table<LocalSavedFormula>('savedFormulas');

// ─── Guest Seed ────────────────────────────────────────────

export const CALC_GUEST_SEED = {
	calculations: [
		{
			id: 'calc-demo-1',
			mode: 'standard' as const,
			expression: '42 * 23',
			result: '966',
		},
		{
			id: 'calc-demo-2',
			mode: 'scientific' as const,
			expression: 'sin(π/4)',
			result: '0.7071067812',
		},
		{
			id: 'calc-demo-3',
			mode: 'standard' as const,
			expression: '1024 / 8',
			result: '128',
		},
	],
};
