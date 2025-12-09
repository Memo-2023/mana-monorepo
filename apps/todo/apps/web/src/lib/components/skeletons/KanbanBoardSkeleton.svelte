<script lang="ts">
	/**
	 * KanbanBoardSkeleton - Skeleton for kanban board loading
	 */

	import KanbanColumnSkeleton from './KanbanColumnSkeleton.svelte';
</script>

<div class="kanban-skeleton" role="status" aria-label="Kanban Board wird geladen...">
	<div class="columns-container">
		<KanbanColumnSkeleton taskCount={3} />
		<KanbanColumnSkeleton taskCount={4} />
		<KanbanColumnSkeleton taskCount={2} />
		<div class="add-column-skeleton">
			<div class="add-column-btn"></div>
		</div>
	</div>
</div>

<style>
	.kanban-skeleton {
		height: 100%;
		min-height: 400px;
	}

	.columns-container {
		display: flex;
		gap: 1rem;
		padding: 0 1rem;
		height: 100%;
		align-items: flex-start;
		overflow-x: auto;
	}

	.add-column-skeleton {
		flex-shrink: 0;
	}

	.add-column-btn {
		width: 300px;
		min-width: 300px;
		height: 48px;
		background: hsl(var(--muted) / 0.5);
		border: 2px dashed hsl(var(--border));
		border-radius: 1rem;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.5;
		}
		50% {
			opacity: 0.3;
		}
	}

	@media (min-width: 640px) {
		.columns-container {
			padding: 0 1.5rem;
		}
	}

	@media (min-width: 1024px) {
		.columns-container {
			padding: 0 2rem;
		}
	}
</style>
