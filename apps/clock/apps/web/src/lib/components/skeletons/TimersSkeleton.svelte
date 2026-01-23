<script lang="ts">
	/**
	 * TimersSkeleton - Loading skeleton for timers page
	 */
	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div class="timers-skeleton" role="status" aria-label="Timer werden geladen...">
	<!-- Quick presets -->
	<div class="presets-row">
		{#each Array(4) as _, i}
			<SkeletonBox width="80px" height="40px" borderRadius="20px" />
		{/each}
	</div>

	<!-- Timer form -->
	<div class="timer-form">
		<SkeletonBox width="100%" height="80px" borderRadius="12px" />
		<SkeletonBox width="120px" height="44px" borderRadius="8px" />
	</div>

	<!-- Active timers -->
	<div class="timers-list">
		{#each Array(2) as _, i}
			<div class="timer-item" style="opacity: {Math.max(0.4, 1 - i * 0.2)};">
				<div class="timer-display">
					<SkeletonBox width="150px" height="40px" />
					<SkeletonBox width="80px" height="16px" />
				</div>
				<div class="timer-controls">
					<SkeletonBox width="44px" height="44px" borderRadius="50%" />
					<SkeletonBox width="44px" height="44px" borderRadius="50%" />
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.timers-skeleton {
		padding: 1rem;
	}

	.presets-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
	}

	.timer-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
		margin-bottom: 2rem;
	}

	.timers-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.timer-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 16px;
	}

	.timer-display {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.timer-controls {
		display: flex;
		gap: 0.75rem;
	}
</style>
