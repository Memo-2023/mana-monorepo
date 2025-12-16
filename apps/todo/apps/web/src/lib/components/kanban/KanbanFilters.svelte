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

	const priorities: { value: TaskPriority; label: string; color: string; bgColor: string }[] = [
		{
			value: 'urgent',
			label: 'Dringend',
			color: 'text-red-600 dark:text-red-400',
			bgColor: 'bg-red-500',
		},
		{
			value: 'high',
			label: 'Wichtig',
			color: 'text-orange-600 dark:text-orange-400',
			bgColor: 'bg-orange-500',
		},
		{
			value: 'medium',
			label: 'Normal',
			color: 'text-yellow-600 dark:text-yellow-400',
			bgColor: 'bg-yellow-500',
		},
		{
			value: 'low',
			label: 'Später',
			color: 'text-blue-600 dark:text-blue-400',
			bgColor: 'bg-blue-500',
		},
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

<div class="kanban-filters glass-pill rounded-full p-4">
	<div class="flex flex-col gap-4">
		<!-- Row 1: Search and Clear -->
		<div class="flex items-center gap-4">
			<div class="relative flex-1 max-w-xs">
				<svg
					class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<input
					type="text"
					value={searchQuery}
					oninput={(e) => onSearchChange(e.currentTarget.value)}
					placeholder="Aufgaben suchen..."
					class="w-full pl-10 pr-8 py-2 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground transition-all"
				/>
				{#if searchQuery}
					<button
						class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
						onclick={() => onSearchChange('')}
						aria-label="Suche leeren"
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

			{#if hasActiveFilters}
				<button
					class="ml-auto px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
					onclick={onClearFilters}
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
					Zurücksetzen
				</button>
			{/if}
		</div>

		<!-- Row 2: Filter Pills -->
		<div class="flex flex-wrap items-center gap-3">
			<!-- Priority filters -->
			<div class="filter-group flex items-center gap-2">
				<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
					>Priorität</span
				>
				<div class="flex items-center gap-1">
					{#each priorities as priority}
						<button
							class="filter-pill px-3 py-1.5 text-xs font-medium rounded-full transition-all border {selectedPriorities.includes(
								priority.value
							)
								? `${priority.bgColor} text-white border-transparent shadow-sm`
								: 'bg-background border-border text-foreground hover:border-primary/50 hover:bg-muted/50'}"
							onclick={() => togglePriority(priority.value)}
						>
							{priority.label}
						</button>
					{/each}
				</div>
			</div>

			<div class="h-6 w-px bg-border hidden sm:block"></div>

			<!-- Project filter -->
			<div class="filter-group flex items-center gap-2">
				<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
					>Projekt</span
				>
				<select
					class="px-3 py-1.5 text-sm bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer"
					value={selectedProjectId || ''}
					onchange={(e) => onProjectChange(e.currentTarget.value || null)}
				>
					<option value="">Alle Projekte</option>
					{#each projectsStore.activeProjects as project}
						<option value={project.id}>{project.name}</option>
					{/each}
				</select>
			</div>

			<div class="h-6 w-px bg-border hidden sm:block"></div>

			<!-- Tags filter -->
			<div class="filter-group flex items-center gap-2 relative">
				<span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tags</span>
				<button
					class="flex items-center gap-2 px-3 py-1.5 text-sm bg-background border border-border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-all"
					onclick={() => (showLabelsDropdown = !showLabelsDropdown)}
				>
					{#if selectedLabelIds.length > 0}
						<div class="flex items-center gap-1">
							{#each selectedLabelIds.slice(0, 3) as labelId}
								{@const label = labelsStore.labels.find((l) => l.id === labelId)}
								{#if label}
									<div
										class="w-3 h-3 rounded-full ring-2 ring-background"
										style="background-color: {label.color}"
									></div>
								{/if}
							{/each}
							{#if selectedLabelIds.length > 3}
								<span class="text-xs text-muted-foreground">+{selectedLabelIds.length - 3}</span>
							{/if}
						</div>
					{:else}
						<span class="text-muted-foreground">Auswählen</span>
					{/if}
					<svg
						class="w-4 h-4 text-muted-foreground transition-transform {showLabelsDropdown
							? 'rotate-180'
							: ''}"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>

				{#if showLabelsDropdown}
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_no_static_element_interactions -->
					<div
						class="fixed inset-0 z-40"
						onclick={() => (showLabelsDropdown = false)}
						onkeydown={(e) => e.key === 'Escape' && (showLabelsDropdown = false)}
						role="presentation"
						tabindex="-1"
					></div>
					<div
						class="absolute top-full left-0 mt-2 z-50 min-w-[220px] bg-popover border border-border rounded-xl shadow-lg p-2 animate-in fade-in slide-in-from-top-2 duration-150"
					>
						{#if labelsStore.labels.length === 0}
							<p class="text-sm text-muted-foreground p-3 text-center">Keine Tags vorhanden</p>
						{:else}
							<div class="max-h-[200px] overflow-y-auto">
								{#each labelsStore.labels as label}
									<button
										class="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors"
										onclick={() => toggleLabel(label.id)}
									>
										<div
											class="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-popover transition-all {selectedLabelIds.includes(
												label.id
											)
												? 'ring-primary'
												: 'ring-transparent'}"
											style="background-color: {label.color}"
										></div>
										<span class="flex-1 text-left truncate">{label.name}</span>
										{#if selectedLabelIds.includes(label.id)}
											<svg
												class="w-4 h-4 text-primary flex-shrink-0"
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
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* Glass pill effect matching PillNavigation */
	.glass-pill {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .glass-pill {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	/* Animation utilities */
	.animate-in {
		animation: animateIn 0.15s ease-out;
	}

	.fade-in {
		--tw-enter-opacity: 0;
	}

	.slide-in-from-top-2 {
		--tw-enter-translate-y: -0.5rem;
	}

	@keyframes animateIn {
		from {
			opacity: var(--tw-enter-opacity, 1);
			transform: translateY(var(--tw-enter-translate-y, 0));
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
