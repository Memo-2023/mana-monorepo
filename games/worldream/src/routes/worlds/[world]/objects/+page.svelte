<script lang="ts">
	import type { ContentNode } from '$lib/types/content';
	import { goto } from '$app/navigation';
	import { currentWorld } from '$lib/stores/worldContext';
	import NodeCard from '$lib/components/NodeCard.svelte';

	let { data } = $props();

	let nodes = $state<ContentNode[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadObjects() {
		if (!$currentWorld) {
			error = 'Keine Welt ausgewählt';
			loading = false;
			return;
		}

		try {
			const response = await fetch(`/api/nodes?kind=object&world_slug=${$currentWorld.slug}`);
			if (!response.ok) throw new Error('Failed to load objects');
			nodes = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadObjects();
	});
</script>

<div class="space-y-6">
	<div class="sm:flex sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-theme-text-primary">Objekte</h1>
			<p class="mt-1 text-sm text-theme-text-secondary">
				Objekte in {$currentWorld?.title || 'dieser Welt'}
			</p>
		</div>
		{#if data.user && $currentWorld}
			<div class="mt-4 sm:mt-0">
				<a
					href="/worlds/{$currentWorld.slug}/objects/new"
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
					Neues Objekt
				</a>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="py-12 text-center">
			<div
				class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600 dark:border-violet-400"
			></div>
			<p class="mt-4 text-theme-text-secondary">Lade Objekte...</p>
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
					d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
				/>
			</svg>
			<p class="mt-4 text-theme-text-secondary">Noch keine Objekte in dieser Welt</p>
			{#if data.user && $currentWorld}
				<a
					href="/worlds/{$currentWorld.slug}/objects/new"
					class="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-theme-primary-600 hover:text-violet-500 dark:hover:text-violet-300"
				>
					Erstelle das erste Objekt
				</a>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each nodes as node}
				<NodeCard {node} href="/worlds/{$currentWorld?.slug}/objects/{node.slug}" />
			{/each}
		</div>
	{/if}
</div>
