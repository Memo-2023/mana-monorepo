/**
 * Who module — game store (mutations).
 *
 * Reads come from the live queries in queries.ts. This file owns the
 * write side: starting a game, sending a chat message, submitting an
 * explicit guess, and surrendering.
 *
 * The chat-message flow is the interesting one: the user message is
 * inserted optimistically into Dexie, the server is called, and on
 * success the NPC reply is inserted as a second message. If the
 * server returns identityRevealed=true (or the explicit guess
 * endpoint matches), the game transitions to 'won' and the resolved
 * character name is stored on the game row.
 */

import { db } from '$lib/data/database';
import { authStore } from '$lib/stores/auth.svelte';
import { guestPrompt } from '$lib/stores/guest-prompt.svelte';
import { encryptRecord } from '$lib/data/crypto';
import { whoGameTable, whoMessageTable } from '../collections';
import type {
	LocalWhoGame,
	LocalWhoMessage,
	WhoChatResponse,
	WhoDeckId,
	WhoGuessResponse,
	WhoRandomResponse,
} from '../types';

// Same-origin path. Routed by SvelteKit at
// apps/mana/apps/web/src/routes/api/v1/who/[...path]/+server.ts and
// proxied internally to mana-api:3060 over the docker network. This
// avoids the cloudflared dependency for new mana-api routes.
const API_BASE = '/api/v1/who';

/**
 * Authenticated fetch helper. Mirrors the shape used elsewhere in
 * this app — Bearer token from authStore, JSON body, structured
 * error throwing. Kept inline (no wrapping client) because the who
 * module has only three endpoints; a full client would be overkill.
 *
 * 401 handling: when the access token is missing OR the upstream
 * returns 401, we surface the standard `guestPrompt.requireAccount`
 * UI instead of throwing a raw "not authenticated" error. The
 * common case is JWT expiry mid-game — the session cookie is still
 * present (so the navbar still shows the user as logged in) but
 * the access token has aged out and the silent refresh failed.
 * Same pattern as base-client.ts uses for every other API call.
 */
