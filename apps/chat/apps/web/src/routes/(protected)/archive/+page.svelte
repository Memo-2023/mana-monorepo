<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { conversationsStore } from '$lib/stores/conversations.svelte';
	import type { Conversation } from '@chat/types';

	let conversations = $state<Conversation[]>([]);
	let isLoading = $state(true);

	onMount(async () => {
		if (authStore.user) {
			await conversationsStore.loadArchivedConversations(authStore.user.id);
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

<div class="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 py-8">
	<div class="max-w-4xl mx-auto px-4">
		<!-- Header -->
		<div class="mb-6">
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Archiv</h1>
			<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
				Deine archivierten Konversationen.
			</p>
		</div>

		<!-- Loading State -->
		{#if isLoading}
			<div class="flex items-center justify-center py-16">
				<div
					class="animate-spin w-8 h-8 border-4 border-blue-500 border-r-transparent rounded-full"
				></div>
			</div>
		{:else if conversations.length === 0}
			<!-- Empty State -->
			<div class="text-center py-16">
				<svg
					class="w-16 h-16 text-gray-400 mx-auto mb-4"
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
				<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">
					Keine archivierten Konversationen
				</h3>
				<p class="text-gray-500 dark:text-gray-400">Archivierte Gespräche erscheinen hier.</p>
			</div>
		{:else}
			<!-- Conversation List -->
			<div class="space-y-3">
				{#each conversations as conv (conv.id)}
					<div
						class="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
                   shadow-sm hover:shadow-md transition-all overflow-hidden"
					>
						<button onclick={() => handleConversationClick(conv.id)} class="w-full p-4 text-left">
							<div class="flex items-center justify-between mb-2">
								<div class="flex items-center gap-2">
									<svg
										class="w-5 h-5 text-gray-400"
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
									<h3 class="font-semibold text-gray-900 dark:text-white">
										{conv.title || 'Unbenannte Konversation'}
									</h3>
								</div>
								<span class="text-xs text-gray-500">{formatDate(conv.updated_at)}</span>
							</div>
							<div class="flex items-center gap-2 text-xs text-gray-500">
								<span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
									{conv.conversation_mode === 'free'
										? 'Freier Modus'
										: conv.conversation_mode === 'guided'
											? 'Geführter Modus'
											: 'Vorlagen-Modus'}
								</span>
							</div>
						</button>

						<!-- Actions -->
						<div
							class="flex justify-end gap-2 px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
						>
							<button
								onclick={() => handleUnarchive(conv.id)}
								class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400
                       hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20
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
								class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400
                       hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20
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
