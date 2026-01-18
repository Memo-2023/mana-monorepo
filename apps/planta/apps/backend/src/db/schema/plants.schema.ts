import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const plants = pgTable('plants', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),

	// Plant identity
	name: text('name').notNull(),
	scientificName: text('scientific_name'),
	commonName: text('common_name'),
	species: text('species'),

	// Care info (from AI)
	lightRequirements: text('light_requirements'),
	wateringFrequencyDays: integer('watering_frequency_days'),
	humidity: text('humidity'),
	temperature: text('temperature'),
	soilType: text('soil_type'),
	careNotes: text('care_notes'),

	// Status
	isActive: boolean('is_active').default(true).notNull(),
	healthStatus: text('health_status'),

	// Timestamps
	acquiredAt: timestamp('acquired_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Plant = typeof plants.$inferSelect;
export type NewPlant = typeof plants.$inferInsert;
