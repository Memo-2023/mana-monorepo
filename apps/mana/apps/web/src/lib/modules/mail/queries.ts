/**
 * Mail module queries — drafts (local-first) + API data helpers.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { decryptRecords } from '$lib/data/crypto';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import type { LocalMailDraft, MailDraft } from './types';

// ─── Draft Converter ────────────────────────────────────────

export function toMailDraft(local: LocalMailDraft): MailDraft {
	const now = new Date().toISOString();
	return {
		id: local.id,
		accountId: local.accountId,
		to: local.to ?? '',
		cc: local.cc ?? '',
		subject: local.subject ?? '',
		body: local.body ?? '',
		htmlBody: local.htmlBody ?? '',
		replyToMessageId: local.replyToMessageId ?? null,
		createdAt: local.createdAt ?? now,
		updatedAt: local.updatedAt ?? now,
	};
}

// ─── Live Queries (local drafts) ────────────────────────────

export function useAllDrafts() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalMailDraft, string>('mail', 'mailDrafts').toArray();
		const visible = locals.filter((d) => !d.deletedAt);
		const decrypted = await decryptRecords('mailDrafts', visible);
		return decrypted.map(toMailDraft);
	}, [] as MailDraft[]);
}

// ─── Pure Helpers ───────────────────────────────────────────

export function formatSender(from: { name: string | null; email: string }[]): string {
	if (from.length === 0) return 'Unbekannt';
	const first = from[0];
	return first.name || first.email;
}

export function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const isToday =
		date.getDate() === now.getDate() &&
		date.getMonth() === now.getMonth() &&
		date.getFullYear() === now.getFullYear();

	if (isToday) {
		return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
	}

	const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
	if (diffDays < 7) {
		return date.toLocaleDateString('de-DE', { weekday: 'short' });
	}

	return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}
