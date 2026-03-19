import { pgTable, uuid, text, timestamp, integer, numeric, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { conversations } from './conversations.schema';
import { messages } from './messages.schema';
import { models } from './models.schema';

export const usageLogs = pgTable(
	'usage_logs',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		conversationId: uuid('conversation_id')
			.references(() => conversations.id, { onDelete: 'cascade' })
			.notNull(),
		messageId: uuid('message_id')
			.references(() => messages.id, { onDelete: 'cascade' })
			.notNull(),
		userId: text('user_id').notNull(), // TEXT to support Better Auth nanoid format
		modelId: uuid('model_id').references(() => models.id),
		promptTokens: integer('prompt_tokens').default(0).notNull(),
		completionTokens: integer('completion_tokens').default(0).notNull(),
		totalTokens: integer('total_tokens').default(0).notNull(),
		estimatedCost: numeric('estimated_cost', { precision: 10, scale: 6 }).default('0'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('usage_logs_user_id_idx').on(table.userId),
		index('usage_logs_conversation_id_idx').on(table.conversationId),
		index('usage_logs_message_id_idx').on(table.messageId),
	]
);

export const usageLogsRelations = relations(usageLogs, ({ one }) => ({
	conversation: one(conversations, {
		fields: [usageLogs.conversationId],
		references: [conversations.id],
	}),
	message: one(messages, {
		fields: [usageLogs.messageId],
		references: [messages.id],
	}),
	model: one(models, {
		fields: [usageLogs.modelId],
		references: [models.id],
	}),
}));

export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;
