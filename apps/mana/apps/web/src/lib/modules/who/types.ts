/**
 * Who module — types.
 *
 * Game state lives in two Dexie tables: whoGames (one row per
 * session) and whoMessages (chat scrollback). The character pool
 * itself is server-only — we never store the personality strings
 * locally, only the numeric character id and (post-win) the
 * resolved name.
 */

import type { BaseRecord } from '@mana/local-store';

export type WhoDeckId = 'historical' | 'women' | 'antiquity' | 'inventors';

export type WhoGameStatus = 'playing' | 'won' | 'surrendered';

export interface LocalWhoGame extends BaseRecord {
	/** Server-side character id. The actual name only arrives once won. */
	characterId: number;
	/** Which deck this game was started from. */
	deckId: WhoDeckId;
	/** Difficulty hint surfaced by the picker (echoed back from server). */
	difficulty: 'easy' | 'medium' | 'hard';
	/** Category tag from the picker, used in result screen. */
	category: 'inventor' | 'scientist' | 'artist' | 'thinker' | 'ruler';
	status: WhoGameStatus;
	startedAt: string;
	finishedAt: string | null;
	/** Number of user messages — denormalized for ListView sort + result screen. */
	messageCount: number;
	hintsUsed: number;
	/** Encrypted at rest. Null while playing, the historical name once won. */
	revealedName: string | null;
	/** Encrypted at rest. Optional user notes after the game ends. */
	notes: string;
}

export interface LocalWhoMessage extends BaseRecord {
	gameId: string;
	sender: 'user' | 'npc';
	/** Encrypted at rest. */
	content: string;
}

// ─── View types (decoupled from BaseRecord) ───────────────────

export interface WhoGame {
	id: string;
	characterId: number;
	deckId: WhoDeckId;
	difficulty: 'easy' | 'medium' | 'hard';
	category: 'inventor' | 'scientist' | 'artist' | 'thinker' | 'ruler';
	status: WhoGameStatus;
	startedAt: string;
	finishedAt: string | null;
	messageCount: number;
	hintsUsed: number;
	revealedName: string | null;
	notes: string;
}

export interface WhoMessage {
	id: string;
	gameId: string;
	sender: 'user' | 'npc';
	content: string;
	createdAt: string;
}

// ─── Server response shapes ───────────────────────────────────

export interface WhoDeckMeta {
	id: WhoDeckId;
	name: { de: string; en: string };
	description: { de: string; en: string };
	difficulty: 'easy' | 'medium' | 'hard';
	characterCount: number;
	categories: string[];
}

export interface WhoChatResponse {
	reply: string;
	identityRevealed: boolean;
	characterName?: string;
}

export interface WhoRandomResponse {
	characterId: number;
	category: 'inventor' | 'scientist' | 'artist' | 'thinker' | 'ruler';
	difficulty: 'easy' | 'medium' | 'hard';
}

export interface WhoGuessResponse {
	matched: boolean;
	characterName?: string;
}
