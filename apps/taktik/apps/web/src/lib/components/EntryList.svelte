<script lang="ts">
	import { _ } from 'svelte-i18n';
	import EntryItem from './EntryItem.svelte';
	import { groupEntriesByDate, getTotalDuration, formatDurationCompact } from '$lib/data/queries';
	import type { TimeEntry } from '@taktik/shared';

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
		class="rounded-xl border border-dashed border-[hsl(var(--border))] p-8 text-center text-[hsl(var(--muted-foreground))]"
	>
		<svg
			class="mx-auto mb-3 h-10 w-10 opacity-50"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="1.5"
				d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
		<p>{$_('entry.noEntries')}</p>
	</div>
{:else}
	<div class="space-y-6">
		{#each groupedEntries() as [date, dayEntries]}
			<div>
				<!-- Day Header -->
				<div class="mb-2 flex items-center justify-between">
					<h3 class="text-sm font-medium text-[hsl(var(--muted-foreground))]">
						{formatDateHeader(date)}
					</h3>
					<span class="duration-display text-sm font-medium text-[hsl(var(--foreground))]">
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
