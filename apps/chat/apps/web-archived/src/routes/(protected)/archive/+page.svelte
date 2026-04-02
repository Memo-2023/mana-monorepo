<script lang="ts">
	import { goto } from '$app/navigation';
	import { conversationsStore } from '$lib/stores/conversations.svelte';
	import { useArchivedConversations } from '$lib/data/queries';
	import { PageHeader } from '@manacore/shared-ui';
	import { Archive, ArrowUUpLeft, Trash } from '@manacore/shared-icons';
	import type { Conversation } from '@chat/types';

	const archivedConvs = useArchivedConversations();
	let conversations = $derived(archivedConvs.value);

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

		{#if conversations.length === 0}
			<!-- Empty State -->
			<div class="text-center py-16">
				<Archive size={64} class="text-muted-foreground mx-auto mb-4" />
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
									<Archive size={20} class="text-muted-foreground" />
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
								<ArrowUUpLeft size={16} />
								Wiederherstellen
							</button>
							<button
								onclick={() => handleDelete(conv.id)}
								class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground
                       hover:text-destructive hover:bg-destructive/10
                       rounded-lg transition-colors"
							>
								<Trash size={16} />
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
