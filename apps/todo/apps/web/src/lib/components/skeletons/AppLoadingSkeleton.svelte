<script lang="ts">
	/**
	 * AppLoadingSkeleton - Full page loading skeleton for initial app load
	 * Shows a minimal skeleton layout while auth is being checked
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div class="app-loading-skeleton" role="status" aria-label="App wird geladen...">
	<!-- Header placeholder -->
	<div class="header-skeleton">
		<SkeletonBox width="140px" height="32px" borderRadius="8px" />
		<div class="header-nav">
			<SkeletonBox width="36px" height="36px" borderRadius="50%" />
		</div>
	</div>

	<!-- Content placeholder -->
	<div class="content-skeleton">
		<!-- Page title -->
		<div class="title-row">
			<SkeletonBox width="180px" height="28px" />
		</div>
		<SkeletonBox width="220px" height="16px" />

		<!-- Quick add bar -->
		<div class="quick-add-skeleton">
			<SkeletonBox width="100%" height="52px" borderRadius="12px" />
		</div>

		<!-- Task sections -->
		<div class="sections-skeleton">
			<!-- Section header -->
			<div class="section-header">
				<SkeletonBox width="100px" height="20px" />
				<SkeletonBox width="28px" height="28px" borderRadius="50%" />
			</div>

			<!-- Task items -->
			<div class="task-list">
				{#each Array(4) as _, i}
					<div class="task-item" style="opacity: {Math.max(0.3, 1 - i * 0.18)};">
						<SkeletonBox width="22px" height="22px" borderRadius="6px" />
						<div class="task-content">
							<SkeletonBox width="{70 - i * 8}%" height="18px" />
							<SkeletonBox width="{40 + i * 5}%" height="14px" />
						</div>
						<SkeletonBox width="24px" height="24px" borderRadius="4px" />
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.app-loading-skeleton {
		min-height: 100vh;
		background: hsl(var(--background));
	}

	.header-skeleton {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.header-nav {
		display: flex;
		gap: 0.5rem;
	}

	.content-skeleton {
		max-width: 48rem;
		margin: 0 auto;
		padding: 1.5rem 1rem;
	}

	.title-row {
		margin-bottom: 0.5rem;
	}

	.quick-add-skeleton {
		margin: 1.5rem 0;
	}

	.sections-skeleton {
		margin-top: 1.5rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 0;
		margin-bottom: 0.5rem;
	}

	.task-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.task-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 12px;
	}

	.task-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	@media (max-width: 768px) {
		.content-skeleton {
			padding: 1rem;
		}
	}
</style>
