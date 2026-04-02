<script lang="ts">
	/**
	 * ImportPreviewSkeleton - Skeleton for file processing/preview loading
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div class="import-preview-skeleton" role="status" aria-label="Datei wird verarbeitet...">
	<!-- Header stats -->
	<div class="stats-row">
		{#each Array(3) as _}
			<div class="stat-card">
				<SkeletonBox width="48px" height="32px" />
				<SkeletonBox width="80px" height="14px" />
			</div>
		{/each}
	</div>

	<!-- Preview list -->
	<div class="preview-list">
		<div class="list-header">
			<SkeletonBox width="150px" height="20px" />
			<SkeletonBox width="100px" height="14px" />
		</div>

		<div class="list-items">
			{#each Array(5) as _, i}
				<div class="list-item" style="opacity: {Math.max(0.3, 1 - i * 0.15)};">
					<SkeletonBox width="20px" height="20px" borderRadius="4px" />
					<div class="item-content">
						<SkeletonBox width="45%" height="16px" />
						<SkeletonBox width="60%" height="14px" />
					</div>
					<SkeletonBox width="60px" height="24px" borderRadius="12px" />
				</div>
			{/each}
		</div>
	</div>

	<!-- Action buttons -->
	<div class="actions">
		<SkeletonBox width="100px" height="40px" borderRadius="8px" />
		<SkeletonBox width="140px" height="40px" borderRadius="8px" />
	</div>
</div>

<style>
	.import-preview-skeleton {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.stats-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-lg);
	}

	.preview-list {
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.list-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: 1px solid hsl(var(--border));
		background: hsl(var(--muted) / 0.3);
	}

	.list-items {
		padding: 0.5rem;
	}

	.list-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
	}

	.item-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	@media (max-width: 640px) {
		.stats-row {
			grid-template-columns: 1fr;
		}
	}
</style>
