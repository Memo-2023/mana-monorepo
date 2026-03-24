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
	class="grid grid-cols-12 gap-4"
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
			<WidgetContainer {widget} />
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
