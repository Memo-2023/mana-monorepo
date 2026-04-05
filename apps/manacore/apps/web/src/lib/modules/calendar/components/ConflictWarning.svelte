<!--
  ConflictWarning — shows overlapping timeBlocks for a given time range.
  Used inline in EventForm, QuickEventPopover, and TaskSchedule.
-->
<script lang="ts">
	import { db } from '$lib/data/database';
	import type { LocalTimeBlock } from '$lib/data/time-blocks/types';
	import { toTimeBlock, findOverlaps } from '$lib/data/time-blocks/queries';
	import type { TimeBlock } from '$lib/data/time-blocks/types';
	import { Warning } from '@manacore/shared-icons';
	import { format } from 'date-fns';

	let {
		startDate,
		endDate,
		excludeBlockId,
	}: {
		startDate: string;
		endDate: string;
		excludeBlockId?: string;
	} = $props();

	let conflicts = $state<TimeBlock[]>([]);

	$effect(() => {
		if (!startDate || !endDate) {
			conflicts = [];
			return;
		}

		// Check for overlaps
		const dayStart = startDate.split('T')[0] + 'T00:00:00';
		const dayEnd = startDate.split('T')[0] + 'T23:59:59';

		db.table<LocalTimeBlock>('timeBlocks')
			.where('startDate')
			.between(dayStart, dayEnd, true, true)
			.toArray()
			.then((locals) => {
				const blocks = locals.filter((b) => !b.deletedAt).map(toTimeBlock);
				conflicts = findOverlaps(blocks, startDate, endDate, excludeBlockId);
			});
	});
</script>

{#if conflicts.length > 0}
	<div class="conflict-warning">
		<Warning size={14} class="warning-icon" />
		<div class="conflict-content">
			<span class="conflict-label">
				{conflicts.length === 1 ? 'Zeitkonflikt' : `${conflicts.length} Konflikte`}
			</span>
			{#each conflicts.slice(0, 2) as conflict}
				<span class="conflict-item">
					{conflict.title}
					({format(new Date(conflict.startDate), 'HH:mm')}–{conflict.endDate
						? format(new Date(conflict.endDate), 'HH:mm')
						: '...'})
				</span>
			{/each}
			{#if conflicts.length > 2}
				<span class="conflict-more">+{conflicts.length - 2} weitere</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.conflict-warning {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-warning, 38 92% 50%) / 0.1);
		border: 1px solid hsl(var(--color-warning, 38 92% 50%) / 0.3);
		font-size: 0.75rem;
		color: hsl(var(--color-warning, 38 92% 50%));
	}

	.conflict-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.conflict-label {
		font-weight: 600;
	}

	.conflict-item {
		opacity: 0.85;
	}

	.conflict-more {
		opacity: 0.65;
		font-style: italic;
	}
</style>
