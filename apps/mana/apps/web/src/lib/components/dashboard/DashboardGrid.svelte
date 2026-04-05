<script lang="ts">
	/**
	 * DashboardGrid - Main grid component with drag-and-drop support
	 *
	 * Uses svelte-dnd-action for drag-and-drop functionality.
	 */

	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import type { WidgetConfig } from '$lib/types/dashboard';
	import { WIDGET_SIZE_CLASSES } from '$lib/types/dashboard';
	import { dashboardStore } from '$lib/stores/dashboard.svelte';
	import WidgetContainer from './WidgetContainer.svelte';

	const flipDurationMs = 300;

	// Local copy of widgets for DnD
	let items = $state<WidgetConfig[]>([]);

	// Sync with store
	$effect(() => {
		items = [...dashboardStore.widgets];
	});

	function handleConsider(e: CustomEvent<DndEvent<WidgetConfig>>) {
		items = e.detail.items;
	}

	function handleFinalize(e: CustomEvent<DndEvent<WidgetConfig>>) {
		items = e.detail.items;
		dashboardStore.updateWidgets(items);
		dashboardStore.persist();
	}
</script>

<div
	class="grid auto-rows-fr grid-cols-12 gap-5"
	use:dndzone={{
		items,
		flipDurationMs,
		dragDisabled: !dashboardStore.isEditing,
		dropTargetStyle: {},
	}}
	onconsider={handleConsider}
	onfinalize={handleFinalize}
>
	{#each items as widget (widget.id)}
		<div class={WIDGET_SIZE_CLASSES[widget.size]} animate:flip={{ duration: flipDurationMs }}>
			<svelte:boundary>
				<WidgetContainer {widget} />
				{#snippet failed(error, reset)}
					<div
						class="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/30 dark:bg-red-950/20"
					>
						<div class="mb-2 text-2xl">⚠️</div>
						<p class="mb-1 text-sm font-medium text-red-700 dark:text-red-400">
							{widget.id} fehlgeschlagen
						</p>
						<p class="mb-3 text-xs text-red-500 dark:text-red-500/70">
							{error?.message || 'Unbekannter Fehler'}
						</p>
						<button
							type="button"
							onclick={reset}
							class="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
						>
							Erneut versuchen
						</button>
					</div>
				{/snippet}
			</svelte:boundary>
		</div>
	{/each}
</div>

{#if items.length === 0}
	<div class="flex flex-col items-center justify-center py-16 text-center">
		<div class="mb-4 text-5xl">📊</div>
		<h3 class="mb-2 text-lg font-medium">Keine Widgets</h3>
		<p class="text-muted-foreground">Klicke auf "Anpassen" um Widgets hinzuzufügen.</p>
	</div>
{/if}
