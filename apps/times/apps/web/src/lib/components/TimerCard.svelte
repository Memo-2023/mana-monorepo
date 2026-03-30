<script lang="ts">
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { timerStore } from '$lib/stores/timer.svelte';
	import { formatDuration } from '$lib/data/queries';
	import type { Project, Client } from '@times/shared';

	const allProjects = getContext<{ value: Project[] }>('projects');
	const allClients = getContext<{ value: Client[] }>('clients');

	let description = $state('');
	let selectedProjectId = $state<string | null>(null);
	let isBillable = $state(false);

	// Sync description with running entry
	$effect(() => {
		if (timerStore.runningEntry) {
			description = timerStore.runningEntry.description || '';
			selectedProjectId = timerStore.runningEntry.projectId ?? null;
			isBillable = timerStore.runningEntry.isBillable;
		}
	});

	let activeProjects = $derived(
		allProjects.value.filter((p) => !p.isArchived).sort((a, b) => a.order - b.order)
	);

	let selectedProject = $derived(
		selectedProjectId ? allProjects.value.find((p) => p.id === selectedProjectId) : null
	);

	let selectedClient = $derived(
		selectedProject?.clientId
			? allClients.value.find((c) => c.id === selectedProject!.clientId)
			: null
	);

	let formattedTime = $derived(formatDuration(timerStore.elapsedSeconds));

	async function handleStartStop() {
		if (timerStore.isRunning) {
			await timerStore.stop();
			description = '';
			selectedProjectId = null;
			isBillable = false;
		} else {
			const clientId = selectedProject?.clientId ?? undefined;
			await timerStore.start({
				description,
				projectId: selectedProjectId ?? undefined,
				clientId,
				isBillable,
			});
		}
	}

	let descriptionDebounce: ReturnType<typeof setTimeout> | null = null;

	function handleDescriptionChange(value: string) {
		description = value;
		if (!timerStore.isRunning) return;
		if (descriptionDebounce) clearTimeout(descriptionDebounce);
		descriptionDebounce = setTimeout(() => {
			timerStore.updateRunning({ description: value });
		}, 500);
	}

	async function handleProjectChange(projectId: string | null) {
		selectedProjectId = projectId;
		if (!timerStore.isRunning) return;
		const project = projectId ? allProjects.value.find((p) => p.id === projectId) : null;
		await timerStore.updateRunning({
			projectId: projectId ?? undefined,
			clientId: project?.clientId ?? undefined,
			isBillable: project?.isBillable ?? isBillable,
		});
		if (project) {
			isBillable = project.isBillable;
		}
	}

	async function handleBillableToggle() {
		isBillable = !isBillable;
		if (timerStore.isRunning) {
			await timerStore.updateRunning({ isBillable });
		}
	}
</script>

<div
	class="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 {timerStore.isRunning
		? 'timer-active'
		: ''}"
>
	<!-- Timer Display -->
	<div class="mb-4 text-center">
		<div
			class="duration-display text-5xl font-bold {timerStore.isRunning
				? 'text-[hsl(var(--primary))]'
				: 'text-[hsl(var(--foreground))]'}"
		>
			{formattedTime}
		</div>
	</div>

	<!-- Description Input -->
	<div class="mb-4">
		<input
			type="text"
			value={description}
			oninput={(e) => handleDescriptionChange((e.target as HTMLInputElement).value)}
			placeholder={$_('timer.whatAreYouWorkingOn')}
			class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))]"
		/>
	</div>

	<!-- Project & Billable Row -->
	<div class="mb-4 flex items-center gap-3">
		<!-- Project Selector -->
		<div class="flex-1">
			<select
				value={selectedProjectId ?? ''}
				onchange={(e) => {
					const val = (e.target as HTMLSelectElement).value;
					handleProjectChange(val || null);
				}}
				class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-3 py-2 text-sm text-[hsl(var(--foreground))]"
			>
				<option value="">{$_('project.noProjects')}</option>
				{#each activeProjects as project}
					<option value={project.id}>
						{project.name}
						{#if project.clientId}
							{@const client = allClients.value.find((c) => c.id === project.clientId)}
							{#if client}
								· {client.name}{/if}
						{/if}
					</option>
				{/each}
			</select>
		</div>

		<!-- Billable Toggle -->
		<button
			onclick={handleBillableToggle}
			class="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors {isBillable
				? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'
				: 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'}"
			title={isBillable ? $_('entry.billable') : $_('entry.notBillable')}
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</button>
	</div>

	<!-- Start/Stop Button -->
	<button
		onclick={handleStartStop}
		class="w-full rounded-xl py-3 text-lg font-medium transition-all {timerStore.isRunning
			? 'bg-red-500 text-white hover:bg-red-600'
			: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90'}"
	>
		{#if timerStore.isRunning}
			<span class="flex items-center justify-center gap-2">
				<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
					<rect x="6" y="4" width="4" height="16" rx="1" />
					<rect x="14" y="4" width="4" height="16" rx="1" />
				</svg>
				{$_('timer.stop')}
			</span>
		{:else}
			<span class="flex items-center justify-center gap-2">
				<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
					<polygon points="5 3 19 12 5 21 5 3" />
				</svg>
				{$_('timer.start')}
			</span>
		{/if}
	</button>

	<!-- Running info -->
	{#if timerStore.isRunning && selectedProject}
		<div
			class="mt-3 flex items-center justify-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"
		>
			<div class="project-dot" style="background-color: {selectedProject.color}"></div>
			<span>{selectedProject.name}</span>
			{#if selectedClient}
				<span>· {selectedClient.name}</span>
			{/if}
		</div>
	{/if}
</div>
