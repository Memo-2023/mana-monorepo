<script lang="ts">
	import type { TaskPriority } from '@todo/shared';
	import { projectsStore } from '$lib/stores/projects.svelte';
	import { labelsStore } from '$lib/stores/labels.svelte';

	interface Props {
		selectedPriorities: TaskPriority[];
		selectedProjectId: string | null;
		selectedLabelIds: string[];
		searchQuery: string;
		onPrioritiesChange: (priorities: TaskPriority[]) => void;
		onProjectChange: (projectId: string | null) => void;
		onLabelsChange: (labelIds: string[]) => void;
		onSearchChange: (query: string) => void;
		onClearFilters: () => void;
	}

	let {
		selectedPriorities,
		selectedProjectId,
		selectedLabelIds,
		searchQuery,
		onPrioritiesChange,
		onProjectChange,
		onLabelsChange,
		onSearchChange,
		onClearFilters,
	}: Props = $props();

	const priorities: { value: TaskPriority; label: string; color: string }[] = [
		{ value: 'urgent', label: 'Dringend', color: 'bg-red-500' },
		{ value: 'high', label: 'Hoch', color: 'bg-orange-500' },
		{ value: 'medium', label: 'Mittel', color: 'bg-yellow-500' },
		{ value: 'low', label: 'Niedrig', color: 'bg-blue-500' },
	];

	let showLabelsDropdown = $state(false);

	function togglePriority(priority: TaskPriority) {
		if (selectedPriorities.includes(priority)) {
			onPrioritiesChange(selectedPriorities.filter((p) => p !== priority));
		} else {
			onPrioritiesChange([...selectedPriorities, priority]);
		}
	}

	function toggleLabel(labelId: string) {
		if (selectedLabelIds.includes(labelId)) {
			onLabelsChange(selectedLabelIds.filter((id) => id !== labelId));
		} else {
			onLabelsChange([...selectedLabelIds, labelId]);
		}
	}

	let hasActiveFilters = $derived(
		selectedPriorities.length > 0 ||
			selectedProjectId !== null ||
			selectedLabelIds.length > 0 ||
			searchQuery.trim() !== ''
	);
</script>

<div class="kanban-filters flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg">
	<!-- Search -->
	<div class="relative flex-shrink-0">
		<input
			type="text"
			value={searchQuery}
			oninput={(e) => onSearchChange(e.currentTarget.value)}
			placeholder="Suchen..."
			class="w-40 px-3 py-1.5 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
		/>
		{#if searchQuery}
			<button
				class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
				onclick={() => onSearchChange('')}
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		{/if}
	</div>

	<!-- Priority filters -->
	<div class="flex items-center gap-1.5">
		<span class="text-xs text-muted-foreground mr-1">Priorität:</span>
		{#each priorities as priority}
			<button
				class="px-2 py-1 text-xs rounded-full transition-all {selectedPriorities.includes(
					priority.value
				)
					? `${priority.color} text-white`
					: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
				onclick={() => togglePriority(priority.value)}
			>
				{priority.label}
			</button>
		{/each}
	</div>

	<!-- Project filter -->
	<div class="flex items-center gap-1.5">
		<span class="text-xs text-muted-foreground">Projekt:</span>
		<select
			class="px-2 py-1 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50"
			value={selectedProjectId || ''}
			onchange={(e) => onProjectChange(e.currentTarget.value || null)}
		>
			<option value="">Alle</option>
			{#each projectsStore.activeProjects as project}
				<option value={project.id}>{project.name}</option>
			{/each}
		</select>
	</div>

	<!-- Labels filter -->
	<div class="relative">
		<button
			class="flex items-center gap-1.5 px-2 py-1 text-sm bg-background border border-border rounded-lg hover:bg-muted/50 transition-colors"
			onclick={() => (showLabelsDropdown = !showLabelsDropdown)}
		>
			<span class="text-xs text-muted-foreground">Labels:</span>
			{#if selectedLabelIds.length > 0}
				<span class="px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
					{selectedLabelIds.length}
				</span>
			{:else}
				<span class="text-muted-foreground">Alle</span>
			{/if}
			<svg
				class="w-4 h-4 text-muted-foreground"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		{#if showLabelsDropdown}
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div class="fixed inset-0 z-40" onclick={() => (showLabelsDropdown = false)}></div>
			<div
				class="absolute top-full left-0 mt-1 z-50 min-w-[200px] bg-popover border border-border rounded-lg shadow-lg p-2"
			>
				{#if labelsStore.labels.length === 0}
					<p class="text-sm text-muted-foreground p-2">Keine Labels vorhanden</p>
				{:else}
					{#each labelsStore.labels as label}
						<button
							class="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted/50 transition-colors"
							onclick={() => toggleLabel(label.id)}
						>
							<div class="w-3 h-3 rounded-full" style="background-color: {label.color}"></div>
							<span class="flex-1 text-left">{label.name}</span>
							{#if selectedLabelIds.includes(label.id)}
								<svg
									class="w-4 h-4 text-primary"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		{/if}
	</div>

	<!-- Clear filters -->
	{#if hasActiveFilters}
		<button
			class="ml-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
			onclick={onClearFilters}
		>
			Filter zurücksetzen
		</button>
	{/if}
</div>
