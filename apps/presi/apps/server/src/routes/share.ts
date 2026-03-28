/**
 * Share routes — public and authenticated share link management.
 *
 * Public:  GET  /share/:code         — view shared deck (no auth)
 * Auth:    POST /share/deck/:deckId  — create share link
 *          GET  /share/deck/:deckId/links — list share links
 *          DELETE /share/:shareId    — delete share link
 */

import { Hono } from 'hono';
import { eq, and, gt, or, isNull, asc } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { authMiddleware } from '@manacore/shared-hono/auth';
import { db, sharedDecks, decks, slides, themes } from '../db';

const shareRoutes = new Hono();

/** Generate a 12-character share code. */
function generateShareCode(): string {
	const bytes = new Uint8Array(6);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

// ─── Public endpoint (no auth) ──────────────────────────

/** Get a shared deck by share code. */
shareRoutes.get('/:code', async (c) => {
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

// ─── Authenticated endpoints ────────────────────────────

shareRoutes.use('/deck/*', authMiddleware());

/** Create a share link for a deck. */
shareRoutes.post('/deck/:deckId', async (c) => {
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
	const body = await c.req.json<{ expiresAt?: string }>().catch(() => ({}));

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

/** List share links for a deck. */
shareRoutes.get('/deck/:deckId/links', async (c) => {
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

/** Delete a share link. */
shareRoutes.delete('/:shareId', authMiddleware(), async (c) => {
	const userId = c.get('userId');
	const shareId = c.req.param('shareId');

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

export { shareRoutes };
