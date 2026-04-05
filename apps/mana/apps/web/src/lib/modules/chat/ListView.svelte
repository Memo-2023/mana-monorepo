<!--
  Chat — Workbench ListView
  Recent conversations list.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalConversation, LocalMessage } from './types';

	let conversations = $state<LocalConversation[]>([]);
	let lastMessages = $state<Map<string, LocalMessage>>(new Map());

	$effect(() => {
		const sub = liveQuery(async () => {
			const convs = await db.table<LocalConversation>('conversations').toArray();
			return convs.filter((c) => !c.deletedAt && !c.isArchived);
		}).subscribe((val) => {
			conversations = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			const msgs = await db.table<LocalMessage>('messages').toArray();
			const map = new Map<string, LocalMessage>();
			for (const msg of msgs) {
				if (msg.deletedAt) continue;
				const existing = map.get(msg.conversationId);
				if (!existing || (msg.createdAt ?? '') > (existing.createdAt ?? '')) {
					map.set(msg.conversationId, msg);
				}
			}
			return map;
		}).subscribe((val) => {
			lastMessages = val ?? new Map();
		});
		return () => sub.unsubscribe();
	});

	const sorted = $derived(
		[...conversations].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
	);

	function truncate(text: string, max = 60): string {
		return text.length > max ? text.slice(0, max) + '...' : text;
	}
</script>

<div class="flex h-full flex-col gap-3 p-3 sm:p-4">
	<p class="text-xs text-white/40">{conversations.length} Unterhaltungen</p>

	<div class="flex-1 overflow-auto">
		{#each sorted as conv (conv.id)}
			{@const lastMsg = lastMessages.get(conv.id)}
			<div class="mb-1 min-h-[44px] rounded-md px-3 py-3 transition-colors hover:bg-white/5">
				<div class="flex items-center justify-between">
					<p class="truncate text-sm font-medium text-white/80">
						{conv.title || 'Neue Unterhaltung'}
					</p>
					{#if conv.isPinned}
						<span class="text-[10px] text-white/30">&#128204;</span>
					{/if}
				</div>
				{#if lastMsg}
					<p class="mt-0.5 truncate text-xs text-white/40">
						{lastMsg.sender === 'user' ? 'Du: ' : ''}{truncate(lastMsg.messageText)}
					</p>
				{/if}
			</div>
		{/each}

		{#if sorted.length === 0}
			<p class="py-8 text-center text-sm text-white/30">Keine Unterhaltungen</p>
		{/if}
	</div>
</div>
