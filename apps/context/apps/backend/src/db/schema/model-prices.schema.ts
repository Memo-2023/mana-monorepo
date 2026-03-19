import { pgTable, uuid, timestamp, varchar, integer, numeric } from 'drizzle-orm/pg-core';

export const modelPrices = pgTable('model_prices', {
	id: uuid('id').primaryKey().defaultRandom(),
	modelName: varchar('model_name', { length: 100 }).unique().notNull(),
	inputPricePer1kTokens: numeric('input_price_per_1k_tokens', {
		precision: 10,
		scale: 6,
	}).notNull(),
	outputPricePer1kTokens: numeric('output_price_per_1k_tokens', {
		precision: 10,
		scale: 6,
	}).notNull(),
	tokensPerDollar: integer('tokens_per_dollar').notNull().default(50000),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ModelPrice = typeof modelPrices.$inferSelect;
export type NewModelPrice = typeof modelPrices.$inferInsert;
