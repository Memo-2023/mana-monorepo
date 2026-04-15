<script lang="ts">
	import { getContext } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { timerStore } from '$lib/modules/times/stores/timer.svelte';
	import type { TimeEntry, Project } from '$lib/modules/times/types';

	const allTimeEntries = getContext<{ value: TimeEntry[] }>('timeEntries');
	const allProjects = getContext<{ value: Project[] }>('projects');

	// Get unique recent entries (by description+project, deduplicated)
	let recentEntries = $derived(() => {
		const seen = new Set<string>();
		return allTimeEntries.value
			.filter((e) => !e.isRunning && e.description)
			.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
			.filter((e) => {
				const key = `${e.description}|${e.projectId}`;
				if (seen.has(key)) return false;
				seen.add(key);
				return true;
			})
			.slice(0, 5);
	});

	async function startFromEntry(entry: TimeEntry) {
		await timerStore.start({
			projectId: entry.projectId,
			clientId: entry.clientId,
			description: entry.description,
			isBillable: entry.isBillable,
			tags: entry.tags,
		});
	}
</script>

{#if recentEntries().length > 0}
	<div>
		<h3 class="mb-2 text-xs font-medium text-[hsl(var(--color-muted-foreground))]">Quick Start</h3>
		<div class="flex flex-wrap gap-2">
			{#each recentEntries() as entry}
				{@const project = entry.projectId
					? allProjects.value.find((p) => p.id === entry.projectId)
					: undefined}
				<button
					onclick={() => startFromEntry(entry)}
					disabled={timerStore.isRunning}
					class="flex items-center gap-1.5 rounded-full border border-[hsl(var(--color-border))] px-3 py-1.5 text-xs transition-colors hover:border-[hsl(var(--color-primary)/0.5)] hover:bg-[hsl(var(--color-primary)/0.05)] disabled:opacity-50"
				>
					{#if project}
						<div class="h-2 w-2 rounded-full" style="background-color: {project.color}"></div>
					{/if}
					<span class="max-w-[150px] truncate text-[hsl(var(--color-foreground))]"
						>{entry.description}</span
					>
				</button>
			{/each}
		</div>
	</div>
{/if}
