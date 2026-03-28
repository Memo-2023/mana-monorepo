<script lang="ts">
	import { onMount, getContext } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { filterBySpace } from '$lib/data/queries';
	import { spaceService } from '$lib/services/space';
	import { conversationService } from '$lib/services/conversation';
	import { chatService } from '$lib/services/chat';
	import { PageHeader } from '@manacore/shared-ui';
	import type { Space, Conversation, AIModel } from '@chat/types';

	const spaceId = $derived($page.params.id ?? '');

	// Conversations from live query context, filtered by space
	const conversationsCtx: { readonly value: Conversation[] } = getContext('conversations');
	let conversations = $derived(filterBySpace(conversationsCtx.value, spaceId));

	let space = $state<Space | null>(null);
	let models = $state<AIModel[]>([]);
	let selectedModelId = $state('');
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		isLoading = true;
		error = null;

		try {
			// Load space details
			space = await spaceService.getSpace(spaceId);
			if (!space) {
				error = 'Space nicht gefunden';
				return;
			}

			// Load models
			models = await chatService.getModels();
			if (models.length > 0) {
				// Find default model, or fall back to first model
				const defaultModel = models.find((m) => m.isDefault);
				selectedModelId = defaultModel?.id || models[0].id;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Laden';
		} finally {
			isLoading = false;
		}
	}

	async function handleNewChat() {
		if (!authStore.user || !selectedModelId) return;

		const conversationId = await conversationService.createConversation({
			modelId: selectedModelId,
			mode: 'free',
			spaceId,
		});

		if (conversationId) {
			goto(`/chat/${conversationId}`);
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}
</script>

<svelte:head>
	<title>{space?.name || 'Space'} | ManaChat</title>
</svelte:head>

{#if isLoading}
	<div class="flex items-center justify-center h-[calc(100vh-4rem)]">
		<div
			class="animate-spin w-8 h-8 border-4 border-primary border-r-transparent rounded-full"
		></div>
	</div>
{:else if error}
	<div class="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center p-4">
		<p class="text-destructive mb-4">{error}</p>
		<a href="/spaces" class="text-primary hover:underline">Zurück zu Spaces</a>
	</div>
{:else if space}
	<div class="min-h-[calc(100vh-4rem)] bg-background py-8">
		<div class="max-w-4xl mx-auto px-4">
			<PageHeader title={space.name} description={space.description} backHref="/spaces" size="lg" />

			<!-- New Chat Section -->
			<div class="mb-8 p-4 bg-surface rounded-xl border border-border">
				<h2 class="text-lg font-semibold text-foreground mb-3">Neuen Chat starten</h2>
				<div class="flex items-center gap-3">
					<select
						bind:value={selectedModelId}
						class="flex-1 px-3 py-2 border border-border rounded-lg
                   bg-muted text-foreground
                   focus:ring-2 focus:ring-primary focus:border-transparent"
					>
						{#each models as model}
							<option value={model.id}>{model.name}</option>
						{/each}
					</select>
					<button
						onclick={handleNewChat}
						class="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium
                   hover:bg-primary/90 transition-colors whitespace-nowrap"
					>
						Chat starten
					</button>
				</div>
			</div>

			<!-- Conversations List -->
			<div>
				<h2 class="text-lg font-semibold text-foreground mb-4">Konversationen in diesem Space</h2>

				{#if conversations.length === 0}
					<div class="text-center py-12 bg-surface rounded-xl border border-border">
						<svg
							class="w-12 h-12 text-muted-foreground mx-auto mb-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
							/>
						</svg>
						<p class="text-muted-foreground">Noch keine Konversationen in diesem Space.</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each conversations as conv (conv.id)}
							<a
								href="/chat/{conv.id}"
								class="block p-4 bg-surface rounded-xl border border-border
                       hover:border-primary/50 transition-colors"
							>
								<div class="flex items-center justify-between">
									<h3 class="font-medium text-foreground">
										{conv.title || 'Neue Konversation'}
									</h3>
									<span class="text-xs text-muted-foreground">{formatDate(conv.updatedAt)}</span>
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
