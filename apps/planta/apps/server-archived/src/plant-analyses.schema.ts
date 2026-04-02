import { pgTable, uuid, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';
import { plantPhotos } from './plant-photos.schema';
import { plants } from './plants.schema';

export const plantAnalyses = pgTable('plant_analyses', {
	id: uuid('id').primaryKey().defaultRandom(),
	photoId: uuid('photo_id')
		.references(() => plantPhotos.id, { onDelete: 'cascade' })
		.notNull(),
	plantId: uuid('plant_id').references(() => plants.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull(),

	// AI Analysis Results
	identifiedSpecies: text('identified_species'),
	scientificName: text('scientific_name'),
	commonNames: jsonb('common_names').$type<string[]>(),
	confidence: integer('confidence'),

	// Plant condition
	healthAssessment: text('health_assessment'),
	healthDetails: text('health_details'),
	issues: jsonb('issues').$type<string[]>(),

	// Care recommendations
	wateringAdvice: text('watering_advice'),
	lightAdvice: text('light_advice'),
	fertilizingAdvice: text('fertilizing_advice'),
	generalTips: jsonb('general_tips').$type<string[]>(),

	// Raw AI response for debugging
	rawResponse: jsonb('raw_response'),
	model: text('model'),
	tokensUsed: integer('tokens_used'),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PlantAnalysis = typeof plantAnalyses.$inferSelect;
export type NewPlantAnalysis = typeof plantAnalyses.$inferInsert;
