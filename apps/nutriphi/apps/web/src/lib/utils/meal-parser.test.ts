import { describe, it, expect } from 'vitest';
import { parseMealInput, formatParsedMealPreview, parseFoodItems } from './meal-parser';

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

describe('parseFoodItems', () => {
	it('should parse "200g Reis, 2 Eier, 1 Scheibe Brot" into 3 items with amounts', () => {
		const items = parseFoodItems('200g Reis, 2 Eier, 1 Scheibe Brot');
		expect(items).toHaveLength(3);

		expect(items[0]).toEqual({ amount: 200, unit: 'g', name: 'Reis' });
		expect(items[1]).toEqual({ amount: 2, name: 'Eier' });
		expect(items[2]).toEqual({ amount: 1, unit: 'Scheibe', name: 'Brot' });
	});

	it('should parse "Spaghetti Bolognese" as 1 item with no amount', () => {
		const items = parseFoodItems('Spaghetti Bolognese');
		expect(items).toHaveLength(1);
		expect(items[0]).toEqual({ name: 'Spaghetti Bolognese' });
	});

	it('should parse "2 Eier, Toast, Orangensaft" into 3 items', () => {
		const items = parseFoodItems('2 Eier, Toast, Orangensaft');
		expect(items).toHaveLength(3);

		expect(items[0]).toEqual({ amount: 2, name: 'Eier' });
		expect(items[1]).toEqual({ name: 'Toast' });
		expect(items[2]).toEqual({ name: 'Orangensaft' });
	});

	it('should handle fractions like 1/2', () => {
		const items = parseFoodItems('1/2 Tasse Milch');
		expect(items).toHaveLength(1);
		expect(items[0]).toEqual({ amount: 0.5, unit: 'Tasse', name: 'Milch' });
	});

	it('should return empty array for empty input', () => {
		expect(parseFoodItems('')).toEqual([]);
	});
});

describe('parseMealInput with foodItems', () => {
	it('should include foodItems in parsed result', () => {
		const result = parseMealInput('200g Reis, 2 Eier, 1 Scheibe Brot');
		expect(result.foodItems).toHaveLength(3);
		expect(result.foodItems[0]).toEqual({ amount: 200, unit: 'g', name: 'Reis' });
	});

	it('should parse "2 Eier, Toast, Orangensaft Frühstück" with 3 items and breakfast type', () => {
		const result = parseMealInput('2 Eier, Toast, Orangensaft Frühstück');
		expect(result.mealType).toBe('breakfast');
		expect(result.mealTypeExplicit).toBe(true);
		expect(result.foodItems).toHaveLength(3);
		expect(result.foodItems[0]).toEqual({ amount: 2, name: 'Eier' });
		expect(result.foodItems[1]).toEqual({ name: 'Toast' });
		expect(result.foodItems[2]).toEqual({ name: 'Orangensaft' });
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

	it('should show items count in preview', () => {
		const parsed = parseMealInput('200g Reis, 2 Eier, 1 Scheibe Brot Mittagessen');
		const preview = formatParsedMealPreview(parsed);
		expect(preview).toContain('🥚 3 items');
	});
});
