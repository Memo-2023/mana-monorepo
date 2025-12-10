<script lang="ts">
	/**
	 * TaskItemSkeleton - Skeleton for a single task item
	 */

	import { SkeletonBox } from '@manacore/shared-ui';

	interface Props {
		showSubtasks?: boolean;
	}

	let { showSubtasks = false }: Props = $props();
</script>

<div class="task-item-skeleton">
	<div class="task-main">
		<SkeletonBox width="22px" height="22px" borderRadius="6px" />
		<div class="task-content">
			<SkeletonBox width="65%" height="18px" />
			<div class="task-meta">
				<SkeletonBox width="80px" height="14px" />
				<SkeletonBox width="60px" height="20px" borderRadius="10px" />
			</div>
		</div>
		<SkeletonBox width="20px" height="20px" borderRadius="4px" />
	</div>

	{#if showSubtasks}
		<div class="subtasks">
			{#each Array(2) as _}
				<div class="subtask-item">
					<SkeletonBox width="16px" height="16px" borderRadius="4px" />
					<SkeletonBox width="50%" height="14px" />
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.task-item-skeleton {
		padding: 0.875rem 1rem;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 12px;
	}

	.task-main {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.task-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.task-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.subtasks {
		margin-top: 0.75rem;
		padding-left: 2rem;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.subtask-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
