/**
 * Calc App — Local-First Data Layer
 *
 * Defines the IndexedDB database, collections, and guest seed data.
 * This is the single source of truth for all Calc data.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestCalculations } from './guest-seed';
import type { CalculatorMode, CalculatorSkin } from '@calc/shared';

// ─── Types ──────────────────────────────────────────────────

export interface LocalCalculation extends BaseRecord {
	mode: CalculatorMode;
	expression: string;
	result: string;
	skin?: CalculatorSkin;
}

export interface LocalSavedFormula extends BaseRecord {
	name: string;
	expression: string;
	description: string | null;
	mode: CalculatorMode;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const calcStore = createLocalStore({
	appId: 'calc',
	collections: [
		{
			name: 'calculations',
			indexes: ['mode'],
			guestSeed: guestCalculations,
		},
		{
			name: 'savedFormulas',
			indexes: ['mode', 'name'],
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const calculationCollection = calcStore.collection<LocalCalculation>('calculations');
export const savedFormulaCollection = calcStore.collection<LocalSavedFormula>('savedFormulas');
