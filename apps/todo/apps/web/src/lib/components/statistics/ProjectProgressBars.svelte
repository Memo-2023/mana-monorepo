<script lang="ts">
	interface ProjectProgress {
		projectId: string | null;
		projectName: string;
		projectColor: string;
		total: number;
		completed: number;
		inProgress: number;
		percentage: number;
	}

	interface Props {
		data: ProjectProgress[];
	}

	let { data }: Props = $props();

	// Sort by total tasks (descending) and limit to top 8
	let sortedData = $derived(data.slice(0, 8));
</script>

<div class="progress-container">
	<h3 class="progress-title">Projekt-Fortschritt</h3>

	{#if sortedData.length === 0}
		<p class="no-data">Keine Projekte mit Aufgaben</p>
	{:else}
		<div class="progress-list">
			{#each sortedData as project}
				<div class="project-row">
					<div class="project-header">
						<div class="project-name">
							<span class="project-dot" style="background-color: {project.projectColor}"></span>
							<span class="name-text">{project.projectName}</span>
						</div>
						<span class="project-stats">
							{project.completed}/{project.total}
						</span>
					</div>

					<div class="progress-bar-container">
						<div class="progress-bar">
							<!-- Completed segment -->
							{#if project.completed > 0}
								<div
									class="progress-segment completed"
									style="width: {(project.completed / project.total) *
										100}%; background-color: {project.projectColor}"
								></div>
							{/if}

							<!-- In Progress segment -->
							{#if project.inProgress > 0}
								<div
									class="progress-segment in-progress"
									style="width: {(project.inProgress / project.total) *
										100}%; background-color: {project.projectColor}; opacity: 0.4"
								></div>
							{/if}
						</div>

						<span class="percentage">{project.percentage}%</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.progress-container {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1.5rem;
		padding: 1.5rem;
	}

	:global(.dark) .progress-container {
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.progress-title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0 0 1rem 0;
	}

	.no-data {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		text-align: center;
		padding: 2rem;
	}

	.progress-list {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.project-row {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.project-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.project-name {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.project-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.name-text {
		font-size: 0.875rem;
		color: hsl(var(--foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.project-stats {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		flex-shrink: 0;
	}

	.progress-bar-container {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.progress-bar {
		flex: 1;
		height: 8px;
		background: hsl(var(--muted) / 0.3);
		border-radius: 4px;
		overflow: hidden;
		display: flex;
	}

	:global(.dark) .progress-bar {
		background: rgba(255, 255, 255, 0.1);
	}

	.progress-segment {
		height: 100%;
		transition: width 0.3s ease;
	}

	.progress-segment.completed {
		border-radius: 4px 0 0 4px;
	}

	.progress-segment.in-progress {
		/* Striped pattern for in-progress */
		background-image: repeating-linear-gradient(
			45deg,
			transparent,
			transparent 4px,
			rgba(255, 255, 255, 0.3) 4px,
			rgba(255, 255, 255, 0.3) 8px
		);
	}

	.percentage {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		width: 36px;
		text-align: right;
		flex-shrink: 0;
	}
</style>
