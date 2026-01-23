<script lang="ts">
	/**
	 * AlarmsSkeleton - Loading skeleton for alarms page
	 */
	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div class="alarms-skeleton" role="status" aria-label="Alarme werden geladen...">
	<!-- Presets section -->
	<div class="presets-grid">
		{#each Array(6) as _, i}
			<div class="preset-item" style="opacity: {Math.max(0.4, 1 - i * 0.1)};">
				<SkeletonBox width="100%" height="64px" borderRadius="12px" />
			</div>
		{/each}
	</div>

	<!-- Alarm list -->
	<div class="alarm-list">
		{#each Array(3) as _, i}
			<div class="alarm-item" style="opacity: {Math.max(0.4, 1 - i * 0.15)};">
				<div class="alarm-content">
					<SkeletonBox width="80px" height="32px" />
					<SkeletonBox width="120px" height="16px" />
				</div>
				<SkeletonBox width="48px" height="24px" borderRadius="12px" />
			</div>
		{/each}
	</div>
</div>

<style>
	.alarms-skeleton {
		padding: 1rem;
	}

	.presets-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
		margin-bottom: 2rem;
	}

	.alarm-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.alarm-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 12px;
	}

	.alarm-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	@media (max-width: 640px) {
		.presets-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
