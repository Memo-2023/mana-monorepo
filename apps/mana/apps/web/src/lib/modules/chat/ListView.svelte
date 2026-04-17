<!--
  Chat — Workbench ListView
  Recent conversations with click-to-open detail overlay + new chat button.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { decryptRecords } from '$lib/data/crypto';
	import { BaseListView } from '@mana/shared-ui';
	import { Plus, PushPin, Trash } from '@mana/shared-icons';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { useItemContextMenu } from '$lib/data/item-context-menu.svelte';
	import { conversationsStore } from './stores/conversations.svelte';
	import type { LocalConversation, LocalMessage, Conversation } from './types';
	import { toConversation } from './queries';
	import type { ViewProps } from '$lib/app-registry';

	let { navigate }: ViewProps = $props();

	const conversationsQuery = useLiveQueryWithDefault(async () => {
		const convs = await db.table<LocalConversation>('conversations').toArray();
		const visible = convs.filter((c) => !c.deletedAt && !c.isArchived);
		const decrypted = await decryptRecords('conversations', visible);
		return decrypted.map(toConversation);
	}, [] as Conversation[]);

	const lastMessagesQuery = useLiveQueryWithDefault(async () => {
		const msgs = await db.table<LocalMessage>('messages').toArray();
		const decrypted = await decryptRecords('messages', msgs);
		const map = new Map<string, LocalMessage>();
		for (const msg of decrypted) {
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

	function openConversation(id: string) {
		navigate('detail', {
			conversationId: id,
			_siblingIds: sorted.map((c) => c.id),
			_siblingKey: 'conversationId',
		});
	}

	async function handleNewChat() {
		const conv = await conversationsStore.create({});
		openConversation(conv.id);
	}

	const ctxMenu = useItemContextMenu<Conversation>();

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.state.target
			? [
					{
						id: 'pin',
						label: ctxMenu.state.target.isPinned ? 'Loslösen' : 'Anpinnen',
						icon: PushPin,
						action: () => {
							const t = ctxMenu.state.target;
							if (t) t.isPinned ? conversationsStore.unpin(t.id) : conversationsStore.pin(t.id);
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: 'Löschen',
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							const t = ctxMenu.state.target;
							if (t) conversationsStore.delete(t.id);
						},
					},
				]
			: []
	);
</script>

<div class="chat-list-view">
	<button class="new-chat-btn" onclick={handleNewChat}>
		<Plus size={14} />
		<span>Neuer Chat</span>
	</button>

	<BaseListView items={sorted} getKey={(c) => c.id} emptyTitle="Keine Unterhaltungen">
		{#snippet header()}
			<span>{conversations.length} Unterhaltungen</span>
		{/snippet}

		{#snippet item(conv)}
			{@const lastMsg = lastMessages.get(conv.id)}
			<button
				class="conv-item"
				onclick={() => openConversation(conv.id)}
				oncontextmenu={(e) => ctxMenu.open(e, conv)}
			>
				<div class="conv-top">
					<span class="conv-title">
						{conv.title || 'Neue Unterhaltung'}
					</span>
					{#if conv.isPinned}
						<span class="pin-badge">&#128204;</span>
					{/if}
				</div>
				{#if lastMsg}
					<p class="conv-preview">
						{lastMsg.sender === 'user' ? 'Du: ' : ''}{truncate(lastMsg.messageText)}
					</p>
				{/if}
			</button>
		{/snippet}
	</BaseListView>

	<ContextMenu
		visible={ctxMenu.state.visible}
		x={ctxMenu.state.x}
		y={ctxMenu.state.y}
		items={ctxMenuItems}
		onClose={ctxMenu.close}
	/>
</div>

<style>
	.chat-list-view {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		height: 100%;
	}

	.new-chat-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		margin: 0.5rem 0.5rem 0;
		padding: 0.5rem;
		border-radius: 0.5rem;
		border: 1px dashed hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}
	.new-chat-btn:hover {
		border-color: hsl(var(--color-primary));
		color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.05);
	}

	.conv-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		background: transparent;
		text-align: left;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: background 0.15s;
		min-height: 44px;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}
	.conv-item:hover {
		background: hsl(var(--color-surface-hover));
	}

	.conv-top {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.conv-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}

	.pin-badge {
		font-size: 0.625rem;
		flex-shrink: 0;
	}

	.conv-preview {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		margin: 0;
	}

	@media (max-width: 640px) {
		.conv-item {
			padding: 0.625rem;
		}
	}
</style>
