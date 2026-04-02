<script lang="ts">
	/**
	 * KanbanColumnSkeleton - Skeleton matching the glassmorphism kanban column
	 */

	import { SkeletonBox } from '@manacore/shared-ui';

	interface Props {
		taskCount?: number;
	}

	let { taskCount = 3 }: Props = $props();
</script>

<div class="column-skeleton">
	<!-- Column Header: color dot with ring + name + count -->
	<div class="column-header">
		<div class="header-left">
			<!-- Color indicator dot with glow ring -->
			<div class="color-dot-wrapper">
				<SkeletonBox width="12px" height="12px" borderRadius="9999px" />
			</div>
			<!-- Column name -->
			<SkeletonBox width="90px" height="16px" borderRadius="4px" />
			<!-- Task count -->
			<SkeletonBox width="20px" height="16px" borderRadius="4px" />
		</div>
		<!-- Menu button -->
		<SkeletonBox width="24px" height="24px" borderRadius="6px" />
	</div>

	<!-- Tasks (pill-shaped cards) -->
	<div class="tasks">
		{#each Array(taskCount) as _, i}
			<div class="task-card" style="opacity: {Math.max(0.4, 1 - i * 0.15)};">
				<!-- Priority dot -->
				<SkeletonBox width="8px" height="8px" borderRadius="9999px" />
				<!-- Checkbox -->
				<SkeletonBox width="20px" height="20px" borderRadius="9999px" />
				<!-- Content -->
				<div class="task-content">
					<SkeletonBox width="{65 + (i % 3) * 10}%" height="14px" borderRadius="4px" />
					{#if i === 0}
						<div class="task-meta">
							<SkeletonBox width="40px" height="12px" borderRadius="4px" />
							<SkeletonBox width="36px" height="14px" borderRadius="9999px" />
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Quick add task area -->
	<div class="add-task">
		<SkeletonBox width="100%" height="40px" borderRadius="9999px" />
	</div>
</div>

<style>
	.column-skeleton {
		width: 300px;
		min-width: 300px;
		max-width: 340px;
		min-height: 250px;
		background: rgba(255, 255, 255, 0.5);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 1.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: column;
	}

	:global(.dark) .column-skeleton {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	/* Header: matches KanbanColumnHeader px-3.5 py-3 */
	.column-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 0.875rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.color-dot-wrapper {
		position: relative;
	}

	/* Tasks container: matches px-3 pb-3 */
	.tasks {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 0 0.75rem;
		flex: 1;
		min-height: 80px;
	}

	/* Task card: pill-shaped glassmorphism card */
	.task-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 1rem;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .task-card {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
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

	/* Quick add: matches px-3 pb-3 pt-2 */
	.add-task {
		margin-top: auto;
		padding: 0.5rem 0.75rem 0.75rem;
	}
</style>
