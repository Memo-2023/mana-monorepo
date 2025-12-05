<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount } from 'svelte';
	import { itemsStore } from '$lib/stores';
	import { PageHeader, Button } from '@manacore/shared-ui';

	onMount(() => {
		itemsStore.fetchItems({ isArchived: true });
	});

	async function handleRestore(id: string) {
		await itemsStore.toggleArchive(id);
	}
</script>

<svelte:head>
	<title>{$_('archive.title')} - {$_('app.name')}</title>
</svelte:head>

<div class="p-6">
	<PageHeader title={$_('archive.title')} />

	<div class="mt-6">
		{#if itemsStore.loading}
			<div class="flex items-center justify-center py-12">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
				></div>
			</div>
		{:else if itemsStore.items.length === 0}
			<div class="text-center py-12">
				<div
					class="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-secondary/10 flex items-center justify-center"
				>
					<svg
						class="w-8 h-8 text-theme-secondary"
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
				</div>
				<p class="text-theme-secondary">{$_('archive.empty')}</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each itemsStore.items as item}
					<div class="flex items-center justify-between p-4 rounded-lg border border-theme">
						<div>
							<h3 class="font-medium text-theme">{item.name}</h3>
							{#if item.category}
								<p class="text-xs text-theme-secondary mt-1">{item.category.name}</p>
							{/if}
						</div>
						<Button variant="outline" size="sm" onclick={() => handleRestore(item.id)}>
							{$_('item.unarchive')}
						</Button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
