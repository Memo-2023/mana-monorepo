<script lang="ts">
	/**
	 * ContactCardSkeleton - Skeleton for a single contact grid card
	 * Matches the layout of ContactGridView.svelte
	 */

	import { SkeletonBox, SkeletonAvatar } from '@manacore/shared-ui';

	interface Props {
		/** Opacity for fade effect */
		opacity?: number;
	}

	let { opacity = 1 }: Props = $props();
</script>

<div class="contact-card-skeleton" style="opacity: {opacity};" role="status" aria-label="Laden...">
	<!-- Favorite button placeholder (top right) -->
	<div class="absolute top-3 right-3">
		<SkeletonBox width="24px" height="24px" borderRadius="50%" />
	</div>

	<!-- Avatar -->
	<SkeletonAvatar size="100px" />

	<!-- Contact Info -->
	<div class="w-full space-y-2 mt-4 text-center">
		<!-- Name -->
		<div class="flex justify-center">
			<SkeletonBox width="70%" height="18px" />
		</div>
		<!-- Job Title -->
		<div class="flex justify-center">
			<SkeletonBox width="50%" height="14px" />
		</div>
		<!-- Company -->
		<div class="flex justify-center">
			<SkeletonBox width="40%" height="12px" />
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="grid-actions">
		<SkeletonBox width="40px" height="40px" borderRadius="50%" />
		<SkeletonBox width="40px" height="40px" borderRadius="50%" />
	</div>
</div>

<style>
	.contact-card-skeleton {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 1rem;
		background-color: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-lg);
	}

	.grid-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--border));
		width: 100%;
		justify-content: center;
	}
</style>
