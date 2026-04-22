<script lang="ts">
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { conversationsStore } from '$lib/modules/chat/stores/conversations.svelte';
	import type { Conversation } from '$lib/modules/chat/types';
	import { ArrowLeft, ArrowCounterClockwise, Trash, ChatCircle } from '@mana/shared-icons';

	const archivedCtx: { readonly value: Conversation[] } = getContext('archivedConversations');

	async function handleUnarchive(e: Event, id: string) {
		e.stopPropagation();
		await conversationsStore.unarchive(id);
	}

	async function handleDelete(e: Event, id: string) {
		e.stopPropagation();
		if (confirm('Konversation endgultig loschen?')) {
			await conversationsStore.delete(id);
		}
	}

	function handleClick(id: string) {
		goto(`/chat/${id}`);
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
	}
</script>

<svelte:head>
	<title>Archiv - Chat - Mana</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-3">
		<a
			href="/chat"
			class="rounded-lg p-1.5 text-[hsl(var(--color-muted-foreground))] hover:bg-[hsl(var(--color-muted))]"
		>
			<ArrowLeft size={20} />
		</a>
		<div>
			<h1 class="text-2xl font-bold text-[hsl(var(--color-foreground))]">Archiv</h1>
			<p class="text-sm text-[hsl(var(--color-muted-foreground))]">
				{archivedCtx.value.length} archivierte Konversationen
			</p>
		</div>
	</div>

	{#if archivedCtx.value.length === 0}
		<div class="flex flex-col items-center justify-center py-16">
			<ChatCircle size={48} class="mb-4 text-[hsl(var(--color-muted-foreground))]" />
			<p class="text-[hsl(var(--color-muted-foreground))]">Keine archivierten Konversationen</p>
		</div>
	{:else}
		<div class="space-y-1">
			{#each archivedCtx.value as conv (conv.id)}
				<div
					role="button"
					tabindex="0"
					onclick={() => handleClick(conv.id)}
					onkeydown={(e) => e.key === 'Enter' && handleClick(conv.id)}
					class="group flex items-center gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-[hsl(var(--color-border))] hover:bg-[hsl(var(--color-card))]"
				>
					<ChatCircle size={20} class="shrink-0 text-[hsl(var(--color-muted-foreground))]" />
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-[hsl(var(--color-foreground))]">
							{conv.title || 'Konversation ohne Titel'}
						</p>
						<p class="text-xs text-[hsl(var(--color-muted-foreground))]">
							{formatDate(conv.updatedAt)}
						</p>
					</div>
					<div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
						<button
							onclick={(e) => handleUnarchive(e, conv.id)}
							class="rounded p-1.5 text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-primary))]"
							title="Wiederherstellen"
						>
							<ArrowCounterClockwise size={16} />
						</button>
						<button
							onclick={(e) => handleDelete(e, conv.id)}
							class="rounded p-1.5 text-[hsl(var(--color-muted-foreground))] hover:text-red-500"
							title="Endgultig loschen"
						>
							<Trash size={16} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
