<script lang="ts">
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID, type DndEvent } from 'svelte-dnd-action';
	import { getContext } from 'svelte';
	import { isToday } from 'date-fns';
	import type { Task } from '@todo/shared';
	import type { GroupedColumn } from '$lib/data/view-grouping';
	import KanbanTaskCard from '../kanban/KanbanTaskCard.svelte';
	import QuickAddTaskInline from '../kanban/QuickAddTaskInline.svelte';
	import ViewColumnHeader from './ViewColumnHeader.svelte';
	import { tasksStore } from '$lib/stores/tasks.svelte';
	import { todoSettings } from '$lib/stores/settings.svelte';

	interface Props {
		columns: GroupedColumn[];
		onTaskDrop: (taskId: string, columnId: string) => void;
		onTaskToggle: (task: Task) => void;
		onTaskDelete: (taskId: string) => void;
		onTaskUpdate: (taskId: string, data: Partial<Task>) => void;
		onColumnRename?: (colIdx: number, name: string) => void;
		onColumnColorChange?: (colIdx: number, color: string) => void;
		onColumnMove?: (colIdx: number, dir: -1 | 1) => void;
		onColumnDelete?: (colIdx: number) => void;
		onAddColumn?: () => void;
	}

	let {
		columns,
		onTaskDrop,
		onTaskToggle,
		onTaskDelete,
		onTaskUpdate,
		onColumnRename,
		onColumnColorChange,
		onColumnMove,
		onColumnDelete,
		onAddColumn,
	}: Props = $props();

	// Today's completed tasks — shown at the bottom of every sheet
	const tasksCtx: { readonly value: Task[] } = getContext('tasks');
	let completedToday = $derived(
		tasksCtx.value.filter((t) => t.isCompleted && t.completedAt && isToday(new Date(t.completedAt)))
	);

	const PAGE_WIDTH_MAP: Record<string, string> = {
		narrow: 'min(360px, 85vw)',
		medium: 'min(480px, 85vw)',
		wide: 'min(640px, 90vw)',
		full: 'min(840px, 95vw)',
	};

	let sheetWidth = $derived(PAGE_WIDTH_MAP[todoSettings.pageWidth] || PAGE_WIDTH_MAP.medium);

	// Track active page for dots
	let scrollContainer: HTMLDivElement | undefined = $state();
	let activePage = $state(0);

	function handleScroll() {
		if (!scrollContainer) return;
		const sheets = scrollContainer.querySelectorAll('.fokus-sheet');
		const containerRect = scrollContainer.getBoundingClientRect();
		const center = containerRect.left + containerRect.width / 2;
		let closest = 0;
		let closestDist = Infinity;
		sheets.forEach((sheet, i) => {
			const rect = sheet.getBoundingClientRect();
			const dist = Math.abs(rect.left + rect.width / 2 - center);
			if (dist < closestDist) {
				closestDist = dist;
				closest = i;
			}
		});
		activePage = closest;
	}

	// Per-column local task state for DnD
	let localTasksByColumn = $state<Record<string, Task[]>>({});

	$effect(() => {
		const updated: Record<string, Task[]> = {};
		for (const col of columns) {
			updated[col.id] = [...col.tasks];
		}
		localTasksByColumn = updated;
	});

	function handleDndConsider(columnId: string, e: CustomEvent<DndEvent<Task>>) {
		localTasksByColumn = { ...localTasksByColumn, [columnId]: e.detail.items };
	}

	function handleDndFinalize(
		columnId: string,
		column: GroupedColumn,
		e: CustomEvent<DndEvent<Task>>
	) {
		const newItems = e.detail.items.filter((t) => t.id !== SHADOW_PLACEHOLDER_ITEM_ID);
		const movedTaskId = e.detail.info.id;
		const wasInThisColumn = column.tasks.some((t) => t.id === movedTaskId);

		if (!wasInThisColumn) {
			onTaskDrop(movedTaskId, column.id);
		} else {
			tasksStore.reorderTasks(newItems.map((t) => t.id));
		}

		localTasksByColumn = { ...localTasksByColumn, [columnId]: newItems };
	}

	function handleAddTask(column: GroupedColumn, title: string) {
		const createData: Record<string, unknown> = { title };
		if (column.onDrop) {
			if (column.onDrop.setPriority) createData.priority = column.onDrop.setPriority;
		}
		tasksStore.createTask(
			createData as {
				title: string;
				priority?: 'low' | 'medium' | 'high' | 'urgent';
			}
		);
	}
</script>

