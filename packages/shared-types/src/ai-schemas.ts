/**
 * Shared Zod schemas for AI structured-output endpoints.
 *
 * Single source of truth for the wire format between mana-api and the
 * unified Mana app. Backend routes use these schemas with the Vercel
 * AI SDK's `generateObject` to enforce a strict shape on Gemini Vision
 * responses; the frontend imports the inferred TypeScript types via
 * `z.infer<typeof Schema>` so changes here propagate end-to-end.
 *
 * Why a Zod schema instead of a plain TS interface?
 *   - Runtime validation: if Gemini hallucinates a field, we throw
 *     before the data hits the IndexedDB write path
 *   - Provider-portable structured outputs: the AI SDK translates the
 *     same schema into OpenAI strict json_schema, Anthropic tool-use,
 *     or Gemini response_schema depending on which backend mana-llm
 *     routes to
 *   - Single source of truth: backend and frontend share one definition,
 *     no manual type-drift between Hono routes and Svelte stores
 */

import { z } from 'zod';

// ─── NutriPhi: meal photo / text analysis ────────────────────────

const AnalyzedFoodSchema = z.object({
	name: z.string().describe('The food item name in German'),
	quantity: z
		.string()
		.optional()
		.describe('Approximate portion description, e.g. "1 Tasse" or "200g"'),
	calories: z.number().optional().describe('Estimated calories for this item alone'),
});

const NutritionDataSchema = z.object({
	calories: z.number().describe('Total kcal for the entire meal'),
	protein: z.number().describe('Protein in grams'),
	carbohydrates: z.number().describe('Carbohydrates in grams'),
	fat: z.number().describe('Fat in grams'),
	fiber: z.number().describe('Dietary fiber in grams'),
	sugar: z.number().describe('Sugar in grams'),
});

export const MealAnalysisSchema = z.object({
	foods: z.array(AnalyzedFoodSchema).describe('Each individual food item the model could identify'),
	totalNutrition: NutritionDataSchema.describe('Sum across all foods'),
	description: z.string().describe('A short, human-readable summary of the meal in German'),
	confidence: z.number().min(0).max(1).describe('How confident the model is in its analysis, 0..1'),
	warnings: z
		.array(z.string())
		.default([])
		.describe('Optional health-related warnings (e.g. "high in sugar")'),
	suggestions: z.array(z.string()).default([]).describe('Optional suggestions to improve the meal'),
});

export type MealAnalysis = z.infer<typeof MealAnalysisSchema>;
export type AnalyzedFood = z.infer<typeof AnalyzedFoodSchema>;
export type NutritionData = z.infer<typeof NutritionDataSchema>;

// ─── Planta: plant photo identification ──────────────────────────

export const PlantIdentificationSchema = z.object({
	scientificName: z.string().optional().describe('Latin binomial, e.g. "Monstera deliciosa"'),
	commonNames: z.array(z.string()).default([]).describe('Common names in German if known'),
	confidence: z.number().min(0).max(1).optional().describe('Identification confidence, 0..1'),
	healthAssessment: z.string().optional().describe('Brief health observation visible in the photo'),
	wateringAdvice: z.string().optional().describe('How often to water this species'),
	lightAdvice: z.string().optional().describe('Preferred light conditions'),
	generalTips: z.array(z.string()).default([]).describe('Other care tips, in German'),
});

export type PlantIdentification = z.infer<typeof PlantIdentificationSchema>;
