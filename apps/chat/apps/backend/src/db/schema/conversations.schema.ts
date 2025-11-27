import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { messages } from './messages.schema';
import { documents } from './documents.schema';
import { spaces } from './spaces.schema';
import { models } from './models.schema';
import { templates } from './templates.schema';

export const conversationModeEnum = pgEnum('conversation_mode', ['free', 'guided', 'template']);

export const conversations = pgTable('conversations', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').notNull(),
	modelId: uuid('model_id').references(() => models.id),
	templateId: uuid('template_id').references(() => templates.id),
	spaceId: uuid('space_id').references(() => spaces.id, { onDelete: 'set null' }),
	title: text('title'),
	conversationMode: conversationModeEnum('conversation_mode').default('free').notNull(),
	documentMode: boolean('document_mode').default(false).notNull(),
	isArchived: boolean('is_archived').default(false).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
	model: one(models, {
		fields: [conversations.modelId],
		references: [models.id],
	}),
	template: one(templates, {
		fields: [conversations.templateId],
		references: [templates.id],
	}),
	space: one(spaces, {
		fields: [conversations.spaceId],
		references: [spaces.id],
	}),
	messages: many(messages),
	documents: many(documents),
}));

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
