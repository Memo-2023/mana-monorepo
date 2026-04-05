<script lang="ts">
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import type { TimeEntry } from '$lib/modules/times/types';
	import {
		getEntriesByDate,
		getTotalDuration,
		getBillableDuration,
		formatDurationCompact,
	} from '$lib/modules/times/queries';
	import TimerCard from '$lib/modules/times/components/TimerCard.svelte';
	import EntryList from '$lib/modules/times/components/EntryList.svelte';
	import EntryForm from '$lib/modules/times/components/EntryForm.svelte';
	import QuickStart from '$lib/modules/times/components/QuickStart.svelte';
	import KeyboardShortcuts from '$lib/modules/times/components/KeyboardShortcuts.svelte';

	const allTimeEntries = getContext<{ value: TimeEntry[] }>('timeEntries');

	const today = new Date().toISOString().split('T')[0];

	let todayEntries = $derived(
		getEntriesByDate(allTimeEntries.value, today).filter((e) => !e.isRunning)
	);
	let todayTotal = $derived(getTotalDuration(todayEntries));
	let todayBillable = $derived(getBillableDuration(todayEntries));

	let showEntryForm = $state(false);
</script>

<svelte:head>
	<title>Timer | Times</title>
</svelte:head>

<div class="space-y-6">
	<!-- Timer Card -->
	<TimerCard />

	<!-- Today's Summary -->
	<div class="flex gap-4">
		<div class="flex-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
			<p class="text-xs text-[hsl(var(--muted-foreground))]">{$_('common.total')}</p>
			<p class="duration-display text-2xl font-bold text-[hsl(var(--foreground))]">
				{formatDurationCompact(todayTotal)}
			</p>
		</div>
		<div class="flex-1 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
			<p class="text-xs text-[hsl(var(--muted-foreground))]">{$_('entry.billable')}</p>
			<p class="duration-display text-2xl font-bold text-[hsl(var(--primary))]">
				{formatDurationCompact(todayBillable)}
			</p>
		</div>
	</div>

	<!-- Quick Start -->
	<QuickStart />

	<!-- Today's Entries -->
	<div>
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-sm font-medium text-[hsl(var(--muted-foreground))]">
				{$_('entry.today')} ({formatDurationCompact(todayTotal)})
			</h2>
			<button
				onclick={() => (showEntryForm = true)}
				class="rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] transition-colors hover:border-[hsl(var(--primary)/0.5)] hover:text-[hsl(var(--foreground))]"
			>
				+ {$_('entry.manual')}
			</button>
		</div>

		<EntryList entries={todayEntries} />
	</div>
</div>

<!-- Manual Entry Form -->
<EntryForm visible={showEntryForm} onClose={() => (showEntryForm = false)} />
<KeyboardShortcuts onNewEntry={() => (showEntryForm = true)} />
