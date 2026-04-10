<script lang="ts">
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { projectTable } from '$lib/modules/times/collections';
	import { getTotalDuration, formatDurationCompact } from '$lib/modules/times/queries';
	import type { Project, Client, TimeEntry } from '$lib/modules/times/types';
	import { PROJECT_COLORS } from '$lib/modules/times/types';
	import { ConfirmationModal } from '@mana/shared-ui';
	import { CaretRight } from '@mana/shared-icons';

	const allProjects = getContext<{ value: Project[] }>('projects');
	const allClients = getContext<{ value: Client[] }>('clients');
	const allTimeEntries = getContext<{ value: TimeEntry[] }>('timeEntries');

	let showCreateForm = $state(false);
	let editingProjectId = $state<string | null>(null);
	let showArchived = $state(false);
	let deleteConfirmId = $state<string | null>(null);

	// New project form
	let newName = $state('');
	let newClientId = $state('');
	let newColor = $state(PROJECT_COLORS[0]);
	let newIsBillable = $state(true);
	let newDescription = $state('');

	let activeProjects = $derived(
		allProjects.value.filter((p) => !p.isArchived).sort((a, b) => a.order - b.order)
	);
	let archivedProjects = $derived(
		allProjects.value.filter((p) => p.isArchived).sort((a, b) => a.order - b.order)
	);

	function getProjectHours(projectId: string): number {
		const entries = allTimeEntries.value.filter((e) => e.projectId === projectId && !e.isRunning);
		return getTotalDuration(entries);
	}

	function getBudgetPercent(project: Project): number | null {
		if (!project.budget || project.budget.type !== 'hours') return null;
		const hoursLogged = getProjectHours(project.id) / 3600;
		return Math.min(100, Math.round((hoursLogged / project.budget.amount) * 100));
	}

	async function handleCreate() {
		if (!newName.trim()) return;
		const client = newClientId ? allClients.value.find((c) => c.id === newClientId) : null;
		await projectTable.add({
			id: crypto.randomUUID(),
			clientId: newClientId || null,
			name: newName.trim(),
			description: newDescription || null,
			color: newColor,
			isArchived: false,
			isBillable: newIsBillable,
			billingRate: client?.billingRate ?? null,
			budget: null,
			visibility: 'private',
			guildId: null,
			order: activeProjects.length,
		});
		newName = '';
		newClientId = '';
		newDescription = '';
		newColor = PROJECT_COLORS[0];
		newIsBillable = true;
		showCreateForm = false;
	}

	async function handleArchive(id: string, archive: boolean) {
		await projectTable.update(id, { isArchived: archive });
	}

	function handleDelete(id: string) {
		deleteConfirmId = id;
	}

	async function confirmDelete() {
		if (!deleteConfirmId) return;
		await projectTable.delete(deleteConfirmId);
		editingProjectId = null;
		deleteConfirmId = null;
	}

	// Inline edit state
	let editName = $state('');
	let editClientId = $state('');
	let editColor = $state('');
	let editIsBillable = $state(false);
	let editDescription = $state('');

	function startEditing(project: Project) {
		editingProjectId = project.id;
		editName = project.name;
		editClientId = project.clientId ?? '';
		editColor = project.color;
		editIsBillable = project.isBillable;
		editDescription = project.description ?? '';
	}

	let editDebounce: ReturnType<typeof setTimeout> | null = null;
	function autoSaveProject(updates: Record<string, unknown>) {
		if (!editingProjectId) return;
		if (editDebounce) clearTimeout(editDebounce);
		const id = editingProjectId;
		editDebounce = setTimeout(() => {
			projectTable.update(id, updates);
		}, 500);
	}
</script>

