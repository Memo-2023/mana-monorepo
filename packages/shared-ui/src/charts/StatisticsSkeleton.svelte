<script lang="ts">
	/**
	 * StatisticsSkeleton - Skeleton for statistics page loading
	 */

	import { SkeletonBox } from '../molecules';

	interface Props {
		/** Number of stat cards to show (default: 6) */
		statCards?: number;
		/** Number of progress items to show (default: 4) */
		progressItems?: number;
		/** Number of legend items for donut chart (default: 4) */
		legendItems?: number;
		/** Show additional stats section (default: true) */
		showAdditionalStats?: boolean;
	}

	let {
		statCards = 6,
		progressItems = 4,
		legendItems = 4,
		showAdditionalStats = true,
	}: Props = $props();
</script>

<div class="statistics-skeleton" role="status" aria-label="Statistiken werden geladen...">
	<!-- Stats Overview Cards -->
	<div class="stats-overview">
		{#each Array(statCards) as _, i}
			<div class="stat-card" style="opacity: {Math.max(0.5, 1 - i * 0.08)};">
				<SkeletonBox width="40px" height="40px" borderRadius="10px" />
				<div class="stat-content">
					<SkeletonBox width="48px" height="28px" />
					<SkeletonBox width="80px" height="14px" />
				</div>
			</div>
		{/each}
	</div>

	<!-- Charts Grid -->
	<div class="charts-grid">
		<!-- Activity Heatmap -->
		<div class="chart-card heatmap">
			<div class="chart-header">
				<SkeletonBox width="140px" height="20px" />
			</div>
			<div class="heatmap-grid">
				{#each Array(7) as _}
					<div class="heatmap-row">
						{#each Array(12) as _}
							<SkeletonBox width="16px" height="16px" borderRadius="3px" />
						{/each}
					</div>
				{/each}
			</div>
		</div>

		<!-- Charts Row -->
		<div class="charts-row">
			<!-- Weekly Trend Chart -->
			<div class="chart-card trend">
				<div class="chart-header">
					<SkeletonBox width="120px" height="20px" />
				</div>
				<div class="trend-bars">
					{#each Array(7) as _, i}
						<div class="bar-wrapper">
							<SkeletonBox width="32px" height="{40 + Math.random() * 60}px" borderRadius="4px" />
							<SkeletonBox width="24px" height="12px" />
						</div>
					{/each}
				</div>
			</div>

			<!-- Priority Donut Chart -->
			<div class="chart-card donut">
				<div class="chart-header">
					<SkeletonBox width="100px" height="20px" />
				</div>
				<div class="donut-wrapper">
					<SkeletonBox width="140px" height="140px" borderRadius="50%" />
				</div>
				<div class="legend">
					{#each Array(legendItems) as _}
						<div class="legend-item">
							<SkeletonBox width="12px" height="12px" borderRadius="3px" />
							<SkeletonBox width="60px" height="14px" />
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Project Progress -->
		<div class="chart-card projects">
			<div class="chart-header">
				<SkeletonBox width="130px" height="20px" />
			</div>
			<div class="progress-bars">
				{#each Array(progressItems) as _, i}
					<div class="progress-item" style="opacity: {Math.max(0.4, 1 - i * 0.15)};">
						<div class="progress-header">
							<SkeletonBox width="{100 + i * 20}px" height="16px" />
							<SkeletonBox width="40px" height="14px" />
						</div>
						<SkeletonBox width="100%" height="8px" borderRadius="4px" />
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Additional Stats -->
	{#if showAdditionalStats}
		<div class="additional-stats">
			{#each Array(3) as _}
				<div class="small-stat">
					<SkeletonBox width="120px" height="12px" />
					<SkeletonBox width="80px" height="18px" />
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.statistics-skeleton {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Stats Overview */
	.stats-overview {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 1rem;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	/* Charts Grid */
	.charts-grid {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.chart-card {
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 1rem;
		padding: 1.25rem;
	}

	.chart-header {
		margin-bottom: 1rem;
	}

	/* Heatmap */
	.heatmap-grid {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.heatmap-row {
		display: flex;
		gap: 4px;
	}

	/* Charts Row */
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

	/* Trend Chart */
	.trend-bars {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		height: 120px;
		padding-top: 1rem;
	}

	.bar-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	/* Donut Chart */
	.donut-wrapper {
		display: flex;
		justify-content: center;
		padding: 1rem 0;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		justify-content: center;
		margin-top: 1rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	/* Project Progress */
	.progress-bars {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.progress-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	/* Additional Stats */
	.additional-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.small-stat {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 1rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: 1rem;
	}
</style>
