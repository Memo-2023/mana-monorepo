// ─── Calculator Types ────────────────────────────────────

export type CalculatorMode =
	| 'standard'
	| 'scientific'
	| 'programmer'
	| 'converter'
	| 'currency'
	| 'finance'
	| 'date'
	| 'percentage';

export type CalculatorSkin = 'modern' | 'hp35' | 'casio-fx' | 'ti84' | 'minimal';

export interface Calculation {
	id: string;
	userId: string;
	mode: CalculatorMode;
	expression: string;
	result: string;
	skin?: CalculatorSkin;
	createdAt: string;
}

export interface CreateCalculationInput {
	mode: CalculatorMode;
	expression: string;
	result: string;
	skin?: CalculatorSkin;
}

export interface SavedFormula {
	id: string;
	userId: string;
	name: string;
	expression: string;
	description?: string;
	mode: CalculatorMode;
	createdAt: string;
	updatedAt: string;
}

export interface CreateFormulaInput {
	name: string;
	expression: string;
	description?: string;
	mode: CalculatorMode;
}

export interface UpdateFormulaInput {
	name?: string;
	expression?: string;
	description?: string;
}

// ─── Unit Converter ──────────────────────────────────────

export type UnitCategory =
	| 'length'
	| 'weight'
	| 'temperature'
	| 'volume'
	| 'area'
	| 'speed'
	| 'time'
	| 'data'
	| 'energy'
	| 'pressure';

export interface UnitDefinition {
	id: string;
	name: { de: string; en: string };
	symbol: string;
	toBase: (value: number) => number;
	fromBase: (value: number) => number;
}

// ─── Programmer Calculator ───────────────────────────────

export type NumberBase = 'dec' | 'hex' | 'oct' | 'bin';

// ─── Finance Calculator ──────────────────────────────────

export type FinanceMode = 'compound-interest' | 'loan' | 'savings' | 'tip' | 'split';

export interface CompoundInterestInput {
	principal: number;
	rate: number; // annual rate in %
	years: number;
	compoundsPerYear: number; // 1=annual, 4=quarterly, 12=monthly
}

export interface LoanInput {
	amount: number;
	annualRate: number;
	years: number;
}

export interface SavingsInput {
	monthlyDeposit: number;
	annualRate: number;
	years: number;
	initialDeposit?: number;
}
