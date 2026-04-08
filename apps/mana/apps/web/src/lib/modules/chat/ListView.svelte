<!--
  Chat — Workbench ListView
  Recent conversations list.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { BaseListView } from '@mana/shared-ui';
	import type { LocalConversation, LocalMessage } from './types';

	const conversationsQuery = useLiveQueryWithDefault(async () => {
		const convs = await db.table<LocalConversation>('conversations').toArray();
		return convs.filter((c) => !c.deletedAt && !c.isArchived);
	}, [] as LocalConversation[]);

	const lastMessagesQuery = useLiveQueryWithDefault(async () => {
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
	}, new Map<string, LocalMessage>());

	const conversations = $derived(conversationsQuery.value);
	const lastMessages = $derived(lastMessagesQuery.value);

	const sorted = $derived(
		[...conversations].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
	);

	function truncate(text: string, max = 60): string {
		return text.length > max ? text.slice(0, max) + '...' : text;
	}
</script>

<BaseListView items={sorted} getKey={(c) => c.id} emptyTitle="Keine Unterhaltungen">
	{#snippet header()}
		<span>{conversations.length} Unterhaltungen</span>
	{/snippet}

	{#snippet item(conv)}
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
	{/snippet}
</BaseListView>
