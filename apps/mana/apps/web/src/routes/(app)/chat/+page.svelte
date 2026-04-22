<script lang="ts">
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { conversationsStore } from '$lib/modules/chat/stores/conversations.svelte';
	import { messagesStore } from '$lib/modules/chat/stores/messages.svelte';
	import { filterBySearch, splitPinned } from '$lib/modules/chat/queries';
	import type { Conversation, Template } from '$lib/modules/chat/types';
	import { Plus, ChatCircle, PushPin, Archive, MagnifyingGlass, Sparkle } from '@mana/shared-icons';

	const conversationsCtx: { readonly value: Conversation[] } = getContext('conversations');
	const templatesCtx: { readonly value: Template[] } = getContext('templates');

	let searchQuery = $state('');
	let filtered = $derived(filterBySearch(conversationsCtx.value, searchQuery));
	let { pinned, unpinned } = $derived(splitPinned(filtered));

	async function handleNewChat() {
		const conversation = await conversationsStore.create({});
		goto(`/chat/${conversation.id}`);
	}

	function handleConversationClick(id: string) {
		goto(`/chat/${id}`);
	}

	async function handlePin(e: Event, id: string, isPinned: boolean) {
		e.stopPropagation();
		if (isPinned) {
			await conversationsStore.unpin(id);
		} else {
			await conversationsStore.pin(id);
		}
	}

	async function handleArchive(e: Event, id: string) {
		e.stopPropagation();
		await conversationsStore.archive(id);
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		if (days === 0) return 'Heute';
		if (days === 1) return 'Gestern';
		if (days < 7) return `vor ${days} Tagen`;
		return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
	}
</script>

<svelte:head>
	<title>Chat - Mana</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-[hsl(var(--color-foreground))]">Chat</h1>
			<p class="text-sm text-[hsl(var(--color-muted-foreground))]">
				{conversationsCtx.value.length} Konversationen
			</p>
		</div>
		<div class="flex items-center gap-2">
			<a
				href="/chat/templates"
				class="flex items-center gap-2 rounded-lg border border-[hsl(var(--color-border))] px-4 py-2 text-sm font-medium text-[hsl(var(--color-foreground))] transition-colors hover:bg-[hsl(var(--color-muted))]"
			>
				Vorlagen
			</a>
			<button
				onclick={handleNewChat}
				class="flex items-center gap-2 rounded-lg bg-[hsl(var(--color-primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--color-primary-foreground))] transition-colors hover:opacity-90"
			>
				<Plus size={20} />
				Neuer Chat
			</button>
		</div>
	</div>

	<!-- Search -->
	<div class="relative">
		<MagnifyingGlass
			size={18}
			class="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--color-muted-foreground))]"
		/>
		<input
			type="text"
			placeholder="Konversationen durchsuchen..."
			bind:value={searchQuery}
			class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] py-2.5 pl-10 pr-4 text-sm text-[hsl(var(--color-foreground))] placeholder:text-[hsl(var(--color-muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
		/>
	</div>

	<!-- Conversations -->
	{#if conversationsCtx.value.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--color-border))] py-16"
		>
			<div
				class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--color-primary)/0.1)]"
			>
				<Sparkle size={32} weight="duotone" class="text-[hsl(var(--color-primary))]" />
			</div>
			<h2 class="mb-2 text-lg font-semibold text-[hsl(var(--color-foreground))]">
				Starte deine erste Unterhaltung
			</h2>
			<p class="mb-6 text-sm text-[hsl(var(--color-muted-foreground))]">
				Stelle eine Frage oder bitte um Hilfe bei einem Projekt.
			</p>
			<button
				onclick={handleNewChat}
				class="rounded-lg bg-[hsl(var(--color-primary))] px-6 py-2.5 text-sm font-medium text-[hsl(var(--color-primary-foreground))]"
			>
				Neuer Chat
			</button>
		</div>
	{:else}
		<div class="space-y-4">
			<!-- Pinned -->
			{#if pinned.length > 0}
				<div>
					<h3
						class="mb-2 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-muted-foreground))]"
					>
						Angepinnt
					</h3>
					<div class="space-y-1">
						{#each pinned as conv (conv.id)}
							<div
								role="button"
								tabindex="0"
								onclick={() => handleConversationClick(conv.id)}
								onkeydown={(e) => e.key === 'Enter' && handleConversationClick(conv.id)}
								class="group flex items-center gap-3 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-3 transition-colors hover:border-[hsl(var(--color-primary)/0.3)]"
							>
								<ChatCircle size={20} class="shrink-0 text-[hsl(var(--color-primary))]" />
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-[hsl(var(--color-foreground))]">
										{conv.title || 'Neue Konversation'}
									</p>
									<p class="text-xs text-[hsl(var(--color-muted-foreground))]">
										{formatDate(conv.updatedAt)}
									</p>
								</div>
								<div
									class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
								>
									<button
										onclick={(e) => handlePin(e, conv.id, true)}
										class="rounded p-1 text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-muted))]"
										title="Loslösen"
									>
										<PushPin size={16} weight="fill" />
									</button>
									<button
										onclick={(e) => handleArchive(e, conv.id)}
										class="rounded p-1 text-[hsl(var(--color-muted-foreground))] hover:bg-[hsl(var(--color-muted))]"
										title="Archivieren"
									>
										<Archive size={16} />
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Recent -->
			{#if unpinned.length > 0}
				<div>
					{#if pinned.length > 0}
						<h3
							class="mb-2 text-xs font-medium uppercase tracking-wide text-[hsl(var(--color-muted-foreground))]"
						>
							Zuletzt
						</h3>
					{/if}
					<div class="space-y-1">
						{#each unpinned as conv (conv.id)}
							<div
								role="button"
								tabindex="0"
								onclick={() => handleConversationClick(conv.id)}
								onkeydown={(e) => e.key === 'Enter' && handleConversationClick(conv.id)}
								class="group flex items-center gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-card))]"
							>
								<ChatCircle size={20} class="shrink-0 text-[hsl(var(--color-muted-foreground))]" />
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-[hsl(var(--color-foreground))]">
										{conv.title || 'Neue Konversation'}
									</p>
									<p class="text-xs text-[hsl(var(--color-muted-foreground))]">
										{formatDate(conv.updatedAt)}
									</p>
								</div>
								<div
									class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
								>
									<button
										onclick={(e) => handlePin(e, conv.id, false)}
										class="rounded p-1 text-[hsl(var(--color-muted-foreground))] hover:bg-[hsl(var(--color-muted))]"
										title="Anpinnen"
									>
										<PushPin size={16} />
									</button>
									<button
										onclick={(e) => handleArchive(e, conv.id)}
										class="rounded p-1 text-[hsl(var(--color-muted-foreground))] hover:bg-[hsl(var(--color-muted))]"
										title="Archivieren"
									>
										<Archive size={16} />
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Archive link -->
	<div class="pt-2">
		<a
			href="/chat/archive"
			class="inline-flex items-center gap-2 text-sm text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
		>
			<Archive size={16} />
			Archiv anzeigen
		</a>
	</div>
</div>
