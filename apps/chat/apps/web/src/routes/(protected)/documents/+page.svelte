<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { documentService } from '$lib/services/document';
	import { PageHeader } from '@manacore/shared-ui';
	import type { DocumentWithConversation } from '@chat/types';

	let documents = $state<DocumentWithConversation[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		if (authStore.user) {
			await loadDocuments();
		}
	});

	async function loadDocuments() {
		isLoading = true;
		error = null;

		try {
			documents = await documentService.getUserDocuments(authStore.user!.id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Laden der Dokumente';
		} finally {
			isLoading = false;
		}
	}

	function extractTitle(content: string): string {
		// Look for markdown heading level 1 at the start
		const titleMatch = content.match(/^#\s+(.+)$/m);
		if (titleMatch && titleMatch[1]) {
			return titleMatch[1].trim();
		}

		// Alternative: Look for heading level 2
		const subtitleMatch = content.match(/^##\s+(.+)$/m);
		if (subtitleMatch && subtitleMatch[1]) {
			return subtitleMatch[1].trim();
		}

		// If no heading found, take first words
		const firstLine = content.split('\n')[0].trim();
		if (firstLine.length > 0) {
			return firstLine.length > 40 ? `${firstLine.substring(0, 37)}...` : firstLine;
		}

		return 'Dokument ohne Titel';
	}

	function getPreview(content: string): string {
		// Remove the first heading if present
		let preview = content.replace(/^#\s+.+$/m, '').trim();
		// Take first 200 characters
		if (preview.length > 200) {
			preview = preview.substring(0, 200) + '...';
		}
		return preview;
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	function navigateToConversation(conversationId: string) {
		goto(`/chat/${conversationId}`);
	}
</script>

<svelte:head>
	<title>Dokumente | ManaChat</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] bg-background py-8">
	<div class="max-w-6xl mx-auto px-4">
		<PageHeader
			title="Dokumente"
			description="Alle Dokumente aus deinen Konversationen im Dokumentmodus."
			size="lg"
		>
			{#snippet actions()}
				<button
					onclick={loadDocuments}
					class="p-2 text-muted-foreground hover:text-foreground
                   hover:bg-muted rounded-lg transition-colors"
					aria-label="Aktualisieren"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
				</button>
			{/snippet}
		</PageHeader>

		<!-- Loading State -->
		{#if isLoading}
			<div class="flex items-center justify-center py-16">
				<div
					class="animate-spin w-8 h-8 border-4 border-primary border-r-transparent rounded-full"
				></div>
			</div>
		{:else if documents.length === 0}
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
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				<h3 class="text-lg font-medium text-foreground mb-1">
					Keine Dokumente gefunden
				</h3>
				<p class="text-muted-foreground max-w-sm mx-auto">
					Erstelle ein neues Dokument in einer Konversation mit aktiviertem Dokumentmodus.
				</p>
			</div>
		{:else}
			<!-- Documents Grid -->
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each documents as doc (doc.id)}
					<button
						onclick={() => navigateToConversation(doc.conversationId)}
						class="text-left p-0 bg-surface rounded-xl border border-border
                   shadow-sm hover:shadow-md hover:border-primary/50 transition-all overflow-hidden"
					>
						<!-- Header -->
						<div class="p-4 border-b border-border">
							<h3 class="font-semibold text-foreground line-clamp-2 mb-2">
								{extractTitle(doc.content)}
							</h3>
							<div class="flex items-center justify-between text-xs text-muted-foreground">
								<span class="truncate">{doc.conversationTitle}</span>
								<div class="flex items-center gap-2 flex-shrink-0">
									<span>{formatDate(doc.updatedAt)}</span>
									<span class="px-1.5 py-0.5 bg-muted rounded font-medium">
										v{doc.version}
									</span>
								</div>
							</div>
						</div>

						<!-- Preview -->
						<div class="p-4 h-32 overflow-hidden">
							<p class="text-sm text-muted-foreground line-clamp-5">
								{getPreview(doc.content)}
							</p>
						</div>
					</button>
				{/each}
			</div>
		{/if}

		<!-- Error Message -->
		{#if error}
			<div class="mt-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
				{error}
			</div>
		{/if}
	</div>
</div>
