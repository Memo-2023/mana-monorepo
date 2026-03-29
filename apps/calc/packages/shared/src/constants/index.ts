import type { CalculatorMode, CalculatorSkin, UnitCategory, UnitDefinition } from '../types';

// ─── Calculator Mode Definitions ─────────────────────────

export const CALCULATOR_MODES: {
	id: CalculatorMode;
	label: { de: string; en: string };
	icon: string;
}[] = [
	{ id: 'standard', label: { de: 'Standard', en: 'Standard' }, icon: 'calculator' },
	{ id: 'scientific', label: { de: 'Wissenschaftlich', en: 'Scientific' }, icon: 'flask' },
	{ id: 'programmer', label: { de: 'Programmierer', en: 'Programmer' }, icon: 'code' },
	{ id: 'converter', label: { de: 'Einheiten', en: 'Units' }, icon: 'ruler' },
	{ id: 'currency', label: { de: 'Währung', en: 'Currency' }, icon: 'coins' },
	{ id: 'finance', label: { de: 'Finanzen', en: 'Finance' }, icon: 'piggy-bank' },
	{ id: 'date', label: { de: 'Datum', en: 'Date' }, icon: 'calendar' },
	{ id: 'percentage', label: { de: 'Prozent & Trinkgeld', en: 'Percent & Tip' }, icon: 'percent' },
];

// ─── Calculator Skins ────────────────────────────────────

export const CALCULATOR_SKINS: {
	id: CalculatorSkin;
	label: string;
	year?: number;
	description: { de: string; en: string };
}[] = [
	{
		id: 'modern',
		label: 'Modern',
		description: { de: 'Minimalistisches Design', en: 'Minimalist design' },
	},
	{
		id: 'hp35',
		label: 'HP-35',
		year: 1972,
		description: {
			de: 'Der erste wissenschaftliche Taschenrechner',
			en: 'The first scientific pocket calculator',
		},
	},
	{
		id: 'casio-fx',
		label: 'Casio fx',
		year: 1985,
		description: { de: 'Klassischer Schulrechner', en: 'Classic school calculator' },
	},
	{
		id: 'ti84',
		label: 'TI-84',
		year: 2004,
		description: { de: 'Grafischer Taschenrechner', en: 'Graphing calculator' },
	},
	{
		id: 'minimal',
		label: 'Minimal',
		description: { de: 'Nur das Nötigste', en: 'Just the essentials' },
	},
];

// ─── Unit Definitions ────────────────────────────────────

export const UNIT_CATEGORIES: {
	id: UnitCategory;
	label: { de: string; en: string };
	icon: string;
}[] = [
	{ id: 'length', label: { de: 'Länge', en: 'Length' }, icon: 'ruler' },
	{ id: 'weight', label: { de: 'Gewicht', en: 'Weight' }, icon: 'scale' },
	{ id: 'temperature', label: { de: 'Temperatur', en: 'Temperature' }, icon: 'thermometer' },
	{ id: 'volume', label: { de: 'Volumen', en: 'Volume' }, icon: 'beaker' },
	{ id: 'area', label: { de: 'Fläche', en: 'Area' }, icon: 'square' },
	{ id: 'speed', label: { de: 'Geschwindigkeit', en: 'Speed' }, icon: 'gauge' },
	{ id: 'time', label: { de: 'Zeit', en: 'Time' }, icon: 'clock' },
	{ id: 'data', label: { de: 'Daten', en: 'Data' }, icon: 'database' },
	{ id: 'energy', label: { de: 'Energie', en: 'Energy' }, icon: 'zap' },
	{ id: 'pressure', label: { de: 'Druck', en: 'Pressure' }, icon: 'gauge' },
];

