/**
 * Who module — reactive queries + type converters.
 *
 * All reads go through liveQuery so the UI updates automatically when
 * the store mutates the underlying Dexie tables. Encrypted fields
 * (whoGames.revealedName, whoGames.notes, whoMessages.content) get
 * decrypted before the type converter runs.
 */

import { liveQuery } from 'dexie';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import type { LocalWhoGame, LocalWhoMessage, WhoGame, WhoMessage } from './types';

// ─── Type converters ──────────────────────────────────────────

export function toWhoGame(local: LocalWhoGame): WhoGame {
	return {
		id: local.id,
		characterId: local.characterId,
		deckId: local.deckId,
		difficulty: local.difficulty,
		category: local.category,
		status: local.status,
		startedAt: local.startedAt,
		finishedAt: local.finishedAt,
		messageCount: local.messageCount,
		hintsUsed: local.hintsUsed,
		revealedName: local.revealedName,
		notes: local.notes,
	};
}

export function toWhoMessage(local: LocalWhoMessage): WhoMessage {
	return {
		id: local.id,
		gameId: local.gameId,
		sender: local.sender,
		content: local.content,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

// ─── Live queries ─────────────────────────────────────────────

export const allGames$ = liveQuery(async () => {
	const locals = await db.table<LocalWhoGame>('whoGames').orderBy('startedAt').reverse().toArray();
	const visible = locals.filter((g) => !g.deletedAt);
	const decrypted = await decryptRecords('whoGames', visible);
	return decrypted.map(toWhoGame);
});

export function gameByIdLive(gameId: string) {
	return liveQuery(async () => {
		const local = await db.table<LocalWhoGame>('whoGames').get(gameId);
		if (!local || local.deletedAt) return null;
		const [decrypted] = await decryptRecords('whoGames', [local]);
		return decrypted ? toWhoGame(decrypted) : null;
	});
}

export function messagesForGameLive(gameId: string) {
	return liveQuery(async () => {
		// Pull by the simple gameId index, sort in JS by createdAt asc.
		// Same pattern as the chat module — using the [gameId+createdAt]
		// composite would skip rows where createdAt is undefined (Dexie
		// doesn't index undefined components in compound keys), and the
		// creating hook in database.ts doesn't auto-stamp createdAt.
		const locals = await db
			.table<LocalWhoMessage>('whoMessages')
			.where('gameId')
			.equals(gameId)
			.toArray();
		const visible = locals.filter((m) => !m.deletedAt);
		const decrypted = await decryptRecords('whoMessages', visible);
		return decrypted
			.map(toWhoMessage)
			.sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
	});
}

// ─── Pure helpers ─────────────────────────────────────────────

export function gameStatusLabel(status: WhoGame['status']): string {
	switch (status) {
		case 'playing':
			return 'läuft';
		case 'won':
			return 'gewonnen';
		case 'surrendered':
			return 'aufgegeben';
	}
}