async function postJson<T>(path: string, body: unknown): Promise<T> {
	const token = await authStore.getAccessToken();
	if (!token) {
		guestPrompt.requireAccount(
			'who',
			'Sitzung abgelaufen — bitte neu anmelden, um weiterzuspielen.',
			'Neu anmelden'
		);
		throw new Error('Sitzung abgelaufen — bitte neu anmelden');
	}
	const res = await fetch(`${API_BASE}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(body),
	});
	if (res.status === 401) {
		guestPrompt.requireAccount(
			'who',
			'Sitzung abgelaufen — bitte neu anmelden, um weiterzuspielen.',
			'Neu anmelden'
		);
		throw new Error('Sitzung abgelaufen — bitte neu anmelden');
	}
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`who ${path} failed: ${res.status} ${text}`);
	}
	return (await res.json()) as T;
}

export const whoGamesStore = {
	/**
	 * Start a new game in the given deck. Server picks a random
	 * character from the deck so the client never knows the personality
	 * pool ahead of time. Returns the new gameId so the route can
	 * navigate into the play view.
	 */
	async start(deckId: WhoDeckId): Promise<string> {
		const random = await postJson<WhoRandomResponse>('/random', { deckId });

		const gameId = crypto.randomUUID();
		const now = new Date().toISOString();

		const newLocal: LocalWhoGame = {
			id: gameId,
			characterId: random.characterId,
			deckId,
			difficulty: random.difficulty,
			category: random.category,
			status: 'playing',
			startedAt: now,
			finishedAt: null,
			messageCount: 0,
			hintsUsed: 0,
			revealedName: null,
			notes: '',
		};

		await encryptRecord('whoGames', newLocal);
		await whoGameTable.add(newLocal);

		return gameId;
	},

	/**
	 * Send a user message in an active game. Inserts the user message
	 * locally, calls the server for the NPC reply, inserts the NPC
	 * message, and updates the game's messageCount. If the server
	 * detects the player has guessed the name, transitions to 'won'.
	 *
	 * If the server call fails, the user message stays inserted (so
	 * the user sees their input was registered) and an error is
	 * thrown so the caller can show a retry hint.
	 */
	async sendMessage(gameId: string, text: string): Promise<void> {
		const game = await whoGameTable.get(gameId);
		if (!game) throw new Error('game not found');
		if (game.status !== 'playing') throw new Error('game already ended');

		const trimmed = text.trim();
		if (!trimmed) return;

		// 1. Optimistic insert of the user message. createdAt is set
		//    explicitly because the database creating-hook does NOT
		//    auto-stamp it; without it, time-based sorts and any
		//    composite index that includes createdAt skip the row.
		const userMsg: LocalWhoMessage = {
			id: crypto.randomUUID(),
			gameId,
			sender: 'user',
			content: trimmed,
			createdAt: new Date().toISOString(),
		};
		await encryptRecord('whoMessages', userMsg);
		await whoMessageTable.add(userMsg);

		// 2. Pull recent message history to send to the server. Use the
		//    simple gameId index instead of [gameId+createdAt] composite
		//    — same reason as the queries.ts: rows with undefined
		//    createdAt aren't visible through the composite.
		const allMessages = await whoMessageTable.where('gameId').equals(gameId).toArray();
		const { decryptRecords } = await import('$lib/data/crypto');
		const decrypted = await decryptRecords('whoMessages', allMessages);
		// Drop the just-inserted user message from the history payload —
		// the server takes the current `message` separately.
		const history = decrypted
			.filter((m) => m.id !== userMsg.id && !m.deletedAt)
			.map((m) => ({ sender: m.sender, content: m.content }));

		// 3. Server round-trip.
		const response = await postJson<WhoChatResponse>('/chat', {
			gameId,
			characterId: game.characterId,
			message: trimmed,
			history,
		});

		// 4. Insert the NPC reply. createdAt explicit + bumped by 1ms
		//    so the npc message sorts strictly after the user message
		//    even when both inserts happen in the same millisecond.
		const npcMsg: LocalWhoMessage = {
			id: crypto.randomUUID(),
			gameId,
			sender: 'npc',
			content: response.reply,
			createdAt: new Date(Date.now() + 1).toISOString(),
		};
		await encryptRecord('whoMessages', npcMsg);
		await whoMessageTable.add(npcMsg);

		// 5. Update the game row: messageCount, and on win flip status
		//    + reveal name + stamp finishedAt.
		const updates: Partial<LocalWhoGame> = {
			messageCount: (game.messageCount ?? 0) + 1,
		};
		if (response.identityRevealed && response.characterName) {
			updates.status = 'won';
			updates.revealedName = response.characterName;
			updates.finishedAt = new Date().toISOString();
			await encryptRecord('whoGames', updates);
		}
		await whoGameTable.update(gameId, updates);
	},

	/**
	 * Explicit "I guess this is X" submission. Used as a fallback when
	 * the LLM forgot to emit the [IDENTITY_REVEALED] sentinel even
	 * though the user clearly said the right name. Server does a
	 * deterministic lowercase match against the canonical name.
	 *
	 * Returns true if the guess matched (and the game transitioned to
	 * 'won'), false otherwise. The store does NOT charge credits for
	 * this — it's a metadata check, not an LLM call.
	 */
	async submitGuess(gameId: string, guess: string): Promise<boolean> {
		const game = await whoGameTable.get(gameId);
		if (!game) throw new Error('game not found');
		if (game.status !== 'playing') return false;

		const result = await postJson<WhoGuessResponse>('/guess', {
			gameId,
			characterId: game.characterId,
			guess,
		});

		if (!result.matched || !result.characterName) return false;

		const updates: Partial<LocalWhoGame> = {
			status: 'won',
			revealedName: result.characterName,
			finishedAt: new Date().toISOString(),
		};
		await encryptRecord('whoGames', updates);
		await whoGameTable.update(gameId, updates);
		return true;
	},

	/**
	 * Give up on a game. Locks the row in 'surrendered' state and
	 * stamps finishedAt so it shows up in the result screen and the
	 * past-games list.
	 */
	async surrender(gameId: string): Promise<void> {
		const game = await whoGameTable.get(gameId);
		if (!game) throw new Error('game not found');
		if (game.status !== 'playing') return;

		await whoGameTable.update(gameId, {
			status: 'surrendered',
			finishedAt: new Date().toISOString(),
		});
	},

	/**
	 * Update post-game notes. Used by the result view's "Notiz
	 * hinzufügen" textarea. Encrypted at rest.
	 */
	async setNotes(gameId: string, notes: string): Promise<void> {
		const updates: Partial<LocalWhoGame> = { notes };
		await encryptRecord('whoGames', updates);
		await whoGameTable.update(gameId, updates);
	},

	/**
	 * Soft-delete a game (and its messages cascade by gameId in the
	 * UI filter, no actual cascade in Dexie). Used by the past-games
	 * list's swipe-to-delete.
	 */
	async deleteGame(gameId: string): Promise<void> {
		const now = new Date().toISOString();
		await db.transaction('rw', whoGameTable, whoMessageTable, async () => {
			await whoGameTable.update(gameId, { deletedAt: now });
			const messages = await whoMessageTable.where('gameId').equals(gameId).toArray();
			for (const m of messages) {
				await whoMessageTable.update(m.id, { deletedAt: now });
			}
		});
	},
};
