<script lang="ts">
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { timeEntryTable } from '$lib/modules/times/collections';
	import { formatDurationCompact } from '$lib/modules/times/queries';
	import { CurrencyDollar } from '@mana/shared-icons';
	import type { TimeEntry, Project, Client, LocalTimeEntry } from '$lib/modules/times/types';
	import { ConfirmationModal } from '@mana/shared-ui';

	let {
		entry,
		isExpanded = false,
		onExpand,
		onCollapse,
	}: {
		entry: TimeEntry;
		isExpanded?: boolean;
		onExpand?: () => void;
		onCollapse?: () => void;
	} = $props();

	const allProjects = getContext<{ value: Project[] }>('projects');
	const allClients = getContext<{ value: Client[] }>('clients');

	let editDescription = $state(entry.description);
	let editProjectId = $state(entry.projectId ?? '');
	let editIsBillable = $state(entry.isBillable);
	let editDurationMinutes = $state(Math.round(entry.duration / 60));

	// Sync when entry changes
	$effect(() => {
		editDescription = entry.description;
		editProjectId = entry.projectId ?? '';
		editIsBillable = entry.isBillable;
		editDurationMinutes = Math.round(entry.duration / 60);
	});

	let project = $derived(
		entry.projectId ? allProjects.value.find((p) => p.id === entry.projectId) : undefined
	);
	let client = $derived(
		entry.clientId ? allClients.value.find((c) => c.id === entry.clientId) : undefined
	);

	let showDeleteConfirm = $state(false);

	let saveDebounce: ReturnType<typeof setTimeout> | null = null;

	function autoSave(updates: Partial<LocalTimeEntry>) {
		if (saveDebounce) clearTimeout(saveDebounce);
		saveDebounce = setTimeout(async () => {
			await timeEntryTable.update(entry.id, updates);
		}, 500);
	}

	function handleDescriptionChange(value: string) {
		editDescription = value;
		autoSave({ description: value });
	}

	function handleProjectChange(projectId: string) {
		editProjectId = projectId;
		const proj = allProjects.value.find((p) => p.id === projectId);
		autoSave({
			projectId: projectId || null,
			clientId: proj?.clientId ?? null,
		});
	}

	function handleBillableToggle() {
		editIsBillable = !editIsBillable;
		autoSave({ isBillable: editIsBillable });
	}

	function handleDurationChange(minutes: number) {
		editDurationMinutes = minutes;
		autoSave({ duration: minutes * 60 });
	}

	async function handleDelete() {
		showDeleteConfirm = true;
	}

	async function confirmDelete() {
		await timeEntryTable.delete(entry.id);
		showDeleteConfirm = false;
		onCollapse?.();
	}

	let startTimeStr = $derived(
		entry.startTime
			? new Date(entry.startTime).toLocaleTimeString('de-DE', {
					hour: '2-digit',
					minute: '2-digit',
				})
			: ''
	);
	let endTimeStr = $derived(
		entry.endTime
			? new Date(entry.endTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
			: ''
	);
</script>

<div
	class="entry-item rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] transition-all {isExpanded
		? 'ring-1 ring-[hsl(var(--color-primary)/0.3)]'
		: ''}"
>
	<!-- Compact row (always visible) -->
	<button
		class="flex w-full items-center gap-3 px-4 py-3 text-left"
		onclick={() => (isExpanded ? onCollapse?.() : onExpand?.())}
	>
		{#if project}
			<div class="project-dot" style="background-color: {project.color}"></div>
		{:else}
			<div class="project-dot" style="background-color: hsl(var(--color-muted-foreground))"></div>
		{/if}
		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium text-[hsl(var(--color-foreground))]">
				{entry.description || $_('timer.noDescription')}
			</p>
			<p class="text-xs text-[hsl(var(--color-muted-foreground))]">
				{project?.name || $_('project.internal')}
				{#if client}· {client.name}{/if}
				{#if startTimeStr && endTimeStr}
					· {startTimeStr} – {endTimeStr}
				{/if}
			</p>
		</div>
		<div class="text-right shrink-0">
			<p class="duration-display text-sm font-medium text-[hsl(var(--color-foreground))]">
				{formatDurationCompact(entry.duration)}
			</p>
			{#if entry.isBillable}
				<span class="text-xs text-[hsl(var(--color-primary))]">$</span>
			{/if}
		</div>
	</button>

	<!-- Expanded edit form -->
	{#if isExpanded}
		<div class="border-t border-[hsl(var(--color-border))] px-4 py-3 space-y-3">
			<!-- Description -->
			<input
				type="text"
				value={editDescription}
				oninput={(e) => handleDescriptionChange((e.target as HTMLInputElement).value)}
				placeholder={$_('entry.description')}
				class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] focus:border-[hsl(var(--color-primary))] focus:outline-none"
			/>

			<!-- Project + Duration row -->
			<div class="flex gap-2">
				<select
					value={editProjectId}
					onchange={(e) => handleProjectChange((e.target as HTMLSelectElement).value)}
					class="flex-1 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))]"
				>
					<option value="">{$_('project.internal')}</option>
					{#each allProjects.value.filter((p) => !p.isArchived) as proj}
						<option value={proj.id}>{proj.name}</option>
					{/each}
				</select>

				<div class="flex items-center gap-1">
					<input
						type="number"
						value={editDurationMinutes}
						oninput={(e) =>
							handleDurationChange(parseInt((e.target as HTMLInputElement).value) || 0)}
						min="0"
						class="w-20 rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-3 py-2 text-center text-sm text-[hsl(var(--color-foreground))]"
					/>
					<span class="text-xs text-[hsl(var(--color-muted-foreground))]">min</span>
				</div>
			</div>

			<!-- Billable + Delete row -->
			<div class="flex items-center justify-between">
				<button
					onclick={handleBillableToggle}
					class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors {editIsBillable
						? 'bg-[hsl(var(--color-primary)/0.1)] text-[hsl(var(--color-primary))]'
						: 'text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]'}"
				>
					<CurrencyDollar size={14} />
					{editIsBillable ? $_('entry.billable') : $_('entry.notBillable')}
				</button>

				<button
					onclick={handleDelete}
					class="rounded-lg px-3 py-1.5 text-xs text-[hsl(var(--color-error))] transition-colors hover:bg-[hsl(var(--color-error)/0.1)]"
				>
					{$_('common.delete')}
				</button>
			</div>
		</div>
	{/if}
</div>

<ConfirmationModal
	visible={showDeleteConfirm}
	title={$_('common.delete')}
	message={$_('entry.deleteConfirm')}
	onConfirm={confirmDelete}
	onClose={() => (showDeleteConfirm = false)}
/>
