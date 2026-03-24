import { describe, it, expect } from 'vitest';
import { parseMealInput, formatParsedMealPreview } from './meal-parser';

describe('parseMealInput', () => {
	it('should parse food description', () => {
		const result = parseMealInput('Spaghetti Bolognese');
		expect(result.description).toBe('Spaghetti Bolognese');
		expect(result.mealTypeExplicit).toBe(false);
	});

	it('should extract frühstück', () => {
		const result = parseMealInput('2 Eier Toast Frühstück');
		expect(result.description).toBe('2 Eier Toast');
		expect(result.mealType).toBe('breakfast');
		expect(result.mealTypeExplicit).toBe(true);
	});

	it('should extract mittagessen', () => {
		const result = parseMealInput('Spaghetti Bolognese Mittagessen');
		expect(result.description).toBe('Spaghetti Bolognese');
		expect(result.mealType).toBe('lunch');
		expect(result.mealTypeExplicit).toBe(true);
	});

	it('should extract abendessen', () => {
		const result = parseMealInput('Pizza abendessen');
		expect(result.description).toBe('Pizza');
		expect(result.mealType).toBe('dinner');
		expect(result.mealTypeExplicit).toBe(true);
	});

	it('should extract snack', () => {
		const result = parseMealInput('Apfel snack');
		expect(result.description).toBe('Apfel');
		expect(result.mealType).toBe('snack');
		expect(result.mealTypeExplicit).toBe(true);
	});

	it('should extract morgens/mittags/abends', () => {
		expect(parseMealInput('Müsli morgens').mealType).toBe('breakfast');
		expect(parseMealInput('Salat mittags').mealType).toBe('lunch');
		expect(parseMealInput('Suppe abends').mealType).toBe('dinner');
	});

	it('should auto-detect meal type when not specified', () => {
		const result = parseMealInput('Käsebrot');
		expect(result.description).toBe('Käsebrot');
		expect(result.mealTypeExplicit).toBe(false);
		// mealType is auto-detected based on time of day
		expect(['breakfast', 'lunch', 'dinner', 'snack']).toContain(result.mealType);
	});

	it('should handle empty input', () => {
		const result = parseMealInput('');
		expect(result.description).toBe('');
	});

	it('should handle comma-separated foods', () => {
		const result = parseMealInput('Reis, Hähnchen, Brokkoli Mittagessen');
		expect(result.description).toBe('Reis, Hähnchen, Brokkoli');
		expect(result.mealType).toBe('lunch');
	});
});

describe('formatParsedMealPreview', () => {
	it('should show meal type', () => {
		const parsed = parseMealInput('Toast Frühstück');
		const preview = formatParsedMealPreview(parsed);
		expect(preview).toContain('Frühstück');
	});

	it('should show auto-detection hint', () => {
		const parsed = parseMealInput('Apfel');
		const preview = formatParsedMealPreview(parsed);
		expect(preview).toContain('automatisch');
	});

	it('should not show auto hint when explicit', () => {
		const parsed = parseMealInput('Apfel snack');
		const preview = formatParsedMealPreview(parsed);
		expect(preview).not.toContain('automatisch');
	});
});
