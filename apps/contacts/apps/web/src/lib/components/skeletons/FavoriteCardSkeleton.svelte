<script lang="ts">
	/**
	 * FavoriteCardSkeleton - Skeleton for a favorite contact card
	 * Matches the FavoriteCardView layout
	 */

	import { SkeletonBox, SkeletonAvatar } from '@manacore/shared-ui';

	interface Props {
		/** Opacity for fade effect */
		opacity?: number;
	}

	let { opacity = 1 }: Props = $props();
</script>

<div class="favorite-card-skeleton" style="opacity: {opacity};" role="status" aria-label="Laden...">
	<!-- Header with gradient background placeholder -->
	<div class="card-header">
		<SkeletonAvatar size="80px" />
	</div>

	<!-- Content -->
	<div class="card-content">
		<!-- Name -->
		<div class="flex justify-center mb-2">
			<SkeletonBox width="70%" height="20px" />
		</div>

		<!-- Job/Company -->
		<div class="flex justify-center mb-1">
			<SkeletonBox width="50%" height="14px" />
		</div>

		<!-- Contact info -->
		<div class="flex justify-center gap-2 mt-3">
			<SkeletonBox width="36px" height="36px" borderRadius="50%" />
			<SkeletonBox width="36px" height="36px" borderRadius="50%" />
		</div>
	</div>
</div>

<style>
	.favorite-card-skeleton {
		background-color: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.card-header {
		display: flex;
		justify-content: center;
		padding: 1.5rem;
		background: linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--muted) / 0.5) 100%);
	}

	.card-content {
		padding: 1rem;
		text-align: center;
	}
</style>
