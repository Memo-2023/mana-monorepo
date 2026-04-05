<!--
  DayTimeline — shows all habit logs for a given date as a timeline.
-->
<script lang="ts">
	import type { Habit, HabitLog } from '../types';
	import { formatTime } from '../queries';
	import { DynamicIcon } from '@mana/shared-ui/atoms';

	let {
		logs,
		habits,
		date,
	}: {
		logs: HabitLog[];
		habits: Habit[];
		date: string;
	} = $props();

	let habitMap = $derived(new Map(habits.map((h) => [h.id, h])));

	let dateLogs = $derived(
		logs
			.filter((l) => l.timestamp.startsWith(date))
			.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
	);

	function formatDateLabel(d: string): string {
		const today = new Date().toISOString().split('T')[0];
		const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
		if (d === today) return 'Heute';
		if (d === yesterday) return 'Gestern';
		return new Date(d).toLocaleDateString('de-DE', {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
		});
	}
</script>

{#if dateLogs.length > 0}
	<div class="day-timeline">
		<div class="day-label">{formatDateLabel(date)}</div>
		<div class="timeline-entries">
			{#each dateLogs as log (log.id)}
				{@const habit = habitMap.get(log.habitId)}
				{#if habit}
					<div class="timeline-entry">
						<div class="entry-dot" style:background={habit.color}></div>
						<span class="entry-icon" style:color={habit.color}>
							<DynamicIcon name={habit.icon} size={16} weight="regular" />
						</span>
						<span class="entry-title">{habit.title}</span>
						<span class="entry-time">{formatTime(log.timestamp)}</span>
						{#if log.note}
							<span class="entry-note">{log.note}</span>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/if}

<style>
	.day-timeline {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.day-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted-foreground);
		padding: 0 0.25rem;
	}

	.timeline-entries {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.timeline-entry {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		font-size: 0.875rem;
	}

	.entry-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.entry-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.entry-title {
		color: var(--color-foreground);
		font-weight: 500;
	}

	.entry-time {
		margin-left: auto;
		color: var(--color-muted-foreground);
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
	}

	.entry-note {
		color: var(--color-muted-foreground);
		font-size: 0.8125rem;
		font-style: italic;
	}
</style>
