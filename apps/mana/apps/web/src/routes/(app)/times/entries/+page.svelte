<script lang="ts">
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import type { TimeEntry } from '$lib/modules/times/types';
	import {
		getFilteredEntries,
		getSortedEntries,
		getTotalDuration,
		getBillableDuration,
		formatDurationCompact,
	} from '$lib/modules/times/queries';
	import { viewStore } from '$lib/modules/times/stores/view.svelte';
	import EntryList from '$lib/modules/times/components/EntryList.svelte';
	import EntryForm from '$lib/modules/times/components/EntryForm.svelte';

	const allTimeEntries = getContext<{ value: TimeEntry[] }>('timeEntries');

	let showEntryForm = $state(false);
	let dateFilter = $state<'week' | 'month' | 'all'>('week');

	let dateRange = $derived(() => {
		const now = new Date();
		const today = now.toISOString().split('T')[0];

		if (dateFilter === 'week') {
			const weekAgo = new Date(now.getTime() - 7 * 86400000);
			return { from: weekAgo.toISOString().split('T')[0], to: today };
		}
		if (dateFilter === 'month') {
			const monthAgo = new Date(now.getTime() - 30 * 86400000);
			return { from: monthAgo.toISOString().split('T')[0], to: today };
		}
		return { from: '', to: '' };
	});

	let filteredEntries = $derived(() => {
		const range = dateRange();
		let entries = allTimeEntries.value.filter((e) => !e.isRunning);

		// Apply date range
		if (range.from) {
			entries = entries.filter((e) => e.date >= range.from);
		}
		if (range.to) {
			entries = entries.filter((e) => e.date <= range.to);
		}

		// Apply view filters
		entries = getFilteredEntries(entries, viewStore.activeFilters);

		return getSortedEntries(entries, viewStore.sort);
	});

	let totalDuration = $derived(getTotalDuration(filteredEntries()));
	let billableDuration = $derived(getBillableDuration(filteredEntries()));
</script>

<svelte:head>
	<title>{$_('nav.entries')} | Times</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-[hsl(var(--color-foreground))]">{$_('nav.entries')}</h1>
		<button
			onclick={() => (showEntryForm = true)}
			class="rounded-lg bg-[hsl(var(--color-primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--color-primary-foreground))] transition-colors hover:opacity-90"
		>
			+ {$_('entry.manual')}
		</button>
	</div>

	<!-- Filters -->
	<div class="flex items-center gap-2">
		{#each ['week', 'month', 'all'] as period}
			<button
				onclick={() => (dateFilter = period as any)}
				class="rounded-lg px-3 py-1.5 text-sm transition-colors {dateFilter === period
					? 'bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))]'
					: 'text-[hsl(var(--color-muted-foreground))] hover:bg-[hsl(var(--color-accent)/0.1)]'}"
			>
				{period === 'week'
					? $_('entry.thisWeek')
					: period === 'month'
						? $_('entry.thisMonth')
						: 'Alle'}
			</button>
		{/each}

		<!-- Totals -->
		<div class="ml-auto flex items-center gap-4 text-sm">
			<span class="text-[hsl(var(--color-muted-foreground))]">
				{$_('common.total')}:
				<span class="duration-display font-medium text-[hsl(var(--color-foreground))]"
					>{formatDurationCompact(totalDuration)}</span
				>
			</span>
			<span class="text-[hsl(var(--color-muted-foreground))]">
				{$_('entry.billable')}:
				<span class="duration-display font-medium text-[hsl(var(--color-primary))]"
					>{formatDurationCompact(billableDuration)}</span
				>
			</span>
		</div>
	</div>

	<!-- Entry List -->
	<EntryList entries={filteredEntries()} />
</div>

<!-- Manual Entry Form -->
<EntryForm visible={showEntryForm} onClose={() => (showEntryForm = false)} />
