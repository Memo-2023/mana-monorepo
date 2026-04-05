/**
 * Calc module types for the unified app.
 */

import type { BaseRecord } from '@mana/local-store';
import type { CalculatorMode, CalculatorSkin } from '@calc/shared';

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
