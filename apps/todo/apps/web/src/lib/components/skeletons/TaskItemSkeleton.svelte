<script lang="ts">
	/**
	 * TaskItemSkeleton - Skeleton for a single task item in list view
	 * Matches the flat row style inside the notepad container
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
</script>

<div class="task-item-skeleton">
	<!-- Drag handle -->
	<div class="drag-handle">
		<SkeletonBox width="16px" height="16px" borderRadius="2px" />
	</div>

	<!-- Priority dot -->
	<SkeletonBox width="8px" height="8px" borderRadius="9999px" />

	<!-- Checkbox (round) -->
	<SkeletonBox width="20px" height="20px" borderRadius="9999px" />

	<!-- Content -->
	<div class="task-content">
		<SkeletonBox width="60%" height="16px" borderRadius="4px" />
		<div class="task-meta">
			<SkeletonBox width="40px" height="12px" borderRadius="4px" />
			<SkeletonBox width="48px" height="16px" borderRadius="9999px" />
		</div>
	</div>

	<!-- Due date / expand area -->
	<SkeletonBox width="50px" height="14px" borderRadius="4px" />
</div>

<style>
	.task-item-skeleton {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	:global(.dark) .task-item-skeleton {
		border-bottom-color: rgba(255, 255, 255, 0.08);
	}

	.drag-handle {
		opacity: 0.3;
		flex-shrink: 0;
	}

	.task-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.task-meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
</style>
