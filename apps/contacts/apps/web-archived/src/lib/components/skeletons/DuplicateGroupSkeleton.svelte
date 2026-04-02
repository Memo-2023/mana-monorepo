<script lang="ts">
	/**
	 * DuplicateGroupSkeleton - Skeleton for a duplicate group card
	 * Matches the duplicates page layout
	 */

	import { SkeletonBox, SkeletonAvatar } from '@manacore/shared-ui';

	interface Props {
		/** Number of contact placeholders to show */
		contactCount?: number;
		/** Opacity for fade effect */
		opacity?: number;
	}

	let { contactCount = 3, opacity = 1 }: Props = $props();
</script>

<div
	class="duplicate-group-skeleton"
	style="opacity: {opacity};"
	role="status"
	aria-label="Laden..."
>
	<!-- Group header -->
	<div class="group-header">
		<div class="flex items-center gap-3">
			<SkeletonBox width="40px" height="40px" borderRadius="8px" />
			<div class="space-y-2">
				<SkeletonBox width="200px" height="16px" />
				<SkeletonBox width="140px" height="14px" />
			</div>
		</div>
		<SkeletonBox width="120px" height="36px" borderRadius="8px" />
	</div>

	<!-- Contacts preview -->
	<div class="group-content">
		<div class="contacts-grid">
			{#each Array(contactCount) as _, i}
				<div class="contact-preview">
					<SkeletonAvatar size="40px" />
					<div class="space-y-1.5 flex-1 min-w-0">
						<SkeletonBox width="70%" height="14px" />
						<SkeletonBox width="50%" height="12px" />
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.duplicate-group-skeleton {
		background-color: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.group-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: 1px solid hsl(var(--border));
		background: hsl(var(--muted) / 0.3);
	}

	.group-content {
		padding: 1rem;
	}

	.contacts-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.contact-preview {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: hsl(var(--muted) / 0.2);
		border-radius: 0.5rem;
		padding: 0.75rem;
		min-width: 200px;
	}
</style>
