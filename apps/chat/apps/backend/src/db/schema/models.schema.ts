import { pgTable, uuid, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

export const models = pgTable('models', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	description: text('description'),
	provider: text('provider').notNull(), // 'azure', 'openai', 'anthropic', etc.
	parameters: jsonb('parameters').$type<{
		deployment?: string;
		temperature?: number;
		max_tokens?: number;
		top_p?: number;
	}>(),
	isActive: boolean('is_active').default(true).notNull(),
	isDefault: boolean('is_default').default(false).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;
