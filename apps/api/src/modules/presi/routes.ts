/**
 * Presi module — Share link lookups
 * Ported from apps/presi/apps/server
 *
 * All CRUD (decks, slides, themes) is handled client-side via local-first + sync.
 * This module handles public share links and share management.
 */

import { Hono } from 'hono';
import { eq, and, gt, or, isNull, asc } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '@mana/shared-hono/auth';
import type { AuthVariables } from '@mana/shared-hono';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
	pgSchema,
	uuid,
	text,
	boolean,
	timestamp,
	integer,
	jsonb,
	index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── DB Schema (read-only for share lookups) ────────────────

const DATABASE_URL =
	process.env.DATABASE_URL ?? 'postgresql://mana:devpassword@localhost:5432/mana_platform';

const presiSchema = pgSchema('presi');

const decks = presiSchema.table('decks', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),
	title: text('title').notNull(),
	description: text('description'),
	themeId: uuid('theme_id'),
	isPublic: boolean('is_public').default(false).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

const slides = presiSchema.table(
	'slides',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		deckId: uuid('deck_id').notNull(),
		order: integer('order').default(0).notNull(),
		content: jsonb('content'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index('slides_deck_order_api_idx').on(table.deckId, table.order)]
);

const themes = presiSchema.table('themes', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	colors: jsonb('colors'),
	fonts: jsonb('fonts'),
	isDefault: boolean('is_default').default(false),
});

const sharedDecks = presiSchema.table(
	'shared_decks',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		deckId: uuid('deck_id').notNull(),
		shareCode: text('share_code').notNull().unique(),
		expiresAt: timestamp('expires_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index('shared_decks_deck_id_api_idx').on(table.deckId)]
);

const decksRelations = relations(decks, ({ many }) => ({
	slides: many(slides),
	sharedDecks: many(sharedDecks),
}));

const slidesRelations = relations(slides, ({ one }) => ({
	deck: one(decks, { fields: [slides.deckId], references: [decks.id] }),
}));

const sharedDecksRelations = relations(sharedDecks, ({ one }) => ({
	deck: one(decks, { fields: [sharedDecks.deckId], references: [decks.id] }),
}));

const connection = postgres(DATABASE_URL, { max: 5, idle_timeout: 20 });
const db = drizzle(connection, {
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

// ─── Helpers ────────────────────────────────────────────────

function generateShareCode(): string {
	const bytes = new Uint8Array(6);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

// ─── Routes ─────────────────────────────────────────────────

const routes = new Hono<{ Variables: AuthVariables }>();

// ─── Public endpoint (no auth) ──────────────────────────────

routes.get('/share/:code', async (c) => {
	const code = c.req.param('code');

	const share = await db.query.sharedDecks.findFirst({
		where: and(
			eq(sharedDecks.shareCode, code),
			or(isNull(sharedDecks.expiresAt), gt(sharedDecks.expiresAt, new Date()))
		),
	});

	if (!share) {
		throw new HTTPException(404, { message: 'Shared deck not found or link has expired' });
	}

	// Load deck with slides and theme
	const deck = await db.query.decks.findFirst({
		where: eq(decks.id, share.deckId),
	});

	if (!deck) {
		throw new HTTPException(404, { message: 'Deck not found' });
	}

	const deckSlides = await db.query.slides.findMany({
		where: eq(slides.deckId, deck.id),
		orderBy: [asc(slides.order)],
	});

	let theme = null;
	if (deck.themeId) {
		theme = await db.query.themes.findFirst({
			where: eq(themes.id, deck.themeId),
		});
	}

	return c.json({
		...deck,
		slides: deckSlides,
		theme,
	});
});

// ─── Authenticated endpoints ────────────────────────────────

routes.use('/share/deck/*', authMiddleware());

routes.post('/share/deck/:deckId', async (c) => {
	const userId = c.get('userId');
	const deckId = c.req.param('deckId');

	// Verify ownership
	const deck = await db.query.decks.findFirst({
		where: and(eq(decks.id, deckId), eq(decks.userId, userId)),
	});
	if (!deck) {
		throw new HTTPException(403, { message: 'You do not own this deck' });
	}

	// Check for existing valid share
	const existing = await db.query.sharedDecks.findFirst({
		where: and(
			eq(sharedDecks.deckId, deckId),
			or(isNull(sharedDecks.expiresAt), gt(sharedDecks.expiresAt, new Date()))
		),
	});

	if (existing) {
		return c.json(existing);
	}

	// Parse optional expiry
	const body = (await c.req.json<{ expiresAt?: string }>().catch(() => ({}))) as {
		expiresAt?: string;
	};

	const [share] = await db
		.insert(sharedDecks)
		.values({
			deckId,
			shareCode: generateShareCode(),
			expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
		})
		.returning();

	return c.json(share, 201);
});

routes.get('/share/deck/:deckId/links', async (c) => {
	const userId = c.get('userId');
	const deckId = c.req.param('deckId');

	// Verify ownership
	const deck = await db.query.decks.findFirst({
		where: and(eq(decks.id, deckId), eq(decks.userId, userId)),
	});
	if (!deck) {
		throw new HTTPException(403, { message: 'You do not own this deck' });
	}

	const links = await db.query.sharedDecks.findMany({
		where: eq(sharedDecks.deckId, deckId),
	});

	return c.json(links);
});

routes.delete('/share/:shareId', authMiddleware(), async (c) => {
	const userId = c.get('userId');
	const shareId = c.req.param('shareId');
	if (!shareId) throw new HTTPException(400, { message: 'shareId required' });

	const share = await db.query.sharedDecks.findFirst({
		where: eq(sharedDecks.id, shareId),
	});

	if (!share) {
		throw new HTTPException(404, { message: 'Share not found' });
	}

	// Verify ownership of the deck
	const deck = await db.query.decks.findFirst({
		where: eq(decks.id, share.deckId),
	});
	if (!deck || deck.userId !== userId) {
		throw new HTTPException(403, { message: 'You do not own this deck' });
	}

	await db.delete(sharedDecks).where(eq(sharedDecks.id, shareId));
	return c.json({ success: true });
});

export { routes as presiRoutes };
