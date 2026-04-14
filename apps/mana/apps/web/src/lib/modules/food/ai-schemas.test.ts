/**
 * Sanity tests for the shared AI wire-format contract.
 *
 * The schemas themselves are mostly self-validating (Zod parses them at
 * import time), so the focus here is the envelope contract: every
 * frontend api.ts wraps its fetch result with the same shape, and a
 * version drift between client and server should produce a clear,
 * actionable error rather than silent corruption.
 *
 * Lives in the food module folder because food was the first
 * consumer; the shared-types package itself has no test runner set up.
 */

import { describe, expect, it } from 'vitest';
import {
	AI_SCHEMA_VERSION,
	AiSchemaVersionMismatchError,
	MealAnalysisSchema,
	PlantIdentificationSchema,
} from '@mana/shared-types';

describe('AI_SCHEMA_VERSION', () => {
	it('is a non-empty string constant', () => {
		expect(typeof AI_SCHEMA_VERSION).toBe('string');
		expect(AI_SCHEMA_VERSION.length).toBeGreaterThan(0);
	});
});

describe('AiSchemaVersionMismatchError', () => {
	it('captures both versions in the message', () => {
		const err = new AiSchemaVersionMismatchError('99', '1' as typeof AI_SCHEMA_VERSION);
		expect(err.message).toContain('99');
		expect(err.message).toContain('1');
		expect(err.received).toBe('99');
		expect(err.expected).toBe('1');
	});

	it('defaults the expected version to AI_SCHEMA_VERSION', () => {
		const err = new AiSchemaVersionMismatchError('42');
		expect(err.expected).toBe(AI_SCHEMA_VERSION);
	});

	it('is named so it can be discriminated in catch blocks', () => {
		const err = new AiSchemaVersionMismatchError('99');
		expect(err.name).toBe('AiSchemaVersionMismatchError');
		expect(err).toBeInstanceOf(Error);
	});
});

describe('MealAnalysisSchema', () => {
	const valid = {
		foods: [{ name: 'Apfel', quantity: '1 Stück', calories: 95 }],
		totalNutrition: {
			calories: 95,
			protein: 0.5,
			carbohydrates: 25,
			fat: 0.3,
			fiber: 4.4,
			sugar: 19,
		},
		description: 'Ein mittelgroßer Apfel',
		confidence: 0.92,
	};

	it('accepts a complete payload', () => {
		const parsed = MealAnalysisSchema.parse(valid);
		expect(parsed.foods).toHaveLength(1);
		expect(parsed.totalNutrition.calories).toBe(95);
	});

	it('fills in default empty arrays for warnings/suggestions', () => {
		const parsed = MealAnalysisSchema.parse(valid);
		expect(parsed.warnings).toEqual([]);
		expect(parsed.suggestions).toEqual([]);
	});

	it('rejects invalid confidence (out of [0,1])', () => {
		expect(() => MealAnalysisSchema.parse({ ...valid, confidence: 1.5 })).toThrow();
		expect(() => MealAnalysisSchema.parse({ ...valid, confidence: -0.1 })).toThrow();
	});

	it('rejects missing required nutrition fields', () => {
		const broken = {
			...valid,
			totalNutrition: { calories: 95 }, // missing protein, carbs, etc.
		};
		expect(() => MealAnalysisSchema.parse(broken)).toThrow();
	});

	it('allows foods without quantity/calories (model may not always estimate)', () => {
		const minimal = {
			...valid,
			foods: [{ name: 'Käse' }],
		};
		const parsed = MealAnalysisSchema.parse(minimal);
		expect(parsed.foods[0].name).toBe('Käse');
		expect(parsed.foods[0].quantity).toBeUndefined();
	});
});

describe('PlantIdentificationSchema', () => {
	it('accepts a complete payload', () => {
		const parsed = PlantIdentificationSchema.parse({
			scientificName: 'Monstera deliciosa',
			commonNames: ['Fensterblatt', 'Köstliches Fensterblatt'],
			confidence: 0.88,
			healthAssessment: 'Gesund',
			wateringAdvice: 'Alle 7 Tage',
			lightAdvice: 'Hell, indirektes Licht',
			generalTips: ['Hohe Luftfeuchtigkeit bevorzugt'],
		});
		expect(parsed.scientificName).toBe('Monstera deliciosa');
		expect(parsed.commonNames).toHaveLength(2);
	});

	it('fills in default empty arrays for commonNames/generalTips', () => {
		const parsed = PlantIdentificationSchema.parse({});
		expect(parsed.commonNames).toEqual([]);
		expect(parsed.generalTips).toEqual([]);
	});

	it('accepts an empty object — every field is optional by design', () => {
		const parsed = PlantIdentificationSchema.parse({});
		expect(parsed.scientificName).toBeUndefined();
		expect(parsed.confidence).toBeUndefined();
	});

	it('rejects out-of-range confidence', () => {
		expect(() => PlantIdentificationSchema.parse({ confidence: 2 })).toThrow();
	});
});
