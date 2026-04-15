<script lang="ts">
	import { onMount } from 'svelte';
	import { Robot, Plus, Trash } from '@mana/shared-icons';
	import CompanionChat from '$lib/modules/companion/components/CompanionChat.svelte';
	import { chatStore } from '$lib/modules/companion/stores/chat.svelte';
	import { useConversations } from '$lib/modules/companion/queries';
	import type { LocalConversation } from '$lib/modules/companion/types';

	const conversations = useConversations();

	let activeConversation = $state<LocalConversation | null>(null);

	onMount(async () => {
		// Auto-create or resume last conversation
		if (conversations.value.length > 0) {
			activeConversation = conversations.value[0];
		}
	});

	// When conversations load, select the first one
	$effect(() => {
		if (!activeConversation && conversations.value.length > 0) {
			activeConversation = conversations.value[0];
		}
	});

	async function handleNewConversation() {
		const conv = await chatStore.createConversation();
		activeConversation = conv;
	}

	async function handleDeleteConversation(id: string) {
		await chatStore.deleteConversation(id);
		if (activeConversation?.id === id) {
			activeConversation = conversations.value.find((c) => c.id !== id) ?? null;
		}
	}
</script>

<svelte:head>
	<title>Companion - Mana</title>
</svelte:head>

<div class="companion-page">
	<!-- Sidebar -->
	<div class="sidebar">
		<div class="sidebar-header">
			<div class="sidebar-title">
				<Robot size={20} weight="bold" />
				<span>Companion</span>
			</div>
			<button class="new-btn" onclick={handleNewConversation} title="Neues Gespraech">
				<Plus size={16} weight="bold" />
			</button>
		</div>

		<div class="conversation-list">
			{#each conversations.value as conv (conv.id)}
				<button
					class="conversation-item"
					class:active={activeConversation?.id === conv.id}
					onclick={() => (activeConversation = conv)}
				>
					<span class="conv-title">{conv.title}</span>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<span
						class="conv-delete"
						role="button"
						tabindex="-1"
						onclick={(e) => {
							e.stopPropagation();
							handleDeleteConversation(conv.id);
						}}
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.stopPropagation();
								handleDeleteConversation(conv.id);
							}
						}}
						title="Loeschen"
					>
						<Trash size={12} />
					</span>
				</button>
			{/each}

			{#if conversations.value.length === 0}
				<p class="empty-hint">Noch keine Gespraeche. Starte mit dem + Button.</p>
			{/if}
		</div>

		<nav class="sidebar-footer">
			<a href="/companion/missions">AI Missions →</a>
			<a href="/companion/workbench">Workbench →</a>
			<a href="/companion/rituals">Rituale →</a>
		</nav>
	</div>

	<!-- Chat Area -->
	<div class="chat-area">
		{#if activeConversation}
			{#key activeConversation.id}
				<CompanionChat conversation={activeConversation} />
			{/key}
		{:else}
			<div class="empty-state">
				<Robot size={48} weight="thin" />
				<h2>Mana Companion</h2>
				<p>
					Dein persoenlicher Assistent. Frag nach deinem Tag, lass Tasks erstellen oder Getraenke
					loggen.
				</p>
				<button class="start-btn" onclick={handleNewConversation}> Gespraech starten </button>
			</div>
		{/if}
	</div>
</div>

<style>
	.companion-page {
		display: flex;
		min-height: 400px;
		height: calc(100dvh - var(--bottom-chrome-height, 80px) - 6rem);
		border: 1px solid hsl(var(--color-border));
		border-radius: 1rem;
		overflow: hidden;
		background: hsl(var(--color-background));
	}

	.sidebar {
		width: 240px;
		flex-shrink: 0;
		background: hsl(var(--color-card));
		display: flex;
		flex-direction: column;
	}

	@media (max-width: 639px) {
		.sidebar {
			display: none;
		}
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.sidebar-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		font-size: 0.9375rem;
		color: hsl(var(--color-foreground));
	}

	.new-btn {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		border: none;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s;
	}

	.new-btn:hover {
		background: hsl(var(--color-primary) / 0.2);
	}

	.conversation-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem;
	}

	.conversation-item {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: none;
		background: transparent;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		font-size: 0.8125rem;
		text-align: left;
		transition: all 0.15s;
	}

	.conversation-item:hover {
		background: hsl(var(--color-surface-hover));
	}

	.conversation-item.active {
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
	}

	.conv-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.conv-delete {
		flex-shrink: 0;
		opacity: 0;
		border: none;
		background: none;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		padding: 0.125rem;
		border-radius: 0.25rem;
		display: flex;
		transition: all 0.15s;
	}

	.conversation-item:hover .conv-delete {
		opacity: 1;
	}

	.conv-delete:hover {
		color: hsl(var(--color-error));
	}

	.empty-hint {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		padding: 1rem;
	}

	.chat-area {
		flex: 1;
		background: hsl(var(--color-background));
		display: flex;
		flex-direction: column;
	}

	.empty-state {
		flex: 1;
		min-height: 300px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		padding: 2rem;
		text-align: center;
	}

	.empty-state h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
	}

	.empty-state p {
		max-width: 320px;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.start-btn {
		padding: 0.625rem 1.25rem;
		border-radius: 9999px;
		border: none;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.start-btn:hover {
		filter: brightness(1.1);
	}

	.sidebar-footer {
		padding: 0.75rem 1rem;
		border-top: 1px solid var(--color-border, #ddd);
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.sidebar-footer a {
		color: var(--color-muted, #888);
		text-decoration: none;
		font-size: 0.8125rem;
	}
	.sidebar-footer a:hover {
		color: var(--color-primary, #6b5bff);
	}
</style>
