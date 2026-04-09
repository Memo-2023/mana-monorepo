/**
 * Unit tests for the meal-input parser used by the global quick-input
 * bar. The parser is the only non-trivial logic in the adapter — the
 * surrounding onSearch / onCreate hooks are thin wrappers over the
 * already-tested mealMutations layer.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import { parseMealInput } from './quick-input-adapter';

afterEach(() => {
	vi.useRealTimers();
});

function pinTime(hour: number) {
	const date = new Date(2026, 3, 9, hour, 0, 0); // 2026-04-09
	vi.useFakeTimers();
	vi.setSystemTime(date);
}

describe('parseMealInput', () => {
	describe('explicit prefix', () => {
		it('recognises German Frühstück prefix', () => {
			const r = parseMealInput('Frühstück: Müsli mit Beeren');
			expect(r.mealType).toBe('breakfast');
			expect(r.description).toBe('Müsli mit Beeren');
			expect(r.hadExplicitPrefix).toBe(true);
		});

		it('recognises ASCII fruehstueck variant', () => {
			const r = parseMealInput('fruehstueck: Toast');
			expect(r.mealType).toBe('breakfast');
			expect(r.description).toBe('Toast');
		});

		it('recognises lunch and Mittagessen', () => {
			expect(parseMealInput('lunch: Salat').mealType).toBe('lunch');
			expect(parseMealInput('Mittagessen: Suppe').mealType).toBe('lunch');
			expect(parseMealInput('mittag: Pasta').mealType).toBe('lunch');
		});

		it('recognises dinner and Abendessen', () => {
			expect(parseMealInput('dinner: Pizza').mealType).toBe('dinner');
			expect(parseMealInput('Abendessen: Reis').mealType).toBe('dinner');
			expect(parseMealInput('abend: Bowl').mealType).toBe('dinner');
		});

		it('recognises snack and zwischendurch', () => {
			expect(parseMealInput('snack: Apfel').mealType).toBe('snack');
			expect(parseMealInput('zwischendurch: Nüsse').mealType).toBe('snack');
		});

		it('is case insensitive on the prefix', () => {
			expect(parseMealInput('LUNCH: Burger').mealType).toBe('lunch');
			expect(parseMealInput('Snack: Banane').mealType).toBe('snack');
		});

		it('trims whitespace around the prefix and description', () => {
			const r = parseMealInput('  lunch  :   Pasta mit Pesto  ');
			expect(r.mealType).toBe('lunch');
			expect(r.description).toBe('Pasta mit Pesto');
		});
	});

	describe('no prefix → time-of-day fallback', () => {
		it('falls back to breakfast in the morning', () => {
			pinTime(8);
			const r = parseMealInput('Müsli');
			expect(r.mealType).toBe('breakfast');
			expect(r.description).toBe('Müsli');
			expect(r.hadExplicitPrefix).toBe(false);
		});

		it('falls back to lunch around noon', () => {
			pinTime(13);
			expect(parseMealInput('Salat').mealType).toBe('lunch');
		});

		it('falls back to dinner in the evening', () => {
			pinTime(19);
			expect(parseMealInput('Pasta').mealType).toBe('dinner');
		});
	});

	describe('edge cases', () => {
		it('treats unknown prefix-like text as plain description', () => {
			pinTime(13);
			const r = parseMealInput('Hähnchen: gegrillt');
			expect(r.hadExplicitPrefix).toBe(false);
			expect(r.description).toBe('Hähnchen: gegrillt');
			expect(r.mealType).toBe('lunch'); // from time-of-day
		});

		it('does not treat far-away colons as prefixes', () => {
			pinTime(13);
			const longPrefix = 'das ist eine sehr lange beschreibung: foo';
			const r = parseMealInput(longPrefix);
			expect(r.hadExplicitPrefix).toBe(false);
			expect(r.description).toBe(longPrefix);
		});

		it('rejects empty description after prefix', () => {
			pinTime(13);
			const r = parseMealInput('lunch:   ');
			expect(r.hadExplicitPrefix).toBe(false);
			expect(r.description).toBe('lunch:');
		});
	});
});
