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
		</div>
		<SkeletonBox width="36px" height="36px" borderRadius="50%" />
	</div>

	<!-- Content placeholder - Clock specific -->
	<div class="content-skeleton">
		<!-- Clock display placeholder -->
		<div class="clock-placeholder">
			<SkeletonBox width="300px" height="300px" borderRadius="50%" />
		</div>

		<!-- Controls placeholder -->
		<div class="controls-placeholder">
			<SkeletonBox width="200px" height="48px" borderRadius="12px" />
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
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: calc(100vh - 80px);
		gap: 2rem;
	}

	.clock-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.controls-placeholder {
		display: flex;
		gap: 1rem;
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
