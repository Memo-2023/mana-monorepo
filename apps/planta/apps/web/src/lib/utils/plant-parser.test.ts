import { describe, it, expect } from 'vitest';
import { parsePlantInput, resolvePlantData, formatParsedPlantPreview } from './plant-parser';

describe('parsePlantInput', () => {
	it('should parse a simple name', () => {
		const result = parsePlantInput('Monstera');
		expect(result.name).toBe('Monstera');
		expect(result.acquiredAt).toBeUndefined();
		expect(result.tagNames).toEqual([]);
	});

	it('should parse name with tags', () => {
		const result = parsePlantInput('Basilikum #kräuter #küche');
		expect(result.name).toBe('Basilikum');
		expect(result.tagNames).toEqual(['kräuter', 'küche']);
	});

	it('should parse acquisition date', () => {
		const result = parsePlantInput('Ficus morgen gekauft');
		expect(result.name).toBe('Ficus');
		expect(result.acquiredAt).toBeDefined();
	});

	it('should default to today when "gekauft" without date', () => {
		const result = parsePlantInput('Orchidee gekauft');
		expect(result.name).toBe('Orchidee');
		expect(result.acquiredAt).toBeDefined();
		expect(result.acquiredAt!.toDateString()).toBe(new Date().toDateString());
	});

	it('should parse "gepflanzt" as acquisition', () => {
		const result = parsePlantInput('Tomate heute gepflanzt');
		expect(result.name).toBe('Tomate');
		expect(result.acquiredAt).toBeDefined();
	});

	it('should parse multi-word name', () => {
		const result = parsePlantInput('Monstera deliciosa');
		expect(result.name).toBe('Monstera deliciosa');
	});

	it('should handle empty input', () => {
		const result = parsePlantInput('');
		expect(result.name).toBe('');
		expect(result.tagNames).toEqual([]);
	});

	it('should parse complex input', () => {
		const result = parsePlantInput('Aloe Vera heute gekauft #sukkulente #badezimmer');
		expect(result.name).toBe('Aloe Vera');
		expect(result.acquiredAt).toBeDefined();
		expect(result.tagNames).toEqual(['sukkulente', 'badezimmer']);
	});
});

describe('resolvePlantData', () => {
	it('should produce ISO date string', () => {
		const parsed = parsePlantInput('Ficus heute gekauft');
		const resolved = resolvePlantData(parsed);
		expect(resolved.name).toBe('Ficus');
		expect(resolved.acquiredAt).toBeDefined();
		expect(new Date(resolved.acquiredAt!).toISOString()).toBe(resolved.acquiredAt);
	});

	it('should handle no date', () => {
		const parsed = parsePlantInput('Monstera');
		const resolved = resolvePlantData(parsed);
		expect(resolved.acquiredAt).toBeUndefined();
	});
});

describe('formatParsedPlantPreview', () => {
	it('should format date', () => {
		const parsed = parsePlantInput('Ficus heute gekauft');
		const preview = formatParsedPlantPreview(parsed);
		expect(preview).toContain('Heute');
	});

	it('should format tags', () => {
		const parsed = parsePlantInput('Monstera #tropisch');
		const preview = formatParsedPlantPreview(parsed);
		expect(preview).toContain('tropisch');
	});

	it('should return empty for name-only', () => {
		const parsed = parsePlantInput('Monstera');
		expect(formatParsedPlantPreview(parsed)).toBe('');
	});
});
