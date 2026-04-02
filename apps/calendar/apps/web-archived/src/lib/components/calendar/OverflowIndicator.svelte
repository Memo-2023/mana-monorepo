<script lang="ts">
	/**
	 * OverflowIndicator Component
	 * Shows colored lines indicating events outside the visible time range
	 */

	import type { CalendarEvent } from '@calendar/shared';

	interface OverflowEvent {
		event: CalendarEvent;
		color: string;
		tooltip: string;
	}

	interface Props {
		events: OverflowEvent[];
		position: 'top' | 'bottom';
		label?: string;
	}

	let { events, position, label }: Props = $props();
</script>

{#if events.length > 0}
	<div class="overflow-indicator {position}" title={label}>
		{#each events as { color, tooltip }}
			<div class="overflow-line" style="background-color: {color}" title={tooltip}></div>
		{/each}
	</div>
{/if}

<style>
	.overflow-indicator {
		position: absolute;
		left: 0;
		right: 0;
		display: flex;
		gap: 2px;
		padding: 2px 4px;
		z-index: 5;
	}

	.overflow-indicator.top {
		top: 0;
	}

	.overflow-indicator.bottom {
		bottom: 0;
	}

	.overflow-line {
		flex: 1;
		height: 3px;
		border-radius: 1px;
		opacity: 0.8;
	}
</style>
