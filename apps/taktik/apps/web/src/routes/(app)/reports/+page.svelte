<script lang="ts">
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import type { TimeEntry, Project, Client } from '@taktik/shared';
	import { exportEntriesToCSV } from '$lib/utils/export';
	import {
		getTotalDuration,
		getBillableDuration,
		formatDurationCompact,
		formatDurationDecimal,
		groupEntriesByProject,
		getEntriesByDateRange,
	} from '$lib/data/queries';

	const allTimeEntries = getContext<{ value: TimeEntry[] }>('timeEntries');
	const allProjects = getContext<{ value: Project[] }>('projects');
	const allClients = getContext<{ value: Client[] }>('clients');

	let period = $state<'week' | 'month'>('week');

	let dateRange = $derived(() => {
		const now = new Date();
		const today = now.toISOString().split('T')[0];
		const daysBack = period === 'week' ? 7 : 30;
		const from = new Date(now.getTime() - daysBack * 86400000).toISOString().split('T')[0];
		return { from, to: today, days: daysBack };
	});

	let entries = $derived(() => {
		const range = dateRange();
		return allTimeEntries.value.filter(
			(e) => !e.isRunning && e.date >= range.from && e.date <= range.to
		);
	});

	let totalDuration = $derived(getTotalDuration(entries()));
	let billableDuration = $derived(getBillableDuration(entries()));
	let nonBillableDuration = $derived(totalDuration - billableDuration);
	let entryCount = $derived(entries().length);
	let avgPerDay = $derived(dateRange().days > 0 ? totalDuration / dateRange().days : 0);

	// Hours by project
	let projectBreakdown = $derived(() => {
		const groups = groupEntriesByProject(entries());
		const result: { projectId: string; name: string; color: string; duration: number }[] = [];
		for (const [projectId, projectEntries] of groups) {
			const project = allProjects.value.find((p) => p.id === projectId);
			result.push({
				projectId,
				name: project?.name || $_('project.internal'),
				color: project?.color || '#9ca3af',
				duration: getTotalDuration(projectEntries),
			});
		}
		return result.sort((a, b) => b.duration - a.duration);
	});

	let maxProjectDuration = $derived(
		Math.max(...(projectBreakdown().map((p) => p.duration) || [1]))
	);

	// Hours by day (last 7 days for week, grouped by week for month)
	let dailyBreakdown = $derived(() => {
		const days: { date: string; label: string; duration: number }[] = [];
		const range = dateRange();
		const numDays = period === 'week' ? 7 : 30;
		for (let i = numDays - 1; i >= 0; i--) {
			const d = new Date(Date.now() - i * 86400000);
			const dateStr = d.toISOString().split('T')[0];
			const dayEntries = entries().filter((e) => e.date === dateStr);
			days.push({
				date: dateStr,
				label: d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' }),
				duration: getTotalDuration(dayEntries),
			});
		}
		return days;
	});

	let maxDailyDuration = $derived(Math.max(...(dailyBreakdown().map((d) => d.duration) || [1])));
</script>

<svelte:head>
	<title>{$_('nav.reports')} | Taktik</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">{$_('nav.reports')}</h1>
		<div class="flex items-center gap-2">
			<div class="flex gap-1">
				{#each ['week', 'month'] as p}
					<button
						onclick={() => (period = p as any)}
						class="rounded-lg px-3 py-1.5 text-sm transition-colors {period === p
							? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
							: 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent)/0.1)]'}"
					>
						{p === 'week' ? $_('entry.thisWeek') : $_('entry.thisMonth')}
					</button>
				{/each}
			</div>
			<button
				onclick={() => exportEntriesToCSV(entries(), allProjects.value, allClients.value)}
				class="rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
			>
				CSV Export
			</button>
		</div>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
			<p class="text-xs text-[hsl(var(--muted-foreground))]">{$_('report.totalHours')}</p>
			<p class="duration-display mt-1 text-2xl font-bold text-[hsl(var(--foreground))]">
				{formatDurationDecimal(totalDuration)}h
			</p>
		</div>
		<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
			<p class="text-xs text-[hsl(var(--muted-foreground))]">{$_('report.billableHours')}</p>
			<p class="duration-display mt-1 text-2xl font-bold text-[hsl(var(--primary))]">
				{formatDurationDecimal(billableDuration)}h
			</p>
		</div>
		<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
			<p class="text-xs text-[hsl(var(--muted-foreground))]">{$_('report.avgPerDay')}</p>
			<p class="duration-display mt-1 text-2xl font-bold text-[hsl(var(--foreground))]">
				{formatDurationCompact(Math.round(avgPerDay))}
			</p>
		</div>
		<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
			<p class="text-xs text-[hsl(var(--muted-foreground))]">{$_('nav.entries')}</p>
			<p class="mt-1 text-2xl font-bold text-[hsl(var(--foreground))]">{entryCount}</p>
		</div>
	</div>

	<!-- Billable Breakdown -->
	{#if totalDuration > 0}
		<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
			<h3 class="mb-3 text-sm font-medium text-[hsl(var(--foreground))]">
				{$_('entry.billable')} vs. {$_('entry.notBillable')}
			</h3>
			<div class="flex h-4 overflow-hidden rounded-full">
				<div
					class="bg-[hsl(var(--primary))] transition-all"
					style="width: {(billableDuration / totalDuration) * 100}%"
				></div>
				<div
					class="bg-[hsl(var(--muted))] transition-all"
					style="width: {(nonBillableDuration / totalDuration) * 100}%"
				></div>
			</div>
			<div class="mt-2 flex justify-between text-xs text-[hsl(var(--muted-foreground))]">
				<span>{$_('entry.billable')}: {formatDurationCompact(billableDuration)}</span>
				<span>{$_('entry.notBillable')}: {formatDurationCompact(nonBillableDuration)}</span>
			</div>
		</div>
	{/if}

	<!-- Hours by Project -->
	{#if projectBreakdown().length > 0}
		<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
			<h3 class="mb-3 text-sm font-medium text-[hsl(var(--foreground))]">
				{$_('report.byProject')}
			</h3>
			<div class="space-y-3">
				{#each projectBreakdown() as item}
					<div>
						<div class="flex items-center justify-between text-sm">
							<div class="flex items-center gap-2">
								<div class="h-3 w-3 rounded-full" style="background-color: {item.color}"></div>
								<span class="text-[hsl(var(--foreground))]">{item.name}</span>
							</div>
							<span class="duration-display text-[hsl(var(--muted-foreground))]">
								{formatDurationCompact(item.duration)}
							</span>
						</div>
						<div class="mt-1 h-2 rounded-full bg-[hsl(var(--muted))]">
							<div
								class="h-full rounded-full transition-all"
								style="width: {(item.duration / maxProjectDuration) *
									100}%; background-color: {item.color}"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Daily Hours -->
	{#if period === 'week' && dailyBreakdown().length > 0}
		<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
			<h3 class="mb-3 text-sm font-medium text-[hsl(var(--foreground))]">{$_('report.byDay')}</h3>
			<div class="flex items-end gap-2" style="height: 120px;">
				{#each dailyBreakdown() as day}
					<div class="flex flex-1 flex-col items-center gap-1">
						<div class="w-full flex flex-col justify-end" style="height: 100px;">
							<div
								class="w-full rounded-t bg-[hsl(var(--primary))] transition-all"
								style="height: {maxDailyDuration > 0
									? (day.duration / maxDailyDuration) * 100
									: 0}%"
								title={formatDurationCompact(day.duration)}
							></div>
						</div>
						<span class="text-[10px] text-[hsl(var(--muted-foreground))]">{day.label}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
