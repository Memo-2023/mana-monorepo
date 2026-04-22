<script lang="ts">
	import { page } from '$app/stores';
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { projectTable } from '$lib/modules/times/collections';
	import {
		getTotalDuration,
		getBillableDuration,
		formatDurationCompact,
		formatDurationDecimal,
	} from '$lib/modules/times/queries';
	import { CaretLeft } from '@mana/shared-icons';
	import EntryList from '$lib/modules/times/components/EntryList.svelte';
	import type { Project, Client, TimeEntry } from '$lib/modules/times/types';
	import { PROJECT_COLORS } from '$lib/modules/times/types';

	const allProjects = getContext<{ value: Project[] }>('projects');
	const allClients = getContext<{ value: Client[] }>('clients');
	const allTimeEntries = getContext<{ value: TimeEntry[] }>('timeEntries');

	let projectId = $derived($page.params.id);

	let project = $derived(allProjects.value.find((p) => p.id === projectId));
	let client = $derived(
		project?.clientId ? allClients.value.find((c) => c.id === project!.clientId) : undefined
	);
	let projectEntries = $derived(
		allTimeEntries.value
			.filter((e) => e.projectId === projectId && !e.isRunning)
			.sort((a, b) => b.date.localeCompare(a.date))
	);

	let totalDuration = $derived(getTotalDuration(projectEntries));
	let billableDuration = $derived(getBillableDuration(projectEntries));

	let budgetPercent = $derived(() => {
		if (!project?.budget || project.budget.type !== 'hours') return null;
		const hoursLogged = totalDuration / 3600;
		return Math.min(100, Math.round((hoursLogged / project.budget.amount) * 100));
	});

	let budgetHoursUsed = $derived(totalDuration / 3600);
	let budgetHoursTotal = $derived(project?.budget?.type === 'hours' ? project.budget.amount : null);

	// Edit state
	let isEditing = $state(false);
	let editName = $state('');
	let editDescription = $state('');
	let editClientId = $state('');
	let editColor = $state('');
	let editIsBillable = $state(false);
	let editBudgetHours = $state(0);
	let editRateAmount = $state(0);

	function startEditing() {
		if (!project) return;
		isEditing = true;
		editName = project.name;
		editDescription = project.description ?? '';
		editClientId = project.clientId ?? '';
		editColor = project.color;
		editIsBillable = project.isBillable;
		editBudgetHours = project.budget?.type === 'hours' ? project.budget.amount : 0;
		editRateAmount = project.billingRate?.amount ?? 0;
	}

	let debounce: ReturnType<typeof setTimeout> | null = null;
	function save(updates: Record<string, unknown>) {
		const id = projectId;
		if (!id) return;
		if (debounce) clearTimeout(debounce);
		debounce = setTimeout(() => {
			projectTable.update(id, updates);
		}, 500);
	}

	async function handleArchive() {
		const id = projectId;
		if (!project || !id) return;
		await projectTable.update(id, { isArchived: !project.isArchived });
	}
</script>

<svelte:head>
	<title>{project?.name || 'Projekt'} | Times</title>
</svelte:head>