// Length units (base: meter)
export const LENGTH_UNITS: UnitDefinition[] = [
	{
		id: 'mm',
		name: { de: 'Millimeter', en: 'Millimeter' },
		symbol: 'mm',
		toBase: (v) => v / 1000,
		fromBase: (v) => v * 1000,
	},
	{
		id: 'cm',
		name: { de: 'Zentimeter', en: 'Centimeter' },
		symbol: 'cm',
		toBase: (v) => v / 100,
		fromBase: (v) => v * 100,
	},
	{
		id: 'm',
		name: { de: 'Meter', en: 'Meter' },
		symbol: 'm',
		toBase: (v) => v,
		fromBase: (v) => v,
	},
	{
		id: 'km',
		name: { de: 'Kilometer', en: 'Kilometer' },
		symbol: 'km',
		toBase: (v) => v * 1000,
		fromBase: (v) => v / 1000,
	},
	{
		id: 'in',
		name: { de: 'Zoll', en: 'Inch' },
		symbol: 'in',
		toBase: (v) => v * 0.0254,
		fromBase: (v) => v / 0.0254,
	},
	{
		id: 'ft',
		name: { de: 'Fuß', en: 'Foot' },
		symbol: 'ft',
		toBase: (v) => v * 0.3048,
		fromBase: (v) => v / 0.3048,
	},
	{
		id: 'yd',
		name: { de: 'Yard', en: 'Yard' },
		symbol: 'yd',
		toBase: (v) => v * 0.9144,
		fromBase: (v) => v / 0.9144,
	},
	{
		id: 'mi',
		name: { de: 'Meile', en: 'Mile' },
		symbol: 'mi',
		toBase: (v) => v * 1609.344,
		fromBase: (v) => v / 1609.344,
	},
	{
		id: 'nmi',
		name: { de: 'Seemeile', en: 'Nautical Mile' },
		symbol: 'nmi',
		toBase: (v) => v * 1852,
		fromBase: (v) => v / 1852,
	},
];

// Weight units (base: kilogram)
export const WEIGHT_UNITS: UnitDefinition[] = [
	{
		id: 'mg',
		name: { de: 'Milligramm', en: 'Milligram' },
		symbol: 'mg',
		toBase: (v) => v / 1_000_000,
		fromBase: (v) => v * 1_000_000,
	},
	{
		id: 'g',
		name: { de: 'Gramm', en: 'Gram' },
		symbol: 'g',
		toBase: (v) => v / 1000,
		fromBase: (v) => v * 1000,
	},
	{
		id: 'kg',
		name: { de: 'Kilogramm', en: 'Kilogram' },
		symbol: 'kg',
		toBase: (v) => v,
		fromBase: (v) => v,
	},
	{
		id: 't',
		name: { de: 'Tonne', en: 'Metric Ton' },
		symbol: 't',
		toBase: (v) => v * 1000,
		fromBase: (v) => v / 1000,
	},
	{
		id: 'oz',
		name: { de: 'Unze', en: 'Ounce' },
		symbol: 'oz',
		toBase: (v) => v * 0.0283495,
		fromBase: (v) => v / 0.0283495,
	},
	{
		id: 'lb',
		name: { de: 'Pfund', en: 'Pound' },
		symbol: 'lb',
		toBase: (v) => v * 0.453592,
		fromBase: (v) => v / 0.453592,
	},
	{
		id: 'st',
		name: { de: 'Stone', en: 'Stone' },
		symbol: 'st',
		toBase: (v) => v * 6.35029,
		fromBase: (v) => v / 6.35029,
	},
];

// Temperature units (special handling - not simple multiplication)
export const TEMPERATURE_UNITS: UnitDefinition[] = [
	{
		id: 'c',
		name: { de: 'Celsius', en: 'Celsius' },
		symbol: '°C',
		toBase: (v) => v,
		fromBase: (v) => v,
	},
	{
		id: 'f',
		name: { de: 'Fahrenheit', en: 'Fahrenheit' },
		symbol: '°F',
		toBase: (v) => ((v - 32) * 5) / 9,
		fromBase: (v) => (v * 9) / 5 + 32,
	},
	{
		id: 'k',
		name: { de: 'Kelvin', en: 'Kelvin' },
		symbol: 'K',
		toBase: (v) => v - 273.15,
		fromBase: (v) => v + 273.15,
	},
];

