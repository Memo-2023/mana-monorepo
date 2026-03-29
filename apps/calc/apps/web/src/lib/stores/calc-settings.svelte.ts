/**
 * Calc-specific settings — persisted to localStorage.
 */

import { browser } from '$app/environment';
import type { CalculatorMode, CalculatorSkin } from '@calc/shared';

const STORAGE_KEY = 'calc-settings';

interface CalcSettings {
	defaultMode: CalculatorMode;
	defaultSkin: CalculatorSkin;
	decimalPlaces: number;
	thousandsSeparator: boolean;
	angleMode: 'deg' | 'rad';
	historySize: number;
	showKeyboardHints: boolean;
}

const DEFAULTS: CalcSettings = {
	defaultMode: 'standard',
	defaultSkin: 'modern',
	decimalPlaces: 10,
	thousandsSeparator: false,
	angleMode: 'rad',
	historySize: 50,
	showKeyboardHints: true,
};

function load(): CalcSettings {
	if (!browser) return { ...DEFAULTS };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
	} catch {}
	return { ...DEFAULTS };
}

function save(settings: CalcSettings) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// Reactive settings store using Svelte 5 runes
let current = $state<CalcSettings>(load());

export const calcSettings = {
	get value() {
		return current;
	},

	update(partial: Partial<CalcSettings>) {
		current = { ...current, ...partial };
		save(current);
	},

	reset() {
		current = { ...DEFAULTS };
		save(current);
	},

	get defaults() {
		return DEFAULTS;
	},
};
