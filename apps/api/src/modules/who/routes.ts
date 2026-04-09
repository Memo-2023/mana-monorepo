/**
 * Who module — LLM-driven historical figure guessing game
 *
 * Replaces the standalone games/whopixels Phaser app + node http
 * server. The Phaser RPG world wrapper is dropped; what's preserved
 * is the chat loop, the 26+ historical-figure personalities, and
 * the [IDENTITY_REVEALED] sentinel trick for win-detection.
 *
 * The character personalities live in data/characters.ts and never
 * leave the server — clients only see numeric ids. This rules out
 * the obvious cheat (open DevTools, grep the bundle for "Marie Curie").
 *
 * Architecture deep-dive: docs/WHO_MODULE.md
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { consumeCredits, validateCredits, logger } from '@mana/shared-hono';
import type { AuthVariables } from '@mana/shared-hono';
import {
	CHARACTERS,
	DECKS,
	charactersInDeck,
	findCharacter,
	pickRandomCharacter,
} from './data/characters';
import type { WhoCharacter } from './data/characters';

const LLM_URL = process.env.MANA_LLM_URL || 'http://localhost:3025';

/** Sentinel string the LLM emits when the player has correctly guessed
 *  the character. We strip it from the visible reply before returning. */
const IDENTITY_SENTINEL = '[IDENTITY_REVEALED]';

const routes = new Hono<{ Variables: AuthVariables }>();

// ─── GET /decks ─────────────────────────────────────────────
//
// Public deck catalogue. Returns deck metadata + counts of how many
// characters belong to each. Intentionally LEAKS NO character names
// or personalities — those stay server-side.
//
// The route is mounted under /api/v1/who which is auth-gated, but
// the response itself contains nothing sensitive even if the auth
// were dropped.

routes.get('/decks', (c) => {
	const enriched = DECKS.map((deck) => {
		const characters = charactersInDeck(deck.id);
		const categories = Array.from(new Set(characters.map((char) => char.category))).sort();
		return {
			id: deck.id,
			name: deck.name,
			description: deck.description,
			difficulty: deck.difficulty,
			characterCount: characters.length,
			categories,
		};
	});
	return c.json({ decks: enriched });
});

// ─── POST /chat ─────────────────────────────────────────────
//
// The hot path. Each user message in the game becomes one of these
// requests. Body shape:
//
//   {
//     gameId: string         // for credit attribution + audit
//     characterId: number    // server resolves to personality
//     message: string        // the user's latest message
//     history: [             // previous messages in this game
//       { sender: 'user'|'npc', content: string }
//     ]
//   }
//
// Response shape:
//
//   {
//     reply: string                  // sanitized LLM reply
//     identityRevealed: boolean      // sentinel detected?
//     characterName?: string         // ONLY present when revealed
//   }

const ChatBodySchema = z.object({
	gameId: z.string().min(1).max(64),
	characterId: z.number().int().min(1).max(99999),
	message: z.string().min(1).max(2000),
	history: z
		.array(
			z.object({
				sender: z.enum(['user', 'npc']),
				content: z.string().min(1).max(4000),
			})
		)
		.max(40)
		.optional()
		.default([]),
	model: z.string().min(1).max(100).optional(),
});

