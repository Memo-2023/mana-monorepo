import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { decks } from './decks';

// AI generation status enum
export const aiGenerationStatusEnum = pgEnum('ai_generation_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

// AI generation metadata structure
export interface AIGenerationMetadata {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  duration?: number;
  error?: string;
  cardCount?: number;
  [key: string]: unknown;
}

export const aiGenerations = pgTable(
  'ai_generations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    deckId: uuid('deck_id').references(() => decks.id, { onDelete: 'set null' }),
    functionName: varchar('function_name', { length: 100 }).notNull(),
    prompt: text('prompt').notNull(),
    model: varchar('model', { length: 100 }),
    status: aiGenerationStatusEnum('status').default('pending').notNull(),
    metadata: jsonb('metadata').default({}).$type<AIGenerationMetadata>(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_ai_generations_user_id').on(table.userId),
    index('idx_ai_generations_deck_id').on(table.deckId),
    index('idx_ai_generations_status').on(table.status),
    index('idx_ai_generations_created_at').on(table.createdAt),
  ]
);

export const aiGenerationsRelations = relations(aiGenerations, ({ one }) => ({
  deck: one(decks, {
    fields: [aiGenerations.deckId],
    references: [decks.id],
  }),
}));

export type AIGeneration = typeof aiGenerations.$inferSelect;
export type NewAIGeneration = typeof aiGenerations.$inferInsert;
