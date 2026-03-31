<script lang="ts">
	import { page } from '$app/stores';
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { clientCollection } from '$lib/data/local-store';
	import {
		getTotalDuration,
		getBillableDuration,
		formatDurationCompact,
		formatDurationDecimal,
	} from '$lib/data/queries';
	import { CaretLeft } from '@manacore/shared-icons';
	import EntryList from '$lib/components/EntryList.svelte';
	import type { Project, Client, TimeEntry } from '@times/shared';

	const allClients = getContext<{ value: Client[] }>('clients');
	const allProjects = getContext<{ value: Project[] }>('projects');
	const allTimeEntries = getContext<{ value: TimeEntry[] }>('timeEntries');

	let clientId = $derived($page.params.id);

	let client = $derived(allClients.value.find((c) => c.id === clientId));
	let clientProjects = $derived(
		allProjects.value.filter((p) => p.clientId === clientId).sort((a, b) => a.order - b.order)
	);
	let clientEntries = $derived(
		allTimeEntries.value
			.filter((e) => e.clientId === clientId && !e.isRunning)
			.sort((a, b) => b.date.localeCompare(a.date))
	);

	let totalDuration = $derived(getTotalDuration(clientEntries));
	let billableDuration = $derived(getBillableDuration(clientEntries));

	function getProjectHours(projectId: string): number {
		return getTotalDuration(clientEntries.filter((e) => e.projectId === projectId));
	}

	let billingValue = $derived(() => {
		if (!client?.billingRate) return null;
		return (billableDuration / 3600) * client.billingRate.amount;
	});
</script>

<svelte:head>
	<title>{client?.name || 'Kunde'} | Times</title>
</svelte:head>

{#if !client}
	<div class="flex flex-col items-center justify-center py-20">
		<p class="text-[hsl(var(--muted-foreground))]">Kunde nicht gefunden.</p>
		<a href="/clients" class="mt-4 text-sm text-[hsl(var(--primary))]">{$_('common.back')}</a>
	</div>
{:else}
	<div class="space-y-6">
		<!-- Back + Header -->
		<div>
			<a
				href="/clients"
				class="mb-3 inline-flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
			>
				<CaretLeft size={16} />
				{$_('nav.clients')}
			</a>

			<div class="flex items-center gap-4">
				<div
					class="flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold text-white"
					style="background-color: {client.color}"
				>
					{client.shortCode || client.name.charAt(0).toUpperCase()}
				</div>
				<div>
					<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">{client.name}</h1>
					<p class="text-sm text-[hsl(var(--muted-foreground))]">
						{#if client.shortCode}{client.shortCode} ·
						{/if}
						{#if client.email}{client.email} ·
						{/if}
						{#if client.billingRate}
							{client.billingRate.amount} {client.billingRate.currency}/h
						{/if}
					</p>
				</div>
			</div>
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
				<p class="text-xs text-[hsl(var(--muted-foreground))]">{$_('report.totalHours')}</p>
				<p class="duration-display mt-1 text-xl font-bold text-[hsl(var(--foreground))]">
					{formatDurationDecimal(totalDuration)}h
				</p>
			</div>
			<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
				<p class="text-xs text-[hsl(var(--muted-foreground))]">{$_('report.billableHours')}</p>
				<p class="duration-display mt-1 text-xl font-bold text-[hsl(var(--primary))]">
					{formatDurationDecimal(billableDuration)}h
				</p>
			</div>
			<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
				<p class="text-xs text-[hsl(var(--muted-foreground))]">{$_('nav.projects')}</p>
				<p class="mt-1 text-xl font-bold text-[hsl(var(--foreground))]">{clientProjects.length}</p>
			</div>
			{#if billingValue() !== null}
				<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
					<p class="text-xs text-[hsl(var(--muted-foreground))]">Wert</p>
					<p class="mt-1 text-xl font-bold text-[hsl(var(--primary))]">
						{billingValue()!.toFixed(0)}
						{client.billingRate!.currency}
					</p>
				</div>
			{/if}
		</div>

		<!-- Projects -->
		{#if clientProjects.length > 0}
			<div>
				<h2 class="mb-3 text-sm font-medium text-[hsl(var(--muted-foreground))]">
					{$_('nav.projects')}
				</h2>
				<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{#each clientProjects as proj}
						{@const hours = getProjectHours(proj.id)}
						<a
							href="/projects/{proj.id}"
							class="entry-item flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
						>
							<div class="h-3 w-3 rounded-full" style="background-color: {proj.color}"></div>
							<div class="min-w-0 flex-1">
								<p class="text-sm font-medium text-[hsl(var(--foreground))]">{proj.name}</p>
								{#if proj.isBillable}
									<span class="text-xs text-[hsl(var(--primary))]">{$_('project.billable')}</span>
								{/if}
							</div>
							<span class="duration-display text-sm font-medium text-[hsl(var(--foreground))]">
								{formatDurationCompact(hours)}
							</span>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Entries -->
		<div>
			<h2 class="mb-3 text-sm font-medium text-[hsl(var(--muted-foreground))]">
				{$_('nav.entries')} ({formatDurationCompact(totalDuration)})
			</h2>
			<EntryList entries={clientEntries} />
		</div>
	</div>
{/if}
