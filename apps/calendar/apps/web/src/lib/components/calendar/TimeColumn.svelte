<script lang="ts">
	/**
	 * TimeColumn Component
	 * Renders the time labels column for calendar views (WeekView, DayView, MultiDayView)
	 */

	interface Props {
		hours: number[];
		formatHour: (hour: number) => string;
	}

	let { hours, formatHour }: Props = $props();
</script>

<div class="time-column">
	{#each hours as hour}
		<div class="time-label">
			{formatHour(hour)}
		</div>
	{/each}
</div>

<style>
	.time-column {
		width: 48px;
		flex-shrink: 0;
		border-right: 1px solid hsl(var(--color-border));
		position: relative;
	}

	.time-label {
		height: var(--hour-height, 60px);
		display: flex;
		align-items: flex-start;
		justify-content: flex-end;
		padding-right: 8px;
		padding-top: 0;
		font-size: 0.7rem;
		color: hsl(var(--color-muted-foreground));
		transform: translateY(-0.4em);
	}
</style>
