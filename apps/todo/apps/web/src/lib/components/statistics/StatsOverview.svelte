<script lang="ts">
	import { CheckCircle, Clock, AlertTriangle, TrendingUp, Target, Calendar } from 'lucide-svelte';

	interface Props {
		completedToday: number;
		completedThisWeek: number;
		activeTasks: number;
		overdueTasks: number;
		completionRate: number;
		storyPointsThisWeek: number;
	}

	let {
		completedToday,
		completedThisWeek,
		activeTasks,
		overdueTasks,
		completionRate,
		storyPointsThisWeek,
	}: Props = $props();
</script>

<div class="stats-grid">
	<div class="stat-card stat-card-success">
		<div class="stat-icon">
			<CheckCircle size={24} />
		</div>
		<div class="stat-content">
			<span class="stat-value">{completedToday}</span>
			<span class="stat-label">Heute erledigt</span>
		</div>
	</div>

	<div class="stat-card stat-card-primary">
		<div class="stat-icon">
			<Calendar size={24} />
		</div>
		<div class="stat-content">
			<span class="stat-value">{completedThisWeek}</span>
			<span class="stat-label">Diese Woche</span>
		</div>
	</div>

	<div class="stat-card stat-card-neutral">
		<div class="stat-icon">
			<Clock size={24} />
		</div>
		<div class="stat-content">
			<span class="stat-value">{activeTasks}</span>
			<span class="stat-label">Aktive Tasks</span>
		</div>
	</div>

	<div
		class="stat-card"
		class:stat-card-danger={overdueTasks > 0}
		class:stat-card-neutral={overdueTasks === 0}
	>
		<div class="stat-icon">
			<AlertTriangle size={24} />
		</div>
		<div class="stat-content">
			<span class="stat-value">{overdueTasks}</span>
			<span class="stat-label">Überfällig</span>
		</div>
	</div>

	<div class="stat-card stat-card-info">
		<div class="stat-icon">
			<TrendingUp size={24} />
		</div>
		<div class="stat-content">
			<span class="stat-value">{completionRate}%</span>
			<span class="stat-label">Abschlussrate</span>
		</div>
	</div>

	{#if storyPointsThisWeek > 0}
		<div class="stat-card stat-card-accent">
			<div class="stat-icon">
				<Target size={24} />
			</div>
			<div class="stat-content">
				<span class="stat-value">{storyPointsThisWeek}</span>
				<span class="stat-label">Story Points</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	@media (min-width: 640px) {
		.stats-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.stats-grid {
			grid-template-columns: repeat(6, 1fr);
		}
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1rem;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .stat-card {
		background: rgba(30, 30, 30, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 0.75rem;
		flex-shrink: 0;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1.2;
		color: hsl(var(--foreground));
	}

	.stat-label {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Color Variants */
	.stat-card-success .stat-icon {
		background: rgba(16, 185, 129, 0.15);
		color: #10b981;
	}

	.stat-card-primary .stat-icon {
		background: rgba(139, 92, 246, 0.15);
		color: #8b5cf6;
	}

	.stat-card-neutral .stat-icon {
		background: rgba(107, 114, 128, 0.15);
		color: #6b7280;
	}

	.stat-card-danger .stat-icon {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}

	.stat-card-info .stat-icon {
		background: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
	}

	.stat-card-accent .stat-icon {
		background: rgba(236, 72, 153, 0.15);
		color: #ec4899;
	}
</style>
