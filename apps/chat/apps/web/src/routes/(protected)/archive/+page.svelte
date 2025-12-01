<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { conversationsStore } from '$lib/stores/conversations.svelte';
	import { PageHeader } from '@manacore/shared-ui';
	import type { Conversation } from '@chat/types';

	let conversations = $state<Conversation[]>([]);
	let isLoading = $state(true);

	onMount(async () => {
		if (authStore.user) {
			await conversationsStore.loadArchivedConversations();
			conversations = conversationsStore.archivedConversations;
		}
		isLoading = false;
	});

	// Keep conversations in sync with store
	$effect(() => {
		conversations = conversationsStore.archivedConversations;
	});

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function handleConversationClick(id: string) {
		goto(`/chat/${id}`);
	}

	async function handleUnarchive(id: string) {
		await conversationsStore.unarchiveConversation(id);
	}

	async function handleDelete(id: string) {
		if (
			confirm(
				'Möchtest du diese Konversation wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.'
			)
		) {
			await conversationsStore.deleteConversation(id);
		}
	}
</script>

<svelte:head>
	<title>Archiv | ManaChat</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] bg-background py-8">
	<div class="max-w-4xl mx-auto px-4">
		<PageHeader title="Archiv" description="Deine archivierten Konversationen." size="lg" />

		<!-- Loading State -->
		{#if isLoading}
			<div class="flex items-center justify-center py-16">
				<div
					class="animate-spin w-8 h-8 border-4 border-primary border-r-transparent rounded-full"
				></div>
			</div>
		{:else if conversations.length === 0}
			<!-- Empty State -->
			<div class="text-center py-16">
				<svg
					class="w-16 h-16 text-muted-foreground mx-auto mb-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
					/>
				</svg>
				<h3 class="text-lg font-medium text-foreground mb-1">Keine archivierten Konversationen</h3>
				<p class="text-muted-foreground">Archivierte Gespräche erscheinen hier.</p>
			</div>
		{:else}
			<!-- Conversation List -->
			<div class="space-y-3">
				{#each conversations as conv (conv.id)}
					<div
						class="group bg-surface rounded-xl border border-border
                   shadow-sm hover:shadow-md transition-all overflow-hidden"
					>
						<button onclick={() => handleConversationClick(conv.id)} class="w-full p-4 text-left">
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-2">
									<svg
										class="w-5 h-5 text-muted-foreground"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
										/>
									</svg>
									<h3 class="font-semibold text-foreground">
										{conv.title || 'Unbenannte Konversation'}
									</h3>
								</div>
								<span class="text-xs text-muted-foreground">{formatDate(conv.updatedAt)}</span>
							</div>
							<div class="flex items-center gap-2 text-xs text-muted-foreground">
								<span class="px-2 py-0.5 bg-muted rounded">
									{conv.conversationMode === 'free'
										? 'Freier Modus'
										: conv.conversationMode === 'guided'
											? 'Geführter Modus'
											: 'Vorlagen-Modus'}
								</span>
							</div>
						</button>

						<!-- Actions -->
						<div class="flex justify-end gap-2 px-4 py-2 border-t border-border bg-muted/50">
							<button
								onclick={() => handleUnarchive(conv.id)}
								class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground
                       hover:text-primary hover:bg-primary/10
                       rounded-lg transition-colors"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
									/>
								</svg>
								Wiederherstellen
							</button>
							<button
								onclick={() => handleDelete(conv.id)}
								class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground
                       hover:text-destructive hover:bg-destructive/10
                       rounded-lg transition-colors"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
								Löschen
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Error Message -->
		{#if conversationsStore.error}
			<div class="mt-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
				{conversationsStore.error}
			</div>
		{/if}
	</div>
</div>