routes.post('/chat', async (c) => {
	const userId = c.get('userId');

	const parsed = ChatBodySchema.safeParse(await c.req.json().catch(() => null));
	if (!parsed.success) {
		return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
	}

	const { gameId, characterId, message, history, model } = parsed.data;

	const character = findCharacter(characterId);
	if (!character) {
		return c.json({ error: 'Unknown character' }, 404);
	}

	// Credit cost: same shape as chat module — local models cheap,
	// cloud models expensive. The model is picked by the user via the
	// optional model field; default is whatever mana-llm decides.
	const isLocal = !model || model.startsWith('ollama/') || model.startsWith('local/');
	const cost = isLocal ? 0.1 : 5;

	const validation = await validateCredits(userId, 'AI_WHO', cost);
	if (!validation.hasCredits) {
		return c.json({ error: 'Insufficient credits', required: cost }, 402);
	}

	// Build the system prompt. Same shape as the original whopixels
	// server.js prompt — carefully tested to make the LLM roleplay
	// without giving away the name immediately, but to recognize
	// when it's been correctly guessed.
	const systemPrompt = buildSystemPrompt(character);

	// Conversation history: cap to last 20 entries to stay under
	// context limits and keep latency predictable.
	const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
		{ role: 'system', content: systemPrompt },
		...history.slice(-20).map((entry) => ({
			role: (entry.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
			content: entry.content,
		})),
		{ role: 'user', content: message },
	];

	// Call mana-llm. The chat module uses the same endpoint with
	// the same payload shape — we mirror it exactly so any future
	// LLM-gateway improvement applies here too.
	let llmRes: Response;
	try {
		// mana-llm exposes /v1/chat/completions (OpenAI-compatible path,
		// no /api/ prefix). The chat module had the same bug before commit
		// 63a91e36a fixed research's path; this is the same correction.
		llmRes = await fetch(`${LLM_URL}/v1/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				messages,
				model: model || 'gemma3:4b',
				temperature: 0.85,
				max_tokens: 250,
			}),
		});
	} catch (err) {
		logger.error('who.llm_fetch_failed', {
			gameId,
			characterId,
			error: err instanceof Error ? err.message : String(err),
		});
		return c.json({ error: 'LLM request failed' }, 502);
	}

	if (!llmRes.ok) {
		logger.error('who.llm_non_200', { gameId, characterId, status: llmRes.status });
		return c.json({ error: 'LLM request failed' }, 502);
	}

	let raw: string;
	try {
		const data = (await llmRes.json()) as {
			choices?: Array<{ message?: { content?: string } }>;
		};
		raw = data.choices?.[0]?.message?.content ?? '';
	} catch (err) {
		logger.error('who.llm_parse_failed', {
			gameId,
			characterId,
			error: err instanceof Error ? err.message : String(err),
		});
		return c.json({ error: 'LLM reply unparseable' }, 502);
	}

	if (!raw.trim()) {
		return c.json({ error: 'LLM returned empty reply' }, 502);
	}

	// Detect the sentinel. The LLM appends [IDENTITY_REVEALED] when
	// it recognizes the player has guessed the name. We strip the
	// sentinel from the visible reply.
	const identityRevealed = raw.includes(IDENTITY_SENTINEL);
	const reply = raw.replace(IDENTITY_SENTINEL, '').trim();

	// Charge credits AFTER we know the call worked. The chat module
	// awaits this; we do too, so a bookkeeping failure surfaces as
	// a 5xx rather than a silently lost charge.
	await consumeCredits(userId, 'AI_WHO', cost, `Who: char=${characterId}`);

	// On reveal: include the actual character name in the response.
	// The frontend writes this to LocalWhoGame.revealedName and
	// transitions to the won state. Until reveal, the name is never
	// in any response payload.
	const response: {
		reply: string;
		identityRevealed: boolean;
		characterName?: string;
	} = { reply, identityRevealed };

	if (identityRevealed) {
		response.characterName = character.name;
	}

	return c.json(response);
});

// ─── POST /random ───────────────────────────────────────────
//
// Convenience: pick a random character from a deck and return the
// id. Frontend uses this on "new game from deck" to avoid any
// client-side randomness (which would let a determined attacker
// predict picks). The personality is still NOT returned — only the
// id, category, and difficulty hint for the picker UI.

const RandomBodySchema = z.object({
	deckId: z.enum(['historical', 'women', 'antiquity', 'inventors']),
});

routes.post('/random', async (c) => {
	const parsed = RandomBodySchema.safeParse(await c.req.json().catch(() => null));
	if (!parsed.success) {
		return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
	}

	const character = pickRandomCharacter(parsed.data.deckId);
	if (!character) {
		return c.json({ error: 'Empty deck' }, 404);
	}

	return c.json({
		characterId: character.id,
		category: character.category,
		difficulty: character.difficulty,
	});
});

// ─── POST /guess ────────────────────────────────────────────
//
// Explicit guess submit. Fallback path for when the player typed
// the right name but the LLM forgot to emit [IDENTITY_REVEALED] in
// its reply. The server does a deterministic lowercase substring
// match against the canonical name and returns whether it matches.
//
// On match, the frontend transitions to the won state same as when
// the sentinel fires.

const GuessBodySchema = z.object({
	gameId: z.string().min(1).max(64),
	characterId: z.number().int().min(1).max(99999),
	guess: z.string().min(1).max(200),
});

routes.post('/guess', async (c) => {
	const parsed = GuessBodySchema.safeParse(await c.req.json().catch(() => null));
	if (!parsed.success) {
		return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
	}

	const { characterId, guess } = parsed.data;
	const character = findCharacter(characterId);
	if (!character) {
		return c.json({ error: 'Unknown character' }, 404);
	}

	const matched = matchesName(character, guess);

	const response: {
		matched: boolean;
		characterName?: string;
	} = { matched };

	if (matched) {
		response.characterName = character.name;
	}

	return c.json(response);
});

// ─── Helpers ────────────────────────────────────────────────

function buildSystemPrompt(character: WhoCharacter): string {
	return `WICHTIG: Du bist AUSSCHLIESSLICH ${character.name}. ${character.personality}

Dein Gegenüber spielt ein Ratespiel und versucht herauszufinden, wer du bist.
Antworte authentisch in deinem Charakter und in der Sprache, die der Nutzer
verwendet. Gib subtile Hinweise auf deine Identität — sage aber NICHT direkt
"Ich bin ${character.name}". Halte deine Antworten auf 2–4 Sätze begrenzt,
es sei denn, eine längere Erklärung ist nötig.

Wenn der Nutzer deinen Namen korrekt errät, füge am Ende deiner Antwort
den Code "${IDENTITY_SENTINEL}" ein. Dieser Code erscheint NUR, wenn der
Nutzer deinen vollständigen oder eindeutigen Namen genannt hat. Bei
Spitznamen oder unklaren Bezügen erscheint der Code nicht.`;
}

function matchesName(character: WhoCharacter, guess: string): boolean {
	const normalizedGuess = normalize(guess);
	const normalizedName = normalize(character.name);
	if (normalizedGuess === normalizedName) return true;
	// Allow last-name-only guesses for unambiguous historical figures.
	// "Curie" matches "Marie Curie", "Tesla" matches "Nikola Tesla".
	const parts = normalizedName.split(/\s+/).filter((p) => p.length >= 4);
	if (parts.length > 1 && parts.some((p) => p === normalizedGuess)) return true;
	// Allow guess-contains-name as a fuzzy fallback. Catches "I think
	// it's Marie Curie" → contains "marie curie".
	if (normalizedGuess.includes(normalizedName)) return true;
	return false;
}

function normalize(s: string): string {
	return (
		s
			.toLowerCase()
			.normalize('NFD')
			// Strip combining diacritics so "konfuzius" matches "konfúzius",
			// "platon" matches "Platón", etc.
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[.,!?'"„"]/g, '')
			.replace(/\s+/g, ' ')
			.trim()
	);
}

export { routes as whoRoutes };
export { CHARACTERS, DECKS };
