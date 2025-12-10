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
		<SkeletonBox width="120px" height="32px" borderRadius="8px" />
		<div class="header-nav">
			<SkeletonBox width="80px" height="32px" borderRadius="16px" />
			<SkeletonBox width="80px" height="32px" borderRadius="16px" />
			<SkeletonBox width="80px" height="32px" borderRadius="16px" />
		</div>
		<SkeletonBox width="36px" height="36px" borderRadius="50%" />
	</div>

	<!-- Content placeholder -->
	<div class="content-skeleton">
		<!-- Page title -->
		<div class="title-row">
			<SkeletonBox width="200px" height="32px" />
			<SkeletonBox width="120px" height="40px" borderRadius="8px" />
		</div>

		<!-- Search bar -->
		<SkeletonBox width="100%" height="48px" borderRadius="12px" />

		<!-- List items -->
		<div class="list-skeleton">
			{#each Array(5) as _, i}
				<div class="list-item" style="opacity: {Math.max(0.3, 1 - i * 0.15)};">
					<SkeletonBox width="48px" height="48px" borderRadius="50%" />
					<div class="item-content">
						<SkeletonBox width="60%" height="18px" />
						<SkeletonBox width="40%" height="14px" />
					</div>
				</div>
			{/each}
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
		padding: 1rem 2rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.header-nav {
		display: flex;
		gap: 0.5rem;
	}

	.content-skeleton {
		max-width: 80rem;
		margin: 0 auto;
		padding: 2rem;
	}

	.title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.list-skeleton {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.list-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 12px;
	}

	.item-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	@media (max-width: 768px) {
		.header-nav {
			display: none;
		}

		.header-skeleton {
			padding: 1rem;
		}

		.content-skeleton {
			padding: 1rem;
		}
	}
</style>
