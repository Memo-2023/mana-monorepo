<script lang="ts">
	import { page } from '$app/stores';
	import { conversationsStore } from '$lib/stores/conversations.svelte';
	import type { Conversation } from '@chat/types';
	import { Plus, PencilSimple, Check, X } from '@manacore/shared-icons';

	interface Props {
		conversations: Conversation[];
		isLoading?: boolean;
	}

	let { conversations, isLoading = false }: Props = $props();

	// Edit state
	let editingId = $state<string | null>(null);
	let editTitle = $state('');
	let isSaving = $state(false);

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
		} else if (diffDays === 1) {
			return 'Gestern';
		} else if (diffDays < 7) {
			return date.toLocaleDateString('de-DE', { weekday: 'short' });
		} else {
			return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
		}
	}

	function truncateTitle(title: string, maxLength: number = 30): string {
		if (title.length <= maxLength) return title;
		return title.substring(0, maxLength - 3) + '...';
	}

	function startEdit(conv: Conversation, event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		editingId = conv.id;
		editTitle = conv.title || '';
	}

	async function saveTitle(conversationId: string) {
		if (!editTitle.trim() || isSaving) return;

		isSaving = true;
		try {
			await conversationsStore.updateConversationTitle(conversationId, editTitle.trim());
		} finally {
			isSaving = false;
			editingId = null;
			editTitle = '';
		}
	}

	function cancelEdit() {
		editingId = null;
		editTitle = '';
	}

	function handleKeydown(event: KeyboardEvent, conversationId: string) {
		if (event.key === 'Enter') {
			event.preventDefault();
			saveTitle(conversationId);
		} else if (event.key === 'Escape') {
			cancelEdit();
		}
	}
</script>

<div class="flex flex-col h-full">
	<!-- New Chat Button -->
	<div class="p-3 border-b border-border">
		<a
			href="/chat"
			class="flex items-center justify-center gap-2 w-full px-4 py-2.5
             bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg
             font-medium transition-colors"
		>
			<Plus size={20} weight="bold" />
			Neuer Chat
		</a>
	</div>

	<!-- Conversation List -->
	<div class="flex-1 overflow-y-auto">
		{#if isLoading}
			<div class="flex items-center justify-center py-8">
				<div
					class="animate-spin w-6 h-6 border-2 border-primary border-r-transparent rounded-full"
				></div>
			</div>
		{:else if conversations.length === 0}
			<div class="px-4 py-8 text-center text-muted-foreground">
				<p class="text-sm">Keine Konversationen</p>
				<p class="text-xs mt-1">Starte einen neuen Chat</p>
			</div>
		{:else}
			<div class="py-2">
				{#each conversations as conv (conv.id)}
					{@const isActive = $page.params.id === conv.id}
					{#if editingId === conv.id}
						<!-- Edit Mode -->
						<div class="flex items-center gap-1 px-3 py-2 mx-2">
							<input
								type="text"
								bind:value={editTitle}
								onkeydown={(e) => handleKeydown(e, conv.id)}
								class="flex-1 px-2 py-1 text-sm bg-background border border-border rounded-md
								       focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
								autofocus
							/>
							<button
								onclick={() => saveTitle(conv.id)}
								disabled={isSaving || !editTitle.trim()}
								class="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors
								       disabled:opacity-50 disabled:cursor-not-allowed"
								title="Speichern"
							>
								<Check size={16} weight="bold" />
							</button>
							<button
								onclick={cancelEdit}
								class="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"
								title="Abbrechen"
							>
								<X size={16} weight="bold" />
							</button>
						</div>
					{:else}
						<!-- View Mode -->
						<div class="group relative">
							<a
								href="/chat/{conv.id}"
								class="block px-3 py-2 mx-2 rounded-lg transition-colors
								       {isActive
									? 'bg-primary/10 text-primary'
									: 'hover:bg-muted text-foreground'}"
							>
								<div class="flex items-center justify-between gap-2">
									<span class="text-sm font-medium truncate pr-6">
										{truncateTitle(conv.title || 'Neue Konversation')}
									</span>
									<span class="text-xs text-muted-foreground flex-shrink-0">
										{formatDate(conv.updatedAt || conv.createdAt)}
									</span>
								</div>
							</a>
							<!-- Edit Button (visible on hover) -->
							<button
								onclick={(e) => startEdit(conv, e)}
								class="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md
								       text-muted-foreground hover:text-foreground hover:bg-muted
								       opacity-0 group-hover:opacity-100 transition-opacity"
								title="Umbenennen"
							>
								<PencilSimple size={14} weight="bold" />
							</button>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>
