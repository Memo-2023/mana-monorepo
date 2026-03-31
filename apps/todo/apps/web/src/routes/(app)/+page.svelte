<script lang="ts">
	import { getContext } from 'svelte';
	import type { LocalBoardView } from '$lib/data/local-store';
	import { BoardViewRenderer } from '$lib/components/board-views';
	import { todoSettings } from '$lib/stores/settings.svelte';

	// Get active view from layout context
	const activeViewCtx: { readonly value: LocalBoardView | null } = getContext('activeView');

	// Map layout mode to BoardViewRenderer layoutOverride
	const LAYOUT_MAP = {
		fokus: 'fokus',
		uebersicht: 'kanban',
		matrix: 'grid',
	} as const;

	let layoutOverride = $derived(LAYOUT_MAP[todoSettings.activeLayoutMode]);
	let activeView = $derived(activeViewCtx.value);
	let pageTitle = $derived(activeView?.name ?? 'Aufgaben');
</script>

<svelte:head>
	<title>{pageTitle} - Todo</title>
</svelte:head>

<div class="board-page">
	{#if activeView}
		<BoardViewRenderer view={activeView} {layoutOverride} />
	{:else}
		<div class="empty-state">
			<p class="text-muted-foreground">Views werden geladen...</p>
		</div>
	{/if}
</div>

<style>
	.board-page {
		height: calc(100vh - 140px);
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}
</style>
