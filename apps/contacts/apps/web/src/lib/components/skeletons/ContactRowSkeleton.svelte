<script lang="ts">
	/**
	 * ContactRowSkeleton - Skeleton for a single contact list row
	 * Matches the layout of ContactListView.svelte
	 */

	import { SkeletonBox, SkeletonAvatar } from '@manacore/shared-ui';

	interface Props {
		/** Opacity for fade effect */
		opacity?: number;
	}

	let { opacity = 1 }: Props = $props();
</script>

<div class="contact-row-skeleton" style="opacity: {opacity};" role="status" aria-label="Laden...">
	<!-- Avatar -->
	<SkeletonAvatar size="48px" />

	<!-- Contact Info -->
	<div class="flex-1 min-w-0 space-y-1.5">
		<!-- Name -->
		<SkeletonBox width="55%" height="18px" />
		<!-- Job/Company -->
		<SkeletonBox width="40%" height="14px" />
		<!-- Email -->
		<SkeletonBox width="65%" height="14px" />
	</div>

	<!-- Favorite button placeholder -->
	<SkeletonBox width="36px" height="36px" borderRadius="50%" />
</div>

<style>
	.contact-row-skeleton {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		background-color: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-lg);
	}
</style>
