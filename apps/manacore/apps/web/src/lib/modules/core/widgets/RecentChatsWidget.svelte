<script lang="ts">
	/**
	 * RecentChatsWidget — Letzte 3 Unterhaltungen aus Chat.
	 *
	 * Liest direkt aus der unified IndexedDB (conversations + messages tables).
	 */

	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { BaseRecord } from '@manacore/local-store';

	interface Conversation extends BaseRecord {
		title?: string;
		isArchived?: boolean;
		isPinned?: boolean;
	}

	interface Message extends BaseRecord {
		conversationId: string;
		sender: 'user' | 'assistant' | 'system';
	}

	let conversations: (Conversation & { messageCount: number })[] = $state([]);
	let loading = $state(true);

	$effect(() => {
		const sub = liveQuery(async () => {
			const allConvs = await db.table<Conversation>('conversations').toArray();
			const allMsgs = await db.table<Message>('messages').toArray();

			// Count messages per conversation
			const msgCounts = new Map<string, number>();
			for (const msg of allMsgs) {
				if (msg.deletedAt) continue;
				msgCounts.set(msg.conversationId, (msgCounts.get(msg.conversationId) || 0) + 1);
			}

			return allConvs
				.filter((c) => !c.isArchived && !c.deletedAt)
				.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
				.slice(0, 3)
				.map((c) => ({ ...c, messageCount: msgCounts.get(c.id) || 0 }));
		}).subscribe({
			next: (val) => {
				conversations = val;
				loading = false;
			},
			error: () => {
				loading = false;
			},
		});
		return () => sub.unsubscribe();
	});

	function formatTime(dateStr?: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		const now = new Date();
		if (date.toDateString() === now.toDateString()) {
			return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
		}
		return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
	}
</script>

<div>
	<div class="mb-3">
		<h3 class="flex items-center gap-2 text-lg font-semibold">Chats</h3>
	</div>

	{#if loading}
		<div class="space-y-2">
			{#each Array(3) as _}
				<div class="h-10 animate-pulse rounded bg-surface-hover"></div>
			{/each}
		</div>
	{:else if conversations.length === 0}
		<div class="py-6 text-center">
			<div class="mb-2 text-3xl">&#128172;</div>
			<p class="text-sm text-muted-foreground">Noch keine Unterhaltungen.</p>
			<a
				href="/chat"
				class="mt-3 inline-block rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
			>
				Chat starten
			</a>
		</div>
	{:else}
		<div class="space-y-1">
			{#each conversations as conv (conv.id)}
				<a
					href="/chat"
					class="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-hover"
				>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{conv.title || 'Neue Unterhaltung'}</p>
						<p class="text-xs text-muted-foreground">
							{conv.messageCount} Nachrichten
						</p>
					</div>
					<span class="flex-shrink-0 text-xs text-muted-foreground">
						{formatTime(conv.updatedAt)}
					</span>
				</a>
			{/each}
		</div>

		<a href="/chat" class="mt-3 block text-center text-sm text-primary hover:underline">
			Alle Chats anzeigen
		</a>
	{/if}
</div>
