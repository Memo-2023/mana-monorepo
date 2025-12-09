<script lang="ts">
	/**
	 * KanbanColumnSkeleton - Skeleton for a single kanban column
	 */

	import { SkeletonBox } from '@manacore/shared-ui';

	interface Props {
		taskCount?: number;
	}

	let { taskCount = 3 }: Props = $props();
</script>

<div class="column-skeleton">
	<!-- Column Header -->
	<div class="column-header">
		<div class="header-left">
			<SkeletonBox width="8px" height="100%" borderRadius="4px" />
			<SkeletonBox width="100px" height="18px" />
			<SkeletonBox width="24px" height="20px" borderRadius="10px" />
		</div>
		<SkeletonBox width="24px" height="24px" borderRadius="6px" />
	</div>

	<!-- Tasks -->
	<div class="tasks">
		{#each Array(taskCount) as _, i}
			<div class="task-card" style="opacity: {Math.max(0.4, 1 - i * 0.2)};">
				<SkeletonBox width="75%" height="16px" />
				<div class="task-meta">
					<SkeletonBox width="60px" height="14px" />
					<SkeletonBox width="20px" height="20px" borderRadius="4px" />
				</div>
			</div>
		{/each}
	</div>

	<!-- Add Task Button -->
	<div class="add-task">
		<SkeletonBox width="100%" height="36px" borderRadius="8px" />
	</div>
</div>

<style>
	.column-skeleton {
		width: 300px;
		min-width: 300px;
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 1rem;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.column-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		height: 24px;
	}

	.tasks {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-height: 100px;
	}

	.task-card {
		padding: 0.75rem;
		background: hsl(var(--background));
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.task-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.add-task {
		margin-top: auto;
		padding-top: 0.5rem;
	}
</style>
