<script lang="ts">
	import { onMount } from 'svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { projectsStore } from '$lib/stores/projects.svelte';
	import { statisticsStore } from '$lib/stores/statistics.svelte';
	import StatsOverview from '$lib/components/statistics/StatsOverview.svelte';
	import ActivityHeatmap from '$lib/components/statistics/ActivityHeatmap.svelte';
	import WeeklyTrendChart from '$lib/components/statistics/WeeklyTrendChart.svelte';
	import PriorityDonutChart from '$lib/components/statistics/PriorityDonutChart.svelte';
	import ProjectProgressBars from '$lib/components/statistics/ProjectProgressBars.svelte';
	import { BarChart3 } from 'lucide-svelte';

	let loading = $state(true);

	// Update statistics when tasks change
	$effect(() => {
		statisticsStore.setTasks(tasksStore.tasks);
	});

	$effect(() => {
		statisticsStore.setProjects(projectsStore.projects);
	});

	onMount(async () => {
		// Fetch all tasks including completed ones
		await tasksStore.fetchAllTasks();
		loading = false;
	});
</script>

<svelte:head>
	<title>Statistiken - Todo</title>
</svelte:head>

<div class="statistics-page">
	<header class="page-header">
		<div class="header-icon">
			<BarChart3 size={28} />
		</div>
		<div class="header-content">
			<h1>Statistiken</h1>
			<p class="header-subtitle">Deine Produktivität im Überblick</p>
		</div>
	</header>

	{#if loading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<p>Lade Statistiken...</p>
		</div>
	{:else}
		<!-- Quick Stats -->
		<section class="stats-section">
			<StatsOverview
				completedToday={statisticsStore.completedToday}
				completedThisWeek={statisticsStore.completedThisWeek}
				activeTasks={statisticsStore.activeTasks}
				overdueTasks={statisticsStore.overdueTasks}
				completionRate={statisticsStore.completionRate}
				storyPointsThisWeek={statisticsStore.storyPointsThisWeek}
			/>
		</section>

		<!-- Charts Grid -->
		<div class="charts-grid">
			<!-- Activity Heatmap -->
			<section class="chart-section heatmap-section">
				<ActivityHeatmap data={statisticsStore.activityHeatmap} />
			</section>

			<!-- Weekly Trend + Priority Donut -->
			<div class="charts-row">
				<section class="chart-section trend-section">
					<WeeklyTrendChart data={statisticsStore.weeklyTrend} />
				</section>

				<section class="chart-section priority-section">
					<PriorityDonutChart data={statisticsStore.priorityBreakdown} />
				</section>
			</div>

			<!-- Project Progress -->
			<section class="chart-section projects-section">
				<ProjectProgressBars data={statisticsStore.projectProgress} />
			</section>
		</div>

		<!-- Additional Stats -->
		<div class="additional-stats">
			<div class="stat-card-small">
				<span class="stat-label">Durchschn. Bearbeitungszeit</span>
				<span class="stat-value">{statisticsStore.averageCompletionTime} Tage</span>
			</div>

			{#if statisticsStore.subtaskStats.total > 0}
				<div class="stat-card-small">
					<span class="stat-label">Subtasks erledigt</span>
					<span class="stat-value">
						{statisticsStore.subtaskStats.completed}/{statisticsStore.subtaskStats.total}
						<span class="stat-percentage">({statisticsStore.subtaskStats.percentage}%)</span>
					</span>
				</div>
			{/if}

			<div class="stat-card-small">
				<span class="stat-label">Produktivster Tag</span>
				<span class="stat-value">
					{#if statisticsStore.productiveDays.length > 0}
						{@const bestDay = statisticsStore.productiveDays.reduce((best, day) =>
							day.avgCompletions > best.avgCompletions ? day : best
						)}
						{bestDay.day} ({bestDay.avgCompletions} Aufg./Tag)
					{:else}
						-
					{/if}
				</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.statistics-page {
		padding-bottom: 6rem;
	}

	.page-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.header-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		background: rgba(139, 92, 246, 0.15);
		color: #8b5cf6;
		border-radius: 1rem;
	}

	.header-content h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.header-subtitle {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		margin: 0.25rem 0 0 0;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 4rem 2rem;
		color: hsl(var(--muted-foreground));
	}

	.loading-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid hsl(var(--muted) / 0.3);
		border-top-color: #8b5cf6;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.stats-section {
		margin-bottom: 1.5rem;
	}

	.charts-grid {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.charts-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	@media (min-width: 768px) {
		.charts-row {
			grid-template-columns: 2fr 1fr;
		}
	}

	.chart-section {
		min-width: 0;
	}

	.additional-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.stat-card-small {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1rem;
	}

	:global(.dark) .stat-card-small {
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.stat-card-small .stat-label {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.stat-card-small .stat-value {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.stat-percentage {
		font-size: 0.875rem;
		font-weight: 400;
		color: hsl(var(--muted-foreground));
	}
</style>