<svelte:head>
	<title>{$_('nav.projects')} | Times</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">{$_('nav.projects')}</h1>
		<button
			onclick={() => (showCreateForm = !showCreateForm)}
			class="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))]"
		>
			+ {$_('project.create')}
		</button>
	</div>

	<!-- Create Form -->
	{#if showCreateForm}
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleCreate();
			}}
			class="rounded-xl border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--card))] p-4 space-y-3"
		>
			<input
				type="text"
				bind:value={newName}
				placeholder={$_('project.name')}
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
			/>
			<div class="flex gap-2">
				<select
					bind:value={newClientId}
					class="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
				>
					<option value="">{$_('project.internal')}</option>
					{#each allClients.value.filter((c) => !c.isArchived) as client}
						<option value={client.id}>{client.name}</option>
					{/each}
				</select>
				<label
					class="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-sm"
				>
					<input
						type="checkbox"
						bind:checked={newIsBillable}
						class="accent-[hsl(var(--primary))]"
					/>
					{$_('project.billable')}
				</label>
			</div>
			<!-- Color Picker -->
			<div class="flex flex-wrap gap-2">
				{#each PROJECT_COLORS as color}
					<!-- svelte-ignore a11y_consider_explicit_label -->
					<button
						type="button"
						onclick={() => (newColor = color)}
						class="h-6 w-6 rounded-full border-2 transition-transform {newColor === color
							? 'scale-125 border-white'
							: 'border-transparent'}"
						style="background-color: {color}"
					></button>
				{/each}
			</div>
			<div class="flex gap-2">
				<button
					type="button"
					onclick={() => (showCreateForm = false)}
					class="flex-1 rounded-lg border border-[hsl(var(--border))] py-2 text-sm text-[hsl(var(--muted-foreground))]"
					>{$_('common.cancel')}</button
				>
				<button
					type="submit"
					class="flex-1 rounded-lg bg-[hsl(var(--primary))] py-2 text-sm font-medium text-[hsl(var(--primary-foreground))]"
					>{$_('common.create')}</button
				>
			</div>
		</form>
	{/if}

	<!-- Active Projects -->
	{#if activeProjects.length === 0 && !showCreateForm}
		<div
			class="rounded-xl border border-dashed border-[hsl(var(--border))] p-8 text-center text-[hsl(var(--muted-foreground))]"
		>
			<p>{$_('project.noProjects')}</p>
		</div>
	{:else}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each activeProjects as project (project.id)}
				{@const client = project.clientId
					? allClients.value.find((c) => c.id === project.clientId)
					: undefined}
				{@const hours = getProjectHours(project.id)}
				{@const budgetPct = getBudgetPercent(project)}
				<div
					class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden"
				>
					<!-- Color bar -->
					<div class="h-1" style="background-color: {project.color}"></div>

					{#if editingProjectId === project.id}
						<!-- Editing -->
						<div class="p-4 space-y-3">
							<input
								type="text"
								value={editName}
								oninput={(e) => {
									editName = (e.target as HTMLInputElement).value;
									autoSaveProject({ name: editName });
								}}
								class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none"
							/>
							<select
								value={editClientId}
								onchange={(e) => {
									editClientId = (e.target as HTMLSelectElement).value;
									autoSaveProject({ clientId: editClientId || null });
								}}
								class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm"
							>
								<option value="">{$_('project.internal')}</option>
								{#each allClients.value.filter((c) => !c.isArchived) as c}
									<option value={c.id}>{c.name}</option>
								{/each}
							</select>
							<div class="flex flex-wrap gap-1.5">
								{#each PROJECT_COLORS as color}
									<!-- svelte-ignore a11y_consider_explicit_label -->
									<button
										type="button"
										onclick={() => {
											editColor = color;
											autoSaveProject({ color });
										}}
										class="h-5 w-5 rounded-full border-2 {editColor === color
											? 'border-white scale-110'
											: 'border-transparent'}"
										style="background-color: {color}"
									></button>
								{/each}
							</div>
							<div class="flex items-center justify-between">
								<label class="flex items-center gap-2 text-xs">
									<input
										type="checkbox"
										checked={editIsBillable}
										onchange={() => {
											editIsBillable = !editIsBillable;
											autoSaveProject({ isBillable: editIsBillable });
										}}
										class="accent-[hsl(var(--primary))]"
									/>
									{$_('project.billable')}
								</label>
								<div class="flex gap-2">
									<button
										onclick={() => handleArchive(project.id, true)}
										class="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
										>{$_('common.archive')}</button
									>
									<button onclick={() => handleDelete(project.id)} class="text-xs text-red-500"
										>{$_('common.delete')}</button
									>
									<button
										onclick={() => (editingProjectId = null)}
										class="text-xs text-[hsl(var(--primary))]">{$_('common.close')}</button
									>
								</div>
							</div>
						</div>
					{:else}
						<!-- Display -->
						<button class="w-full p-4 text-left" onclick={() => startEditing(project)}>
							<div class="flex items-start justify-between">
								<div>
									<p class="font-medium text-[hsl(var(--foreground))]">{project.name}</p>
									<p class="text-xs text-[hsl(var(--muted-foreground))]">
										{client?.name || $_('project.internal')}
										{#if project.isBillable}
											· {$_('project.billable')}
										{/if}
									</p>
								</div>
								<span class="duration-display text-sm font-medium text-[hsl(var(--foreground))]">
									{formatDurationCompact(hours)}
								</span>
							</div>
							{#if budgetPct !== null}
								<div class="mt-3">
									<div
										class="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]"
									>
										<span>{$_('project.budget')}</span>
										<span>{budgetPct}%</span>
									</div>
									<div class="mt-1 h-1.5 rounded-full bg-[hsl(var(--muted))]">
										<div
											class="h-full rounded-full transition-all {budgetPct > 90
												? 'bg-red-500'
												: budgetPct > 75
													? 'bg-amber-500'
													: 'bg-[hsl(var(--primary))]'}"
											style="width: {budgetPct}%"
										></div>
									</div>
								</div>
							{/if}
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- Archived Projects -->
	{#if archivedProjects.length > 0}
		<div>
			<button
				onclick={() => (showArchived = !showArchived)}
				class="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]"
			>
				<CaretRight size={20} class="transition-transform {showArchived ? 'rotate-90' : ''}" />
				{$_('project.archived')} ({archivedProjects.length})
			</button>

			{#if showArchived}
				<div class="mt-3 space-y-2">
					{#each archivedProjects as project}
						<div
							class="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 opacity-60"
						>
							<div class="flex items-center gap-2">
								<div class="h-3 w-3 rounded-full" style="background-color: {project.color}"></div>
								<span class="text-sm text-[hsl(var(--foreground))]">{project.name}</span>
							</div>
							<button
								onclick={() => handleArchive(project.id, false)}
								class="text-xs text-[hsl(var(--primary))]">{$_('common.unarchive')}</button
							>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<ConfirmationModal
	visible={deleteConfirmId !== null}
	title={$_('common.delete')}
	message={$_('project.deleteConfirm')}
	onConfirm={confirmDelete}
	onClose={() => (deleteConfirmId = null)}
/>
