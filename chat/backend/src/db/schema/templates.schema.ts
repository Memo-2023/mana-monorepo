import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { models } from './models.schema';

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  systemPrompt: text('system_prompt').notNull(),
  initialQuestion: text('initial_question'),
  modelId: uuid('model_id').references(() => models.id),
  color: text('color').default('#3b82f6').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  documentMode: boolean('document_mode').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const templatesRelations = relations(templates, ({ one }) => ({
  model: one(models, {
    fields: [templates.modelId],
    references: [models.id],
  }),
}));

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
