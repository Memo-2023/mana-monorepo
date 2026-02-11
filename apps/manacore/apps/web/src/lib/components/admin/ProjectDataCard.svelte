<script lang="ts">
	import type { ProjectDataSummary } from '$lib/api/services/admin';

	interface Props {
		project: ProjectDataSummary;
	}

	let { project }: Props = $props();

	function formatRelativeTime(dateStr: string | undefined): string {
		if (!dateStr) return '-';
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'gerade eben';
		if (diffMins < 60) return `vor ${diffMins} Min`;
		if (diffHours < 24) return `vor ${diffHours} Std`;
		if (diffDays < 7) return `vor ${diffDays} Tagen`;
		return new Date(dateStr).toLocaleDateString('de-DE');
	}
</script>

<div
	class="rounded-lg border bg-card shadow-sm overflow-hidden {project.available
		? ''
		: 'opacity-60'}"
>
	<div class="p-4 border-b flex items-center justify-between">
		<div class="flex items-center gap-3">
			<span class="text-2xl">{project.icon}</span>
			<div>
				<h3 class="font-semibold">{project.projectName}</h3>
				{#if project.available}
					<p class="text-xs text-muted-foreground">
						{project.totalCount} Einträge
					</p>
				{:else}
					<p class="text-xs text-red-500">{project.error || 'Nicht verfügbar'}</p>
				{/if}
			</div>
		</div>
		{#if project.available}
			<div
				class="h-2 w-2 rounded-full {project.totalCount > 0 ? 'bg-green-500' : 'bg-gray-300'}"
			></div>
		{:else}
			<div class="h-2 w-2 rounded-full bg-red-500"></div>
		{/if}
	</div>

	{#if project.available}
		<div class="p-4">
			{#if project.entities.length > 0}
				<div class="space-y-2">
					{#each project.entities as entity}
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">{entity.label}</span>
							<span class="font-mono font-medium">{entity.count}</span>
						</div>
					{/each}
				</div>

				{#if project.lastActivityAt}
					<div class="mt-4 pt-3 border-t">
						<p class="text-xs text-muted-foreground">
							Letzte Aktivitat: {formatRelativeTime(project.lastActivityAt)}
						</p>
					</div>
				{/if}
			{:else}
				<p class="text-sm text-muted-foreground text-center py-4">Keine Daten vorhanden</p>
			{/if}
		</div>
	{:else}
		<div class="p-4">
			<p class="text-sm text-muted-foreground text-center py-2">Backend nicht erreichbar</p>
		</div>
	{/if}
</div>
