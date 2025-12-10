<script lang="ts">
	/**
	 * TagCardSkeleton - Skeleton for a single tag card
	 */

	import { SkeletonBox } from '@manacore/shared-ui';

	interface Props {
		/** Opacity for fade effect */
		opacity?: number;
	}

	let { opacity = 1 }: Props = $props();
</script>

<div class="tag-card-skeleton" style="opacity: {opacity};" role="status" aria-label="Laden...">
	<!-- Color dot + Name -->
	<div class="flex items-center gap-3">
		<SkeletonBox width="12px" height="12px" borderRadius="50%" />
		<SkeletonBox width="60%" height="18px" />
	</div>

	<!-- Contact count -->
	<div class="mt-2">
		<SkeletonBox width="40%" height="14px" />
	</div>
</div>

<style>
	.tag-card-skeleton {
		padding: 1rem;
		background-color: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-lg);
	}
</style>
