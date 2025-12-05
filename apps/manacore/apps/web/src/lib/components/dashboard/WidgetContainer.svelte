<script lang="ts">
	/**
	 * WidgetContainer - Wrapper component for dashboard widgets
	 *
	 * Provides edit mode controls (drag handle, resize, remove) and
	 * renders the appropriate widget component based on type.
	 */

	import { _ } from 'svelte-i18n';
	import { Card } from '@manacore/shared-ui';
	import type { WidgetConfig, WidgetSize } from '$lib/types/dashboard';
	import { WIDGET_SIZE_CLASSES, getWidgetMeta } from '$lib/types/dashboard';
	import { dashboardStore } from '$lib/stores/dashboard.svelte';

	// Widget components
	import CreditsWidget from './widgets/CreditsWidget.svelte';
	import QuickActionsWidget from './widgets/QuickActionsWidget.svelte';
	import TransactionsWidget from './widgets/TransactionsWidget.svelte';
	import TasksTodayWidget from './widgets/TasksTodayWidget.svelte';
	import TasksUpcomingWidget from './widgets/TasksUpcomingWidget.svelte';
	import CalendarEventsWidget from './widgets/CalendarEventsWidget.svelte';
	import ChatRecentWidget from './widgets/ChatRecentWidget.svelte';
	import ContactsFavoritesWidget from './widgets/ContactsFavoritesWidget.svelte';
	import ZitareQuoteWidget from './widgets/ZitareQuoteWidget.svelte';
	import PictureRecentWidget from './widgets/PictureRecentWidget.svelte';
	import ManadeckProgressWidget from './widgets/ManadeckProgressWidget.svelte';
	import ClockTimersWidget from './widgets/ClockTimersWidget.svelte';

	interface Props {
		widget: WidgetConfig;
	}

	let { widget }: Props = $props();

	const meta = $derived(getWidgetMeta(widget.type));
	const sizeClasses = $derived(WIDGET_SIZE_CLASSES[widget.size]);

	const sizes: WidgetSize[] = ['small', 'medium', 'large', 'full'];
	const sizeLabels: Record<WidgetSize, string> = {
		small: 'S',
		medium: 'M',
		large: 'L',
		full: 'XL',
	};

	function handleSizeChange(size: WidgetSize) {
		dashboardStore.updateWidgetSize(widget.id, size);
	}

	function handleRemove() {
		dashboardStore.removeWidget(widget.id);
	}

	// Widget component mapping
	const widgetComponents = {
		credits: CreditsWidget,
		'quick-actions': QuickActionsWidget,
		transactions: TransactionsWidget,
		'tasks-today': TasksTodayWidget,
		'tasks-upcoming': TasksUpcomingWidget,
		'calendar-events': CalendarEventsWidget,
		'chat-recent': ChatRecentWidget,
		'contacts-favorites': ContactsFavoritesWidget,
		'zitare-quote': ZitareQuoteWidget,
		'picture-recent': PictureRecentWidget,
		'manadeck-progress': ManadeckProgressWidget,
		'clock-timers': ClockTimersWidget,
	} as const;

	const WidgetComponent = $derived(widgetComponents[widget.type]);
</script>

<div class={sizeClasses}>
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
					<svg class="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
						<circle cx="9" cy="5" r="1.5" />
						<circle cx="15" cy="5" r="1.5" />
						<circle cx="9" cy="12" r="1.5" />
						<circle cx="15" cy="12" r="1.5" />
						<circle cx="9" cy="19" r="1.5" />
						<circle cx="15" cy="19" r="1.5" />
					</svg>
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
						<svg
							class="h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M3 6h18" />
							<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
							<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
						</svg>
						{$_('dashboard.remove_widget')}
					</button>
				</div>
			</div>
		{/if}

		<!-- Widget Content -->
		<div class="p-4" class:opacity-0={dashboardStore.isEditing}>
			{#if WidgetComponent}
				<WidgetComponent />
			{:else}
				<p class="text-muted-foreground">Unknown widget type: {widget.type}</p>
			{/if}
		</div>
	</Card>
</div>
