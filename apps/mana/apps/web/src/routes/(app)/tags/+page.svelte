<script lang="ts">
	import { useAllTags } from '@mana/shared-stores';
	import { RoutePage } from '$lib/components/shell';

	const tags = useAllTags();
</script>

<svelte:head>
	<title>Tags | Mana</title>
</svelte:head>

<RoutePage appId="tags">
	<div class="tags-page">
		<h1>Tags verwalten</h1>
		<p class="mb-4 text-sm text-muted-foreground">
			Tags sind app-übergreifend — Änderungen gelten in allen Mana-Apps.
		</p>

		{#if tags.loading}
			<p>Lädt...</p>
		{:else if (tags.value ?? []).length === 0}
			<p>Keine Tags vorhanden.</p>
		{:else}
			<div class="grid gap-2">
				{#each tags.value ?? [] as tag}
					<div class="flex items-center gap-2 rounded-lg bg-card p-2">
						<span class="h-3 w-3 rounded-full" style="background-color: {tag.color}"></span>
						<span>{tag.name}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</RoutePage>

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
