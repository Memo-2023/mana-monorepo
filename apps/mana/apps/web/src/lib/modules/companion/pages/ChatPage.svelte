<!--
  Chat page — conversation list + active chat. The conversation sidebar
  lives inline in the pane; picking a conversation swaps the chat area.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { PageShell } from '$lib/components/page-carousel';
	import { Plus, Trash, Robot } from '@mana/shared-icons';
	import CompanionChat from '$lib/modules/companion/components/CompanionChat.svelte';
	import { chatStore } from '$lib/modules/companion/stores/chat.svelte';
	import { useConversations } from '$lib/modules/companion/queries';
	import type { LocalConversation } from '$lib/modules/companion/types';
	import { COMPANION_PAGE_META } from './page-meta';

	interface Props {
		widthPx: number;
		maximized?: boolean;
		onClose: () => void;
		onMaximize: () => void;
		onResize: (widthPx: number, heightPx?: number) => void;
		onMoveLeft?: () => void;
		onMoveRight?: () => void;
	}

	let {
		widthPx,
		maximized = false,
		onClose,
		onMaximize,
		onResize,
		onMoveLeft,
		onMoveRight,
	}: Props = $props();

	const meta = COMPANION_PAGE_META.chat;
	const conversations = useConversations();

	let activeConversation = $state<LocalConversation | null>(null);
	let showList = $state(true);

	onMount(() => {
		if (conversations.value.length > 0) {
			activeConversation = conversations.value[0];
			showList = false;
		}
	});

	$effect(() => {
		if (!activeConversation && conversations.value.length > 0) {
			activeConversation = conversations.value[0];
		}
	});

	async function handleNewConversation() {
		const conv = await chatStore.createConversation();
		activeConversation = conv;
		showList = false;
	}

	async function handleDeleteConversation(id: string) {
		await chatStore.deleteConversation(id);
		if (activeConversation?.id === id) {
			activeConversation = conversations.value.find((c) => c.id !== id) ?? null;
		}
	}
</script>

<PageShell
	{widthPx}
	{maximized}
	{onClose}
	{onMaximize}
	{onResize}
	{onMoveLeft}
	{onMoveRight}
	title={meta.title}
	color={meta.color}
	icon={meta.icon}
>
	<div class="chat">
		<div class="bar">
			<button type="button" class="toggle" onclick={() => (showList = !showList)}>
				{showList ? 'Zum Chat' : `Gespräche (${conversations.value.length})`}
			</button>
			<button type="button" class="new" onclick={handleNewConversation}>
				<Plus size={14} /><span>Neu</span>
			</button>
		</div>

		{#if showList}
			<div class="list">
				{#each conversations.value as c (c.id)}
					<div class="conv" class:active={activeConversation?.id === c.id}>
						<button
							type="button"
							class="conv-main"
							onclick={() => {
								activeConversation = c;
								showList = false;
							}}
						>
							{c.title}
						</button>
						<button
							type="button"
							class="conv-del"
							onclick={() => handleDeleteConversation(c.id)}
							title="Löschen"
						>
							<Trash size={11} />
						</button>
					</div>
				{/each}
				{#if conversations.value.length === 0}
					<p class="empty">Noch keine Gespräche — klick auf „Neu".</p>
				{/if}
			</div>
		{:else if activeConversation}
			{#key activeConversation.id}
				<CompanionChat conversation={activeConversation} />
			{/key}
		{:else}
			<div class="empty-state">
				<Robot size={36} weight="thin" />
				<h3>Mana Companion</h3>
				<button type="button" class="start" onclick={handleNewConversation}>Gespräch starten</button
				>
			</div>
		{/if}
	</div>
</PageShell>

<style>
	.chat {
		display: flex;
		flex-direction: column;
		height: 100%;
	}
	.bar {
		display: flex;
		gap: 0.5rem;
		justify-content: space-between;
		padding: 0.375rem 0.75rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}
	.toggle,
	.new {
		padding: 0.25rem 0.5rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		background: hsl(var(--color-surface));
		cursor: pointer;
		font: inherit;
		font-size: 0.75rem;
	}
	.new {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
	.list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.conv {
		display: flex;
		align-items: center;
		border: 1px solid transparent;
		border-radius: 0.375rem;
	}
	.conv:hover {
		border-color: hsl(var(--color-border));
	}
	.conv.active {
		background: color-mix(in oklab, hsl(var(--color-primary)) 8%, transparent);
	}
	.conv-main {
		flex: 1;
		text-align: left;
		padding: 0.375rem 0.5rem;
		border: none;
		background: none;
		cursor: pointer;
		font: inherit;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}
	.conv-del {
		border: none;
		background: none;
		padding: 0.25rem;
		cursor: pointer;
		color: hsl(var(--color-muted-foreground));
	}
	.empty {
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		padding: 1rem 0;
	}
	.empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.625rem;
		color: hsl(var(--color-muted-foreground));
	}
	.empty-state h3 {
		margin: 0;
	}
	.start {
		padding: 0.5rem 1rem;
		border: 1px solid hsl(var(--color-primary));
		border-radius: 0.375rem;
		background: hsl(var(--color-primary));
		color: white;
		cursor: pointer;
	}
</style>
