<script lang="ts">
	import { getContext } from 'svelte';
	import { tagMutations } from '@manacore/shared-stores';
	import type { Tag } from '@manacore/shared-tags';

	const tagsCtx: { readonly value: Tag[] } = getContext('tags');
</script>

<svelte:head>
	<title>Tags | Questions</title>
</svelte:head>

<div class="tags-page">
	<h1>Tags verwalten</h1>
	<p class="text-sm text-muted-foreground mb-4">
		Tags sind app-übergreifend — Änderungen gelten in allen ManaCore-Apps.
	</p>

	{#if tagsCtx.value.length === 0}
		<p>Keine Tags vorhanden.</p>
	{:else}
		<div class="grid gap-2">
			{#each tagsCtx.value as tag}
				<div class="flex items-center gap-2 p-2 rounded-lg bg-card">
					<span class="w-3 h-3 rounded-full" style="background-color: {tag.color}"></span>
					<span>{tag.name}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.tags-page {
		padding: 1.5rem;
		max-width: 600px;
		margin: 0 auto;
	}
	h1 {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
</style>
