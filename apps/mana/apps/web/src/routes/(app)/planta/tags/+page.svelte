<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import type { Tag } from '@mana/shared-tags';

	const tagsCtx: { readonly value: Tag[] } = getContext('tags');
</script>

<svelte:head>
	<title>Tags | Planta</title>
</svelte:head>

<div class="tags-page">
	<h1>Tags</h1>
	<p class="text-sm text-muted-foreground mb-4">
		{$_('planta.app.tagline')}
	</p>

	{#if tagsCtx.value.length === 0}
		<p>{$_('planta.list.empty')}</p>
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
