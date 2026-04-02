<script lang="ts">
	/**
	 * WorldClockSkeleton - Loading skeleton for world clock page
	 */
	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div class="world-clock-skeleton" role="status" aria-label="Weltuhren werden geladen...">
	<!-- Map skeleton -->
	<div class="map-skeleton">
		<SkeletonBox width="100%" height="300px" borderRadius="12px" />
	</div>

	<!-- Clock list -->
	<div class="clocks-list">
		{#each Array(4) as _, i}
			<div class="clock-item" style="opacity: {Math.max(0.4, 1 - i * 0.15)};">
				<div class="clock-info">
					<SkeletonBox width="120px" height="24px" />
					<SkeletonBox width="80px" height="16px" />
				</div>
				<SkeletonBox width="100px" height="36px" />
			</div>
		{/each}
	</div>
</div>

<style>
	.world-clock-skeleton {
		padding: 1rem;
	}

	.map-skeleton {
		margin-bottom: 1.5rem;
	}

	.clocks-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.clock-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 12px;
	}

	.clock-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>
