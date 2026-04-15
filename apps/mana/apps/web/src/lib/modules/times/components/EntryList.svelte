<script lang="ts">
	import { _ } from 'svelte-i18n';
	import EntryItem from './EntryItem.svelte';
	import {
		groupEntriesByDate,
		getTotalDuration,
		formatDurationCompact,
	} from '$lib/modules/times/queries';
	import type { TimeEntry } from '$lib/modules/times/types';
	import { Clock } from '@mana/shared-icons';

	let { entries }: { entries: TimeEntry[] } = $props();

	let expandedEntryId = $state<string | null>(null);

	let groupedEntries = $derived(() => {
		const groups = groupEntriesByDate(entries);
		// Sort dates descending (newest first)
		return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
	});

	function formatDateHeader(dateStr: string): string {
		const today = new Date().toISOString().split('T')[0];
		const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

		if (dateStr === today) return $_('entry.today');
		if (dateStr === yesterday) return 'Gestern';

		return new Date(dateStr + 'T00:00:00').toLocaleDateString('de-DE', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
		});
	}
</script>

{#if entries.length === 0}
	<div
		class="rounded-xl border border-dashed border-[hsl(var(--color-border))] p-8 text-center text-[hsl(var(--color-muted-foreground))]"
	>
		<Clock size={20} class="mx-auto mb-3 opacity-50" />
		<p>{$_('entry.noEntries')}</p>
	</div>
{:else}
	<div class="space-y-6">
		{#each groupedEntries() as [date, dayEntries]}
			<div>
				<!-- Day Header -->
				<div class="mb-2 flex items-center justify-between">
					<h3 class="text-sm font-medium text-[hsl(var(--color-muted-foreground))]">
						{formatDateHeader(date)}
					</h3>
					<span class="duration-display text-sm font-medium text-[hsl(var(--color-foreground))]">
						{formatDurationCompact(getTotalDuration(dayEntries))}
					</span>
				</div>

				<!-- Entries for this day -->
				<div class="space-y-2">
					{#each dayEntries as entry (entry.id)}
						<EntryItem
							{entry}
							isExpanded={expandedEntryId === entry.id}
							onExpand={() => (expandedEntryId = entry.id)}
							onCollapse={() => (expandedEntryId = null)}
						/>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{/if}
