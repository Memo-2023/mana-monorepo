<script lang="ts">
	/**
	 * TaskListSkeleton - Skeleton for task list with sections
	 */

	import { SkeletonBox } from '@manacore/shared-ui';
	import TaskItemSkeleton from './TaskItemSkeleton.svelte';

	interface Props {
		sections?: number;
		tasksPerSection?: number;
	}

	let { sections = 2, tasksPerSection = 3 }: Props = $props();
</script>

<div class="task-list-skeleton" role="status" aria-label="Aufgaben werden geladen...">
	{#each Array(sections) as _, sectionIndex}
		<div class="section" style="opacity: {Math.max(0.5, 1 - sectionIndex * 0.25)};">
			<!-- Section header -->
			<div class="section-header">
				<div class="section-title">
					<SkeletonBox width="20px" height="20px" borderRadius="6px" />
					<SkeletonBox width="{100 + sectionIndex * 20}px" height="18px" />
					<SkeletonBox width="28px" height="22px" borderRadius="11px" />
				</div>
				<SkeletonBox width="24px" height="24px" borderRadius="6px" />
			</div>

			<!-- Tasks -->
			<div class="tasks">
				{#each Array(tasksPerSection) as _, taskIndex}
					<div style="opacity: {Math.max(0.4, 1 - taskIndex * 0.2)};">
						<TaskItemSkeleton />
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.task-list-skeleton {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.tasks {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
</style>