{#if !project}
	<div class="flex flex-col items-center justify-center py-20">
		<p class="text-[hsl(var(--color-muted-foreground))]">Projekt nicht gefunden.</p>
		<a href="/times/projects" class="mt-4 text-sm text-[hsl(var(--color-primary))]"
			>{$_('common.back')}</a
		>
	</div>
{:else}
	<div class="space-y-6">
		<!-- Back + Header -->
		<div>
			<a
				href="/times/projects"
				class="mb-3 inline-flex items-center gap-1 text-sm text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
			>
				<CaretLeft size={16} />
				{$_('nav.projects')}
			</a>

			<div class="flex items-start justify-between">
				<div class="flex items-center gap-3">
					<div class="h-4 w-4 rounded-full" style="background-color: {project.color}"></div>
					<div>
						<h1 class="text-2xl font-bold text-[hsl(var(--color-foreground))]">{project.name}</h1>
						<p class="text-sm text-[hsl(var(--color-muted-foreground))]">
							{client?.name || $_('project.internal')}
							{#if project.isBillable}
								<span
									class="ml-2 rounded bg-[hsl(var(--color-primary)/0.1)] px-1.5 py-0.5 text-xs text-[hsl(var(--color-primary))]"
								>
									{$_('project.billable')}
								</span>
							{/if}
							{#if project.isArchived}
								<span
									class="ml-2 rounded bg-[hsl(var(--color-muted))] px-1.5 py-0.5 text-xs text-[hsl(var(--color-muted-foreground))]"
								>
									{$_('project.archived')}
								</span>
							{/if}
						</p>
					</div>
				</div>
				<div class="flex gap-2">
					<button
						onclick={() => (isEditing ? (isEditing = false) : startEditing())}
						class="rounded-lg border border-[hsl(var(--color-border))] px-3 py-1.5 text-sm text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
					>
						{isEditing ? $_('common.close') : $_('common.edit')}
					</button>
					<button
						onclick={handleArchive}
						class="rounded-lg border border-[hsl(var(--color-border))] px-3 py-1.5 text-sm text-[hsl(var(--color-muted-foreground))]"
					>
						{project.isArchived ? $_('common.unarchive') : $_('common.archive')}
					</button>
				</div>
			</div>
		</div>

		<!-- Edit Form -->
		{#if isEditing}
			<div
				class="rounded-xl border border-[hsl(var(--color-primary)/0.3)] bg-[hsl(var(--color-card))] p-4 space-y-3"
			>
				<input
					type="text"
					value={editName}
					oninput={(e) => {
						editName = (e.target as HTMLInputElement).value;
						save({ name: editName });
					}}
					placeholder={$_('project.name')}
					class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] focus:outline-none"
				/>
				<input
					type="text"
					value={editDescription}
					oninput={(e) => {
						editDescription = (e.target as HTMLInputElement).value;
						save({ description: editDescription || null });
					}}
					placeholder={$_('project.description')}
					class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))]"
				/>
				<div class="flex gap-2">
					<select
						value={editClientId}
						onchange={(e) => {
							editClientId = (e.target as HTMLSelectElement).value;
							save({ clientId: editClientId || null });
						}}
						class="flex-1 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-sm"
					>
						<option value="">{$_('project.internal')}</option>
						{#each allClients.value.filter((c) => !c.isArchived) as c}
							<option value={c.id}>{c.name}</option>
						{/each}
					</select>
					<label
						class="flex items-center gap-2 rounded-lg border border-[hsl(var(--color-border))] px-3 py-2 text-sm"
					>
						<input
							type="checkbox"
							checked={editIsBillable}
							onchange={() => {
								editIsBillable = !editIsBillable;
								save({ isBillable: editIsBillable });
							}}
							class="accent-[hsl(var(--color-primary))]"
						/>
						{$_('project.billable')}
					</label>
				</div>
				<div class="flex gap-2">
					<div class="flex items-center gap-1">
						<label
							for="times-project-budget"
							class="text-xs text-[hsl(var(--color-muted-foreground))]"
							>{$_('project.budget')} (h):</label
						>
						<input
							id="times-project-budget"
							type="number"
							value={editBudgetHours}
							min="0"
							oninput={(e) => {
								editBudgetHours = parseInt((e.target as HTMLInputElement).value) || 0;
								save({
									budget: editBudgetHours > 0 ? { type: 'hours', amount: editBudgetHours } : null,
								});
							}}
							class="w-20 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-center text-sm"
						/>
					</div>
					<div class="flex items-center gap-1">
						<label
							for="times-project-rate"
							class="text-xs text-[hsl(var(--color-muted-foreground))]">Rate:</label
						>
						<input
							id="times-project-rate"
							type="number"
							value={editRateAmount}
							min="0"
							step="5"
							oninput={(e) => {
								editRateAmount = parseInt((e.target as HTMLInputElement).value) || 0;
								save({
									billingRate:
										editRateAmount > 0
											? { amount: editRateAmount, currency: 'EUR', per: 'hour' }
											: null,
								});
							}}
							class="w-20 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-center text-sm"
						/>
						<span class="text-xs text-[hsl(var(--color-muted-foreground))]">/h</span>
					</div>
				</div>
				<div class="flex flex-wrap gap-1.5">
					{#each PROJECT_COLORS as color}
						<button
							type="button"
							aria-label="Farbe wählen"
							onclick={() => {
								editColor = color;
								save({ color });
							}}
							class="h-5 w-5 rounded-full border-2 {editColor === color
								? 'border-white scale-110'
								: 'border-transparent'}"
							style="background-color: {color}"
						></button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Stats -->
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			<div
				class="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4"
			>
				<p class="text-xs text-[hsl(var(--color-muted-foreground))]">{$_('report.totalHours')}</p>
				<p class="duration-display mt-1 text-xl font-bold text-[hsl(var(--color-foreground))]">
					{formatDurationDecimal(totalDuration)}h
				</p>
			</div>
			<div
				class="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4"
			>
				<p class="text-xs text-[hsl(var(--color-muted-foreground))]">
					{$_('report.billableHours')}
				</p>
				<p class="duration-display mt-1 text-xl font-bold text-[hsl(var(--color-primary))]">
					{formatDurationDecimal(billableDuration)}h
				</p>
			</div>
			{#if budgetHoursTotal}
				<div
					class="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4"
				>
					<p class="text-xs text-[hsl(var(--color-muted-foreground))]">{$_('project.budget')}</p>
					<p class="duration-display mt-1 text-xl font-bold text-[hsl(var(--color-foreground))]">
						{budgetHoursUsed.toFixed(1)} / {budgetHoursTotal}h
					</p>
				</div>
			{/if}
			<div
				class="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4"
			>
				<p class="text-xs text-[hsl(var(--color-muted-foreground))]">{$_('nav.entries')}</p>
				<p class="mt-1 text-xl font-bold text-[hsl(var(--color-foreground))]">
					{projectEntries.length}
				</p>
			</div>
		</div>

		<!-- Budget Progress -->
		{#if budgetPercent() !== null}
			<div
				class="rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4"
			>
				<div class="flex items-center justify-between text-sm">
					<span class="text-[hsl(var(--color-muted-foreground))]">{$_('project.budget')}</span>
					<span class="font-medium text-[hsl(var(--color-foreground))]">{budgetPercent()}%</span>
				</div>
				<div class="mt-2 h-2.5 rounded-full bg-[hsl(var(--color-muted))]">
					<div
						class="h-full rounded-full transition-[width] {budgetPercent()! > 90
							? 'bg-red-500'
							: budgetPercent()! > 75
								? 'bg-amber-500'
								: 'bg-[hsl(var(--color-primary))]'}"
						style="width: {budgetPercent()}%"
					></div>
				</div>
				{#if project.billingRate}
					<p class="mt-2 text-xs text-[hsl(var(--color-muted-foreground))]">
						{project.billingRate.amount}
						{project.billingRate.currency}/h · Wert: {(
							(billableDuration / 3600) *
							project.billingRate.amount
						).toFixed(0)}
						{project.billingRate.currency}
					</p>
				{/if}
			</div>
		{/if}

		<!-- Entries -->
		<div>
			<h2 class="mb-3 text-sm font-medium text-[hsl(var(--color-muted-foreground))]">
				{$_('nav.entries')} ({formatDurationCompact(totalDuration)})
			</h2>
			<EntryList entries={projectEntries} />
		</div>
	</div>
{/if}
