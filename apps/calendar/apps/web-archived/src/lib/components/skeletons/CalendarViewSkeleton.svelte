<script lang="ts">
	/**
	 * CalendarViewSkeleton - Skeleton for the main calendar week view
	 * Shows a week grid with time slots and placeholder events
	 */

	import { SkeletonBox } from '@manacore/shared-ui';

	// 7 days of the week
	const days = Array(7);
	// Show hours from 8 to 18 (working hours)
	const hours = Array(10);
</script>

<div class="calendar-skeleton" role="status" aria-label="Kalender wird geladen...">
	<!-- Header with day names -->
	<div class="calendar-header">
		<!-- Time column spacer -->
		<div class="time-spacer"></div>

		<!-- Day headers -->
		{#each days as _, dayIndex}
			<div class="day-header" style="opacity: {Math.max(0.5, 1 - dayIndex * 0.05)}">
				<SkeletonBox width="32px" height="14px" borderRadius="4px" />
				<SkeletonBox width="28px" height="28px" borderRadius="50%" />
			</div>
		{/each}
	</div>

	<!-- Calendar grid -->
	<div class="calendar-grid">
		<!-- Time column -->
		<div class="time-column">
			{#each hours as _, hourIndex}
				<div class="time-slot" style="opacity: {Math.max(0.4, 1 - hourIndex * 0.05)}">
					<SkeletonBox width="36px" height="12px" borderRadius="4px" />
				</div>
			{/each}
		</div>

		<!-- Day columns -->
		{#each days as _, dayIndex}
			<div class="day-column" style="opacity: {Math.max(0.6, 1 - dayIndex * 0.04)}">
				{#each hours as _, hourIndex}
					<div class="hour-cell"></div>
				{/each}

				<!-- Placeholder events -->
				{#if dayIndex === 1}
					<div class="event-placeholder" style="top: 10%; height: 15%;">
						<SkeletonBox width="100%" height="100%" borderRadius="6px" />
					</div>
				{/if}
				{#if dayIndex === 2}
					<div class="event-placeholder" style="top: 30%; height: 10%;">
						<SkeletonBox width="100%" height="100%" borderRadius="6px" />
					</div>
				{/if}
				{#if dayIndex === 3}
					<div class="event-placeholder" style="top: 50%; height: 20%;">
						<SkeletonBox width="100%" height="100%" borderRadius="6px" />
					</div>
				{/if}
				{#if dayIndex === 4}
					<div class="event-placeholder" style="top: 20%; height: 8%;">
						<SkeletonBox width="100%" height="100%" borderRadius="6px" />
					</div>
					<div class="event-placeholder" style="top: 60%; height: 12%;">
						<SkeletonBox width="100%" height="100%" borderRadius="6px" />
					</div>
				{/if}
				{#if dayIndex === 5}
					<div class="event-placeholder" style="top: 40%; height: 15%;">
						<SkeletonBox width="100%" height="100%" borderRadius="6px" />
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.calendar-skeleton {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 600px;
		overflow: hidden;
	}

	.calendar-header {
		display: flex;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
		padding: 0.75rem 0;
	}

	.time-spacer {
		width: 60px;
		flex-shrink: 0;
	}

	.day-header {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem;
	}

	.calendar-grid {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.time-column {
		width: 60px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
	}

	.time-slot {
		height: 60px;
		display: flex;
		align-items: flex-start;
		justify-content: flex-end;
		padding-right: 0.5rem;
		padding-top: 0.25rem;
	}

	.day-column {
		flex: 1;
		position: relative;
		border-left: 1px solid hsl(var(--color-border) / 0.3);
	}

	.hour-cell {
		height: 60px;
		border-bottom: 1px solid hsl(var(--color-border) / 0.2);
	}

	.event-placeholder {
		position: absolute;
		left: 4px;
		right: 4px;
	}
</style>
