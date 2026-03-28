/**
 * Database schema — only tables needed by server-side share endpoints.
 * Deck/slide CRUD is handled client-side via local-first + mana-sync.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
	pgTable,
	uuid,
	text,
	boolean,
	timestamp,
	integer,
	jsonb,
	index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

const DATABASE_URL =
	process.env.DATABASE_URL ?? 'postgresql://manacore:devpassword@localhost:5432/presi';

const connection = postgres(DATABASE_URL, {
	max: 5,
	idle_timeout: 20,
});

// ─── Schema (read-only for share lookups) ────────────────

export const decks = pgTable('decks', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),
	title: text('title').notNull(),
	description: text('description'),
	themeId: uuid('theme_id'),
	isPublic: boolean('is_public').default(false).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const slides = pgTable(
	'slides',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		deckId: uuid('deck_id').notNull(),
		order: integer('order').default(0).notNull(),
		content: jsonb('content'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index('slides_deck_order_idx').on(table.deckId, table.order)]
);

export const themes = pgTable('themes', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	colors: jsonb('colors'),
	fonts: jsonb('fonts'),
	isDefault: boolean('is_default').default(false),
});

export const sharedDecks = pgTable(
	'shared_decks',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		deckId: uuid('deck_id').notNull(),
		shareCode: text('share_code').notNull().unique(),
		expiresAt: timestamp('expires_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index('shared_decks_deck_id_idx').on(table.deckId)]
);

export const decksRelations = relations(decks, ({ many }) => ({
	slides: many(slides),
	sharedDecks: many(sharedDecks),
}));

export const slidesRelations = relations(slides, ({ one }) => ({
	deck: one(decks, { fields: [slides.deckId], references: [decks.id] }),
}));

export const sharedDecksRelations = relations(sharedDecks, ({ one }) => ({
	deck: one(decks, { fields: [sharedDecks.deckId], references: [decks.id] }),
}));

export const db = drizzle(connection, {
	schema: {
		decks,
		slides,
		themes,
		sharedDecks,
		decksRelations,
		slidesRelations,
		sharedDecksRelations,
	},
});

export type Database = typeof db;
