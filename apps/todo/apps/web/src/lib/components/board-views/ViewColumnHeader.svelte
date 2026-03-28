<script lang="ts">
	interface Props {
		name: string;
		color: string;
		taskCount: number;
	}

	let { name, color, taskCount }: Props = $props();
</script>

<div class="column-header">
	<div class="header-left">
		<span class="color-dot" style="background-color: {color}"></span>
		<span class="column-name">{name}</span>
	</div>
	<span class="task-count">{taskCount}</span>
</div>

<style>
	.column-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.color-dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.column-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.dark) .column-name {
		color: #f3f4f6;
	}

	.task-count {
		font-size: 0.75rem;
		font-weight: 500;
		color: #9ca3af;
		background: rgba(0, 0, 0, 0.05);
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	:global(.dark) .task-count {
		background: rgba(255, 255, 255, 0.1);
		color: #6b7280;
	}
</style>