<div class="fokus-layout">
	<div
		class="fokus-track"
		style="--sheet-width: {sheetWidth}"
		bind:this={scrollContainer}
		onscroll={handleScroll}
	>
		{#each columns as column, i (column.id)}
			{@const tasks = localTasksByColumn[column.id] || column.tasks}
			<div class="fokus-sheet" class:sheet-completed={column.name === 'Erledigt'}>
				<ViewColumnHeader
					name={column.name}
					color={column.color}
					taskCount={tasks.length}
					columnIndex={i}
					totalColumns={columns.length}
					onRename={onColumnRename ? (name) => onColumnRename(i, name) : undefined}
					onColorChange={onColumnColorChange ? (c) => onColumnColorChange(i, c) : undefined}
					onMove={onColumnMove ? (dir) => onColumnMove(i, dir) : undefined}
					onDelete={onColumnDelete ? () => onColumnDelete(i) : undefined}
				/>

				<div class="sheet-body">
					<div
						class="sheet-content"
						use:dndzone={{
							items: tasks,
							flipDurationMs: 200,
							dropTargetStyle: {},
							dropTargetClasses: ['fokus-drop-target'],
							type: 'task-dnd',
						}}
						onconsider={(e) => handleDndConsider(column.id, e)}
						onfinalize={(e) => handleDndFinalize(column.id, column, e)}
					>
						{#each tasks.filter((t) => t.id !== SHADOW_PLACEHOLDER_ITEM_ID) as task (task.id)}
							<div class="task-card-wrapper">
								<KanbanTaskCard
									{task}
									onToggleComplete={() => onTaskToggle(task)}
									onSave={(data) => onTaskUpdate(task.id, data)}
									onDelete={() => onTaskDelete(task.id)}
								/>
							</div>
						{/each}
					</div>

					<div class="sheet-footer">
						<QuickAddTaskInline onAdd={(title) => handleAddTask(column, title)} />
					</div>

					{#if completedToday.length > 0}
						<div class="completed-today">
							<div class="completed-today-label">Heute erledigt</div>
							{#each completedToday as task (task.id)}
								<div class="completed-today-item">
									<KanbanTaskCard
										{task}
										onToggleComplete={() => onTaskToggle(task)}
										onSave={(data) => onTaskUpdate(task.id, data)}
										onDelete={() => onTaskDelete(task.id)}
									/>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/each}

		{#if onAddColumn}
			<div class="fokus-sheet add-sheet">
				<button class="add-sheet-btn" onclick={onAddColumn}>
					<span class="add-sheet-icon">+</span>
					<span class="add-sheet-label">Neues Board</span>
				</button>
			</div>
		{/if}
	</div>

	<!-- Page dots -->
	{#if columns.length > 1}
		<div class="page-dots">
			{#each columns as _, i}
				<div class="page-dot" class:active={activePage === i}></div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.fokus-layout {
		padding-bottom: 100px;
	}

	.fokus-track {
		display: flex;
		gap: 1.5rem;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scroll-padding: 1.5rem;
		padding: 1rem 1.5rem 1rem;
		scrollbar-width: none;
	}
	.fokus-track::-webkit-scrollbar {
		display: none;
	}

	.fokus-sheet {
		flex: 0 0 auto;
		width: var(--sheet-width, min(840px, 85vw));
		min-height: 60vh;
		scroll-snap-align: center;
		background: #fffef5;
		border-radius: 0.375rem;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.08),
			0 0 0 1px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
	}
	:global(.dark) .fokus-sheet {
		background-color: #252220;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(255, 255, 255, 0.06);
	}
	.sheet-completed {
		opacity: 0.75;
	}

	.sheet-body {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.sheet-content {
		padding: 0.75rem 1rem;
		min-height: 120px;
	}

	.task-card-wrapper {
		margin-bottom: 0.5rem;
	}
	.task-card-wrapper:last-child {
		margin-bottom: 0;
	}

	.sheet-footer {
		padding: 0;
	}

	:global(.fokus-drop-target) {
		outline: 2px dashed var(--color-primary);
		outline-offset: -2px;
		border-radius: 0.375rem;
		background: color-mix(in srgb, var(--color-primary) 4%, transparent);
	}

	/* Add sheet */
	.add-sheet {
		border: 2px dashed color-mix(in srgb, var(--color-primary) 30%, transparent) !important;
		background: color-mix(in srgb, var(--color-primary) 2%, transparent) !important;
		box-shadow: none !important;
	}
	.add-sheet:hover {
		border-color: var(--color-primary) !important;
		background: color-mix(in srgb, var(--color-primary) 6%, transparent) !important;
	}

	.add-sheet-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		height: 100%;
		min-height: 200px;
		background: transparent;
		border: none;
		cursor: pointer;
	}
	.add-sheet-icon {
		font-size: 2rem;
		font-weight: 300;
		color: var(--color-primary);
		line-height: 1;
	}
	.add-sheet-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-primary);
	}

	/* Heute erledigt section */
	.completed-today {
		padding: 0.75rem 1rem 1rem;
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		margin-top: 0.25rem;
	}
	:global(.dark) .completed-today {
		border-top-color: rgba(255, 255, 255, 0.08);
	}
	.completed-today-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: rgba(0, 0, 0, 0.3);
		margin-bottom: 0.5rem;
	}
	:global(.dark) .completed-today-label {
		color: rgba(255, 255, 255, 0.3);
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.completed-today-item {
		animation: slideDown 0.35s ease-out both;
	}

	/* Page dots */
	.page-dots {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 0;
	}
	.page-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-border);
		transition: all 0.2s ease;
	}
	.page-dot.active {
		background: var(--color-primary);
		transform: scale(1.3);
	}
</style>
