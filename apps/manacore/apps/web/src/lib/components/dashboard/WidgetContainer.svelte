<script lang="ts">
	/**
	 * WidgetContainer - Wrapper component for dashboard widgets
	 *
	 * Provides edit mode controls (drag handle, resize, remove) and
	 * renders the appropriate widget component based on type.
	 */

	import { _ } from 'svelte-i18n';
	import { Card } from '@manacore/shared-ui';
	import { DotsSixVertical, Trash } from '@manacore/shared-icons';
	import type { WidgetConfig, WidgetSize } from '$lib/types/dashboard';
	import { getWidgetMeta } from '$lib/types/dashboard';
	import { dashboardStore } from '$lib/stores/dashboard.svelte';
	import { ManaCoreEvents } from '@manacore/shared-utils/analytics';

	import { widgetComponents } from './widget-registry';

	interface Props {
		widget: WidgetConfig;
	}

	let { widget }: Props = $props();

	const meta = $derived(getWidgetMeta(widget.type));

	const sizes: WidgetSize[] = ['small', 'medium', 'large', 'full'];
	const sizeLabels: Record<WidgetSize, string> = {
		small: 'S',
		medium: 'M',
		large: 'L',
		full: 'XL',
	};

	function handleSizeChange(size: WidgetSize) {
		dashboardStore.updateWidgetSize(widget.id, size);
		ManaCoreEvents.widgetResized(widget.type, size);
	}

	function handleRemove() {
		ManaCoreEvents.widgetRemoved(widget.type);
		dashboardStore.removeWidget(widget.id);
	}

	const WidgetComponent = $derived(widgetComponents[widget.type]);
</script>

<Card class="relative h-full">
	<!-- Edit Mode Overlay -->
	{#if dashboardStore.isEditing}
		<div
			class="absolute inset-0 z-10 flex flex-col rounded-xl border-2 border-dashed border-primary/50 bg-background/80"
		>
			<!-- Drag Handle -->
			<div
				class="flex cursor-grab items-center justify-center gap-2 border-b border-border py-2 active:cursor-grabbing"
			>
				<DotsSixVertical size={20} class="text-muted-foreground" />
				<span class="text-sm font-medium">{meta?.icon} {$_(widget.title)}</span>
			</div>

			<!-- Size Buttons -->
			<div class="flex flex-1 items-center justify-center gap-2 p-4">
				{#each sizes as size}
					<button
						type="button"
						onclick={() => handleSizeChange(size)}
						class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors {widget.size ===
						size
							? 'bg-primary text-primary-foreground'
							: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
					>
						{sizeLabels[size]}
					</button>
				{/each}
			</div>

			<!-- Remove Button -->
			<div class="flex justify-center border-t border-border py-2">
				<button
					type="button"
					onclick={handleRemove}
					class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
				>
					<Trash size={16} />
					{$_('dashboard.remove_widget')}
				</button>
			</div>
		</div>
	{/if}

	<!-- Widget Content -->
	<div class="min-h-[10rem] p-4" class:opacity-0={dashboardStore.isEditing}>
		{#if WidgetComponent}
			<WidgetComponent />
		{:else}
			<p class="text-muted-foreground">Unknown widget type: {widget.type}</p>
		{/if}
	</div>
</Card>
