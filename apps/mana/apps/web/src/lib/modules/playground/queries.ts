/**
 * Playground module — reactive queries for snippets.
 *
 * `name` and `systemPrompt` are encrypted at rest, so the live query
 * decrypts the visible set before mapping to the public DTO. Same
 * pattern as notes / dreams / places.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import type { LocalPlaygroundSnippet, PlaygroundSnippet } from './types';

export function toSnippet(local: LocalPlaygroundSnippet): PlaygroundSnippet {
	return {
		id: local.id,
		name: local.name,
		systemPrompt: local.systemPrompt,
		model: local.model,
		temperature: local.temperature,
		isPinned: local.isPinned ?? false,
		order: local.order ?? 0,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function useAllSnippets() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db
			.table<LocalPlaygroundSnippet>('playgroundSnippets')
			.orderBy('order')
			.toArray();
		const visible = locals.filter((s) => !s.deletedAt);
		const decrypted = await decryptRecords<LocalPlaygroundSnippet>('playgroundSnippets', visible);
		// Pinned first, then by manual order — same convention as notes.
		const sorted = decrypted.sort((a, b) => {
			const ap = a.isPinned ? 1 : 0;
			const bp = b.isPinned ? 1 : 0;
			if (ap !== bp) return bp - ap;
			return (a.order ?? 0) - (b.order ?? 0);
		});
		return sorted.map(toSnippet);
	}, [] as PlaygroundSnippet[]);
}
