<script lang="ts">
	import type { ContentNode } from '$lib/types/content';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let nodes = $state<ContentNode[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadCharacters() {
		try {
			const response = await fetch('/api/nodes?kind=character');
			if (!response.ok) throw new Error('Failed to load characters');
			nodes = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadCharacters();
	});
</script>

<div class="space-y-6">
	<div class="sm:flex sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-theme-text-primary">Charaktere</h1>
			<p class="mt-1 text-sm text-theme-text-secondary">
				Verwalte deine Charaktere und erschaffe neue Persönlichkeiten
			</p>
		</div>
		{#if data.user}
			<div class="mt-4 sm:mt-0">
				<a
					href="/characters/new"
					class="inline-flex items-center rounded-md border border-transparent bg-theme-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-theme-primary-700"
				>
					Neuer Charakter
				</a>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="py-12 text-center">
			<p class="text-theme-text-secondary">Lade Charaktere...</p>
		</div>
	{:else if error}
		<div class="bg-theme-error/10 rounded-md p-4">
			<p class="text-sm text-theme-error">{error}</p>
		</div>
	{:else if nodes.length === 0}
		<div class="rounded-lg bg-theme-surface py-12 text-center shadow">
			<p class="text-theme-text-secondary">Noch keine Charaktere vorhanden</p>
			{#if data.user}
				<a
					href="/characters/new"
					class="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-theme-primary-600 hover:text-theme-primary-500"
				>
					Erstelle deinen ersten Charakter
				</a>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each nodes as node}
				<a
					href="/characters/{node.slug}"
					class="overflow-hidden rounded-lg bg-theme-surface shadow transition-shadow hover:shadow-md"
				>
					<div class="px-4 py-5 sm:p-6">
						<h3 class="text-lg font-medium text-theme-text-primary">{node.title}</h3>
						{#if node.summary}
							<p class="mt-1 line-clamp-2 text-sm text-theme-text-secondary">{node.summary}</p>
						{/if}
						<div class="mt-3 flex items-center justify-between">
							<span
								class="inline-flex items-center rounded-full bg-theme-elevated px-2.5 py-0.5 text-xs font-medium text-theme-text-primary"
							>
								{node.visibility}
							</span>
							{#if node.tags && node.tags.length > 0}
								<div class="flex space-x-1">
									{#each node.tags.slice(0, 2) as tag}
										<span
											class="inline-flex items-center rounded bg-theme-primary-100 px-2 py-0.5 text-xs font-medium text-theme-primary-800"
										>
											{tag}
										</span>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
