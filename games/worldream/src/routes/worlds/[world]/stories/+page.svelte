<script lang="ts">
	import type { ContentNode } from '$lib/types/content';
	import { goto } from '$app/navigation';
	import { currentWorld } from '$lib/stores/worldContext';
	import NodeCard from '$lib/components/NodeCard.svelte';

	let { data } = $props();

	let nodes = $state<ContentNode[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadStories() {
		if (!$currentWorld) {
			error = 'Keine Welt ausgewählt';
			loading = false;
			return;
		}

		try {
			const response = await fetch(`/api/nodes?kind=story&world_slug=${$currentWorld.slug}`);
			if (!response.ok) throw new Error('Failed to load stories');
			nodes = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadStories();
	});
</script>

<div class="space-y-6">
	<div class="sm:flex sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-theme-text-primary">Stories</h1>
			<p class="mt-1 text-sm text-theme-text-secondary">
				Geschichten in {$currentWorld?.title || 'dieser Welt'}
			</p>
		</div>
		{#if data.user && $currentWorld}
			<div class="mt-4 sm:mt-0">
				<a
					href="/worlds/{$currentWorld.slug}/stories/new"
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
					Neue Story
				</a>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="py-12 text-center">
			<div
				class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600 dark:border-violet-400"
			></div>
			<p class="mt-4 text-theme-text-secondary">Lade Stories...</p>
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
					d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
				/>
			</svg>
			<p class="mt-4 text-theme-text-secondary">Noch keine Stories in dieser Welt</p>
			{#if data.user && $currentWorld}
				<a
					href="/worlds/{$currentWorld.slug}/stories/new"
					class="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-theme-primary-600 hover:text-violet-500 dark:hover:text-violet-300"
				>
					Erstelle die erste Story
				</a>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each nodes as node}
				<NodeCard {node} href="/worlds/{$currentWorld?.slug}/stories/{node.slug}" />
			{/each}
		</div>
	{/if}
</div>