// Volume units (base: liter)
export const VOLUME_UNITS: UnitDefinition[] = [
	{
		id: 'ml',
		name: { de: 'Milliliter', en: 'Milliliter' },
		symbol: 'ml',
		toBase: (v) => v / 1000,
		fromBase: (v) => v * 1000,
	},
	{
		id: 'l',
		name: { de: 'Liter', en: 'Liter' },
		symbol: 'l',
		toBase: (v) => v,
		fromBase: (v) => v,
	},
	{
		id: 'm3',
		name: { de: 'Kubikmeter', en: 'Cubic Meter' },
		symbol: 'm³',
		toBase: (v) => v * 1000,
		fromBase: (v) => v / 1000,
	},
	{
		id: 'gal',
		name: { de: 'Gallone (US)', en: 'Gallon (US)' },
		symbol: 'gal',
		toBase: (v) => v * 3.78541,
		fromBase: (v) => v / 3.78541,
	},
	{
		id: 'qt',
		name: { de: 'Quart (US)', en: 'Quart (US)' },
		symbol: 'qt',
		toBase: (v) => v * 0.946353,
		fromBase: (v) => v / 0.946353,
	},
	{
		id: 'pt',
		name: { de: 'Pint (US)', en: 'Pint (US)' },
		symbol: 'pt',
		toBase: (v) => v * 0.473176,
		fromBase: (v) => v / 0.473176,
	},
	{
		id: 'cup',
		name: { de: 'Cup (US)', en: 'Cup (US)' },
		symbol: 'cup',
		toBase: (v) => v * 0.236588,
		fromBase: (v) => v / 0.236588,
	},
	{
		id: 'floz',
		name: { de: 'Fluid Ounce (US)', en: 'Fluid Ounce (US)' },
		symbol: 'fl oz',
		toBase: (v) => v * 0.0295735,
		fromBase: (v) => v / 0.0295735,
	},
];

// Data units (base: byte)
export const DATA_UNITS: UnitDefinition[] = [
	{ id: 'b', name: { de: 'Byte', en: 'Byte' }, symbol: 'B', toBase: (v) => v, fromBase: (v) => v },
	{
		id: 'kb',
		name: { de: 'Kilobyte', en: 'Kilobyte' },
		symbol: 'KB',
		toBase: (v) => v * 1024,
		fromBase: (v) => v / 1024,
	},
	{
		id: 'mb',
		name: { de: 'Megabyte', en: 'Megabyte' },
		symbol: 'MB',
		toBase: (v) => v * 1024 ** 2,
		fromBase: (v) => v / 1024 ** 2,
	},
	{
		id: 'gb',
		name: { de: 'Gigabyte', en: 'Gigabyte' },
		symbol: 'GB',
		toBase: (v) => v * 1024 ** 3,
		fromBase: (v) => v / 1024 ** 3,
	},
	{
		id: 'tb',
		name: { de: 'Terabyte', en: 'Terabyte' },
		symbol: 'TB',
		toBase: (v) => v * 1024 ** 4,
		fromBase: (v) => v / 1024 ** 4,
	},
];

// Map category to units
export const UNITS_BY_CATEGORY: Record<string, UnitDefinition[]> = {
	length: LENGTH_UNITS,
	weight: WEIGHT_UNITS,
	temperature: TEMPERATURE_UNITS,
	volume: VOLUME_UNITS,
	data: DATA_UNITS,
};

// ─── Scientific Constants ────────────────────────────────

export const SCIENTIFIC_CONSTANTS = [
	{ id: 'pi', name: 'Pi', symbol: 'π', value: Math.PI },
	{ id: 'e', name: 'Euler', symbol: 'e', value: Math.E },
	{ id: 'phi', name: 'Goldener Schnitt', symbol: 'φ', value: 1.6180339887 },
	{ id: 'sqrt2', name: 'Wurzel 2', symbol: '√2', value: Math.SQRT2 },
	{ id: 'c', name: 'Lichtgeschwindigkeit', symbol: 'c', value: 299792458 },
	{ id: 'g', name: 'Erdbeschleunigung', symbol: 'g', value: 9.80665 },
	{ id: 'avogadro', name: 'Avogadro', symbol: 'Nₐ', value: 6.02214076e23 },
	{ id: 'planck', name: 'Planck', symbol: 'h', value: 6.62607015e-34 },
	{ id: 'boltzmann', name: 'Boltzmann', symbol: 'k', value: 1.380649e-23 },
];
