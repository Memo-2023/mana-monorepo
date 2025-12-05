<script lang="ts">
	import type { ContentNode } from '$lib/types/content';
	import { goto } from '$app/navigation';
	import { currentWorld } from '$lib/stores/worldContext';
	import { page } from '$app/stores';
	import NodeCard from '$lib/components/NodeCard.svelte';

	let { data } = $props();

	let nodes = $state<ContentNode[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadCharacters() {
		if (!$currentWorld) {
			error = 'Keine Welt ausgewählt';
			loading = false;
			return;
		}

		try {
			const response = await fetch(`/api/nodes?kind=character&world_slug=${$currentWorld.slug}`);
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
				Charaktere in {$currentWorld?.title || 'dieser Welt'}
			</p>
		</div>
		{#if data.user && $currentWorld}
			<div class="mt-4 sm:mt-0">
				<a
					href="/worlds/{$currentWorld.slug}/characters/new"
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
					Neuer Charakter
				</a>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="py-12 text-center">
			<div
				class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600 dark:border-violet-400"
			></div>
			<p class="mt-4 text-theme-text-secondary">Lade Charaktere...</p>
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
					d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
				/>
			</svg>
			<p class="mt-4 text-theme-text-secondary">Noch keine Charaktere in dieser Welt</p>
			{#if data.user && $currentWorld}
				<a
					href="/worlds/{$currentWorld.slug}/characters/new"
					class="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-theme-primary-600 hover:text-violet-500 dark:hover:text-violet-300"
				>
					Erstelle den ersten Charakter
				</a>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each nodes as node}
				<NodeCard {node} href="/worlds/{$currentWorld?.slug}/characters/{node.slug}" />
			{/each}
		</div>
	{/if}
</div>
