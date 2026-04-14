<!--
  StatsOverview — streak, weekly minutes, total sessions.
-->
<script lang="ts">
	import type { MeditateSession } from '../types';
	import {
		getCurrentStreak,
		getWeekMinutes,
		getWeekSessionCount,
		getTotalMinutes,
	} from '../queries';

	interface Props {
		sessions: MeditateSession[];
	}

	let { sessions }: Props = $props();

	const streak = $derived(getCurrentStreak(sessions));
	const weekMinutes = $derived(getWeekMinutes(sessions));
	const weekSessions = $derived(getWeekSessionCount(sessions));
	const totalMinutes = $derived(getTotalMinutes(sessions));
</script>

<div class="stats-grid">
	<div class="stat-card">
		<span class="stat-value">{streak}</span>
		<span class="stat-label">{streak === 1 ? 'Tag' : 'Tage'} Streak</span>
	</div>
	<div class="stat-card">
		<span class="stat-value">{weekMinutes}</span>
		<span class="stat-label">Min. diese Woche</span>
	</div>
	<div class="stat-card">
		<span class="stat-value">{weekSessions}</span>
		<span class="stat-label">Sessions</span>
	</div>
	<div class="stat-card">
		<span class="stat-value">{totalMinutes}</span>
		<span class="stat-label">Min. gesamt</span>
	</div>
</div>

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem 0.5rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted) / 0.5);
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		font-variant-numeric: tabular-nums;
	}

	.stat-label {
		font-size: 0.7rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		line-height: 1.2;
		margin-top: 0.15rem;
	}

	@media (max-width: 480px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
