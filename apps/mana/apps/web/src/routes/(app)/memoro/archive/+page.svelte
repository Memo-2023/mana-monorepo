<script lang="ts">
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { memosStore } from '$lib/modules/memoro/stores/memos.svelte';
	import type { Memo } from '$lib/modules/memoro/types';
	import { ArrowLeft, ArrowCounterClockwise, Trash, Microphone } from '@mana/shared-icons';

	const archivedCtx: { readonly value: Memo[] } = getContext('archivedMemos');

	async function handleUnarchive(e: Event, id: string) {
		e.stopPropagation();
		await memosStore.unarchive(id);
	}

	async function handleDelete(e: Event, id: string) {
		e.stopPropagation();
		if (confirm('Memo endgultig loschen?')) {
			await memosStore.delete(id);
		}
	}

	function handleClick(id: string) {
		goto(`/memoro/${id}`);
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
	<title>Archiv - Memoro - Mana</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-3">
		<a
			href="/memoro"
			class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
		>
			<ArrowLeft size={20} />
		</a>
		<div>
			<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Archiv</h1>
			<p class="text-sm text-[hsl(var(--muted-foreground))]">
				{archivedCtx.value.length} archivierte Memos
			</p>
		</div>
	</div>

	{#if archivedCtx.value.length === 0}
		<div class="flex flex-col items-center justify-center py-16">
			<Microphone size={48} class="mb-4 text-[hsl(var(--muted-foreground))]" />
			<p class="text-[hsl(var(--muted-foreground))]">Keine archivierten Memos</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each archivedCtx.value as memo (memo.id)}
				<div
					role="button"
					tabindex="0"
					onclick={() => handleClick(memo.id)}
					onkeydown={(e) => e.key === 'Enter' && handleClick(memo.id)}
					class="group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition-all hover:border-[hsl(var(--primary)/0.3)]"
				>
					<div class="flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h3 class="truncate font-medium text-[hsl(var(--foreground))]">
								{memo.title || 'Unbenanntes Memo'}
							</h3>
							{#if memo.intro}
								<p class="mt-1 text-sm text-[hsl(var(--muted-foreground))] line-clamp-1">
									{memo.intro}
								</p>
							{/if}
							<p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
								{formatDate(memo.updatedAt)}
							</p>
						</div>
						<div
							class="ml-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
						>
							<button
								onclick={(e) => handleUnarchive(e, memo.id)}
								class="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
								title="Wiederherstellen"
							>
								<ArrowCounterClockwise size={16} />
							</button>
							<button
								onclick={(e) => handleDelete(e, memo.id)}
								class="rounded p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-500"
								title="Endgultig loschen"
							>
								<Trash size={16} />
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
