<script lang="ts">
	import type { ContentNode } from '$lib/types/content';
	import { goto } from '$app/navigation';
	import { currentWorld } from '$lib/stores/worldContext';
	import NodeCard from '$lib/components/NodeCard.svelte';

	let { data } = $props();

	let nodes = $state<ContentNode[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadPlaces() {
		if (!$currentWorld) {
			error = 'Keine Welt ausgewählt';
			loading = false;
			return;
		}

		try {
			const response = await fetch(`/api/nodes?kind=place&world_slug=${$currentWorld.slug}`);
			if (!response.ok) throw new Error('Failed to load places');
			nodes = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadPlaces();
	});
</script>

<div class="space-y-6">
	<div class="sm:flex sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-theme-text-primary">Orte</h1>
			<p class="mt-1 text-sm text-theme-text-secondary">
				Orte in {$currentWorld?.title || 'dieser Welt'}
			</p>
		</div>
		{#if data.user && $currentWorld}
			<div class="mt-4 sm:mt-0">
				<a
					href="/worlds/{$currentWorld.slug}/places/new"
					class="inline-flex items-center rounded-md border border-transparent bg-theme-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-theme-primary-700"
				>
					<svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Neuer Ort
				</a>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="py-12 text-center">
			<div
				class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600 dark:border-violet-400"
			></div>
			<p class="mt-4 text-theme-text-secondary">Lade Orte...</p>
		</div>
	{:else if error}
		<div class="rounded-md bg-red-50/50 p-4">
			<p class="text-sm text-theme-error">{error}</p>
		</div>
	{:else if nodes.length === 0}
		<div class="rounded-lg bg-theme-surface py-12 text-center shadow">
			<svg
				class="mx-auto h-12 w-12 text-theme-text-tertiary"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
				/>
			</svg>
			<p class="mt-4 text-theme-text-secondary">Noch keine Orte in dieser Welt</p>
			{#if data.user && $currentWorld}
				<a
					href="/worlds/{$currentWorld.slug}/places/new"
					class="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-theme-primary-600 hover:text-violet-500 dark:hover:text-violet-300"
				>
					Erstelle den ersten Ort
				</a>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each nodes as node}
				<NodeCard {node} href="/worlds/{$currentWorld?.slug}/places/{node.slug}" />
			{/each}
		</div>
	{/if}
</div>
