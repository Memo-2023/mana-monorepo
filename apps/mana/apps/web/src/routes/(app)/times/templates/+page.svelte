<script lang="ts">
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { templateTable } from '$lib/modules/times/collections';
	import { timerStore } from '$lib/modules/times/stores/timer.svelte';
	import { X } from '@mana/shared-icons';
	import type { EntryTemplate, Project, Client } from '$lib/modules/times/types';

	const allTemplates = getContext<{ value: EntryTemplate[] }>('templates');
	const allProjects = getContext<{ value: Project[] }>('projects');
	const allClients = getContext<{ value: Client[] }>('clients');

	let showCreateForm = $state(false);
	let newName = $state('');
	let newDescription = $state('');
	let newProjectId = $state('');
	let newIsBillable = $state(false);

	let sortedTemplates = $derived(
		[...allTemplates.value].sort((a, b) => b.usageCount - a.usageCount)
	);

	async function handleCreate() {
		if (!newName.trim()) return;
		await templateTable.add({
			id: crypto.randomUUID(),
			name: newName.trim(),
			projectId: newProjectId || null,
			clientId: newProjectId
				? (allProjects.value.find((p) => p.id === newProjectId)?.clientId ?? null)
				: null,
			description: newDescription,
			isBillable: newIsBillable,
			tags: [],
			usageCount: 0,
			lastUsedAt: null,
		});
		newName = '';
		newDescription = '';
		newProjectId = '';
		newIsBillable = false;
		showCreateForm = false;
	}

	async function useTemplate(template: EntryTemplate) {
		// Update usage stats
		await templateTable.update(template.id, {
			usageCount: template.usageCount + 1,
			lastUsedAt: new Date().toISOString(),
		});

		// Start timer with template data
		await timerStore.start({
			projectId: template.projectId ?? undefined,
			clientId: template.clientId ?? undefined,
			description: template.description,
			isBillable: template.isBillable,
			tags: template.tags,
		});
	}

	async function deleteTemplate(id: string) {
		await templateTable.delete(id);
	}
</script>

<svelte:head>
	<title>{$_('nav.templates')} | Times</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">{$_('nav.templates')}</h1>
		<button
			onclick={() => (showCreateForm = !showCreateForm)}
			class="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))]"
		>
			+ {$_('template.create')}
		</button>
	</div>

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
				placeholder="Vorlagenname"
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none"
			/>
			<input
				type="text"
				bind:value={newDescription}
				placeholder={$_('entry.description')}
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))]"
			/>
			<div class="flex gap-2">
				<select
					bind:value={newProjectId}
					class="flex-1 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
				>
					<option value="">{$_('project.internal')}</option>
					{#each allProjects.value.filter((p) => !p.isArchived) as proj}
						<option value={proj.id}>{proj.name}</option>
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
					{$_('entry.billable')}
				</label>
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

	{#if sortedTemplates.length === 0 && !showCreateForm}
		<div
			class="rounded-xl border border-dashed border-[hsl(var(--border))] p-8 text-center text-[hsl(var(--muted-foreground))]"
		>
			<p>{$_('template.noTemplates')}</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each sortedTemplates as template (template.id)}
				{@const project = template.projectId
					? allProjects.value.find((p) => p.id === template.projectId)
					: undefined}
				<div
					class="flex items-center gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3"
				>
					{#if project}
						<div
							class="h-3 w-3 shrink-0 rounded-full"
							style="background-color: {project.color}"
						></div>
					{:else}
						<div class="h-3 w-3 shrink-0 rounded-full bg-gray-400"></div>
					{/if}
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium text-[hsl(var(--foreground))]">{template.name}</p>
						<p class="text-xs text-[hsl(var(--muted-foreground))]">
							{template.description || $_('timer.noDescription')}
							{#if project}
								· {project.name}{/if}
							{#if template.isBillable}
								· ${/if}
							{#if template.usageCount > 0}
								· {template.usageCount}x{/if}
						</p>
					</div>
					<button
						onclick={() => useTemplate(template)}
						disabled={timerStore.isRunning}
						class="rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--primary-foreground))] disabled:opacity-50"
					>
						{$_('timer.start')}
					</button>
					<button
						onclick={() => deleteTemplate(template.id)}
						class="rounded-lg p-1.5 text-[hsl(var(--muted-foreground))] hover:text-red-500"
					>
						<X size={16} />
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>
