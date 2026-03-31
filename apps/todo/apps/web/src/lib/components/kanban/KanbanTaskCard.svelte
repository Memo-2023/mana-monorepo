<script lang="ts">
	import type { Task } from '@todo/shared';
	import { isToday, isPast } from 'date-fns';
	import { formatDueDate } from '$lib/utils/date-display';
	import { getSubtaskProgress } from '$lib/utils/task-helpers';
	import { ConfirmationModal, ContactAvatar } from '@manacore/shared-ui';
	import TaskEditModal from '../TaskEditModal.svelte';
	import {
		ArrowsClockwise,
		CalendarBlank,
		Check,
		CheckSquare,
		Note,
		Trash,
	} from '@manacore/shared-icons';
	import { PRIORITY_BG_CLASSES } from '$lib/constants/priority';

	interface Props {
		task: Task;
		onToggleComplete?: () => void;
		onSave?: (data: Partial<Task>) => void;
		onDelete?: () => void;
	}

	let { task, onToggleComplete, onSave, onDelete }: Props = $props();

	// Modal state
	let showModal = $state(false);
	let showDeleteConfirm = $state(false);

	// Completion animation
	let isAnimatingComplete = $state(false);

	// Inline edit state
	let isEditingTitle = $state(false);
	let editTitle = $state('');
	let titleInputRef = $state<HTMLInputElement | null>(null);

	// Context menu state
	let showContextMenu = $state(false);
	let contextMenuX = $state(0);
	let contextMenuY = $state(0);

	const priorityColors = PRIORITY_BG_CLASSES;

	// Format due date
	let dueDateText = $derived(() => {
		if (!task.dueDate) return null;
		return formatDueDate(new Date(task.dueDate));
	});

	// Check if overdue
	let isOverdue = $derived(() => {
		if (!task.dueDate || task.isCompleted) return false;
		const date = new Date(task.dueDate);
		return isPast(date) && !isToday(date);
	});

	// Subtasks progress
	let subtaskProgress = $derived(() => getSubtaskProgress(task.subtasks ?? undefined));

	// Click to open modal
	function handleCardClick(e: MouseEvent) {
		// Don't open modal if clicking on checkbox or during inline edit or animation
		if (isEditingTitle || isAnimatingComplete) return;
		const target = e.target as HTMLElement;
		if (target.closest('.task-checkbox')) return;
		showModal = true;
	}

	function handleCheckboxClick(e: MouseEvent) {
		e.stopPropagation();
		if (task.isCompleted) {
			onToggleComplete?.();
			return;
		}
		if (isAnimatingComplete) return;
		isAnimatingComplete = true;
		setTimeout(() => {
			isAnimatingComplete = false;
			onToggleComplete?.();
		}, 500);
	}

	// Double-click to edit title inline
	function handleTitleDoubleClick(e: MouseEvent) {
		e.stopPropagation();
		editTitle = task.title;
		isEditingTitle = true;
		// Focus input after render
		setTimeout(() => {
			titleInputRef?.focus();
			titleInputRef?.select();
		}, 0);
	}

	// Save inline title edit
	function saveInlineTitle() {
		if (editTitle.trim() && editTitle.trim() !== task.title) {
			onSave?.({ title: editTitle.trim() });
		}
		isEditingTitle = false;
	}

	// Cancel inline title edit
	function cancelInlineTitle() {
		isEditingTitle = false;
		editTitle = '';
	}

	// Handle title input keydown
	function handleTitleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			saveInlineTitle();
		} else if (e.key === 'Escape') {
			e.preventDefault();
			cancelInlineTitle();
		}
	}

	// Right-click context menu
	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		contextMenuX = e.clientX;
		contextMenuY = e.clientY;
		showContextMenu = true;
	}

	// Close context menu when clicking outside
	function handleClickOutside() {
		showContextMenu = false;
	}

	// Context menu actions
	function handleContextEdit() {
		showContextMenu = false;
		showModal = true;
	}

	function handleContextToggleComplete() {
		showContextMenu = false;
		onToggleComplete?.();
	}

	function handleContextDelete() {
		showContextMenu = false;
		showDeleteConfirm = true;
	}

	function confirmDelete() {
		showDeleteConfirm = false;
		onDelete?.();
	}

	// Modal handlers
	function handleModalClose() {
		showModal = false;
	}

	function handleModalSave(data: Partial<Task>) {
		onSave?.(data);
		showModal = false;
	}

	function handleModalDelete(taskId: string) {
		onDelete?.();
		showModal = false;
	}

	function toggleSubtask(subtaskId: string) {
		if (!onSave) return;
		const subtasks = $state.snapshot(task.subtasks) ?? [];
		const updated = subtasks.map((s) =>
			s.id === subtaskId
				? {
						...s,
						isCompleted: !s.isCompleted,
						completedAt: !s.isCompleted ? new Date().toISOString() : null,
					}
				: s
		);
		onSave({ subtasks: updated });
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div
	class="kanban-card group"
	class:completed={task.isCompleted}
	class:completing={isAnimatingComplete}
	onclick={handleCardClick}
	oncontextmenu={handleContextMenu}
	role="button"
	tabindex="0"
>
	<!-- Priority indicator -->
	<div class="priority-dot" style="background-color: {priorityColors[task.priority]}"></div>

	<!-- Checkbox -->
	{#if onToggleComplete}
		<button
			class="task-checkbox"
			class:checked={task.isCompleted || isAnimatingComplete}
			onclick={handleCheckboxClick}
		>
			{#if task.isCompleted || isAnimatingComplete}
				<Check size={20} class="check-icon" />
			{/if}
		</button>
	{/if}

	<!-- Content -->
	<div class="task-content">
		{#if isEditingTitle}
			<input
				bind:this={titleInputRef}
				type="text"
				class="title-input"
				bind:value={editTitle}
				onkeydown={handleTitleKeydown}
				onblur={saveInlineTitle}
			/>
		{:else}
			<span
				class="task-title"
				class:line-through={task.isCompleted || isAnimatingComplete}
				ondblclick={handleTitleDoubleClick}
			>
				{task.title}
			</span>
		{/if}

		<!-- Meta info -->
		{#if dueDateText() || subtaskProgress() || (task.labels && task.labels.length > 0)}
			<div class="task-meta">
				{#if dueDateText()}
					<span class="meta-item" class:overdue={isOverdue()}>
						<CalendarBlank size={20} class="meta-icon" />
						{dueDateText()}
					</span>
				{/if}

				{#if subtaskProgress()}
					<span class="meta-item">
						<CheckSquare size={20} class="meta-icon" />
						{subtaskProgress()}
					</span>
				{/if}

				{#if task.labels && task.labels.length > 0}
					{#each task.labels.slice(0, 2) as label}
						<span class="label-tag" style="--label-color: {label.color}">
							{label.name}
						</span>
					{/each}
					{#if task.labels.length > 2}
						<span class="meta-item">+{task.labels.length - 2}</span>
					{/if}
				{/if}
			</div>
		{/if}
	</div>

	<!-- Contacts display -->
	{#if task.metadata?.assignee || (task.metadata?.involvedContacts && task.metadata.involvedContacts.length > 0)}
		<div class="contacts-display">
			{#if task.metadata?.assignee}
				<div class="assignee-avatar" title="Zuständig: {task.metadata.assignee.displayName}">
					<ContactAvatar
						name={task.metadata.assignee.displayName}
						photoUrl={task.metadata.assignee.photoUrl}
						size="xs"
					/>
				</div>
			{/if}
			{#if task.metadata?.involvedContacts && task.metadata.involvedContacts.length > 0}
				<div class="involved-avatars">
					{#each task.metadata.involvedContacts.slice(0, 2) as contact}
						<div class="involved-avatar" title="Beteiligt: {contact.displayName}">
							<ContactAvatar name={contact.displayName} photoUrl={contact.photoUrl} size="xs" />
						</div>
					{/each}
					{#if task.metadata.involvedContacts.length > 2}
						<span class="more-contacts">+{task.metadata.involvedContacts.length - 2}</span>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Inline subtasks -->
{#if task.subtasks && task.subtasks.length > 0 && !task.isCompleted}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="subtasks-inline" onpointerdown={(e) => e.stopPropagation()}>
		{#each task.subtasks as subtask (subtask.id)}
			<button
				class="subtask-row"
				class:done={subtask.isCompleted}
				onclick={(e) => {
					e.stopPropagation();
					toggleSubtask(subtask.id);
				}}
			>
				<span class="subtask-check" class:checked={subtask.isCompleted}>
					{#if subtask.isCompleted}<Check size={10} />{/if}
				</span>
				<span class="subtask-title">{subtask.title}</span>
			</button>
		{/each}
	</div>
{/if}

<!-- Context Menu -->
{#if showContextMenu}
	<div
		class="context-menu"
		style="left: {contextMenuX}px; top: {contextMenuY}px"
		onclick={(e) => e.stopPropagation()}
	>
		<button class="context-item" onclick={handleContextEdit}>
			<Note size={20} class="context-icon" />
			Bearbeiten
		</button>
		<button class="context-item" onclick={handleContextToggleComplete}>
			<ArrowsClockwise size={20} class="context-icon" />
			{task.isCompleted ? 'Wiederherstellen' : 'Erledigen'}
		</button>
		<div class="context-divider"></div>
		<button class="context-item danger" onclick={handleContextDelete}>
			<Trash size={20} class="context-icon" />
			Löschen
		</button>
	</div>
{/if}

<!-- Task Edit Modal -->
<TaskEditModal
	{task}
	open={showModal}
	onClose={handleModalClose}
	onSave={handleModalSave}
	onDelete={handleModalDelete}
/>

<!-- Delete confirmation modal -->
<ConfirmationModal
	visible={showDeleteConfirm}
	onClose={() => (showDeleteConfirm = false)}
	onConfirm={confirmDelete}
	variant="danger"
	title="Aufgabe löschen?"
	message="Diese Aufgabe wird unwiderruflich gelöscht."
	confirmLabel="Löschen"
	cancelLabel="Abbrechen"
/>

<style>
	/* Paper-style: no card, no border, just text on the page */
	.kanban-card {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		padding: 0.2rem 0;
		background: transparent;
		border: none;
		box-shadow: none;
		border-radius: 0;
		transition: opacity 0.15s;
		user-select: none;
		cursor: pointer;
	}

	.kanban-card:active {
		cursor: grabbing;
	}

	.kanban-card:hover {
		opacity: 0.85;
	}

	.kanban-card.completed {
		opacity: 0.45;
	}

	.kanban-card.completing {
		opacity: 0.5;
		pointer-events: none;
		transition: opacity 0.4s ease;
	}

	@keyframes checkPop {
		0% {
			transform: scale(0.5);
			opacity: 0;
		}
		60% {
			transform: scale(1.25);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	.task-checkbox.checked {
		animation: checkPop 0.3s ease-out;
	}

	/* Priority dot — slim left accent, aligned to first line */
	.priority-dot {
		width: 3px;
		height: 1rem;
		border-radius: 2px;
		flex-shrink: 0;
		margin-top: 0.2rem;
	}

	/* Checkbox — sized to match title text height, aligned to first line */
	.task-checkbox {
		width: 1.1rem;
		height: 1.1rem;
		border-radius: 50%;
		border: 1.5px solid rgba(0, 0, 0, 0.3);
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
		padding: 0;
		margin-top: 0.2rem;
	}

	:global(.dark) .task-checkbox {
		border-color: rgba(255, 255, 255, 0.35);
	}

	.task-checkbox:hover {
		border-color: #8b5cf6;
		background: rgba(139, 92, 246, 0.08);
	}

	.task-checkbox.checked {
		background: #8b5cf6;
		border-color: #8b5cf6;
	}

	.check-icon {
		width: 0.6rem;
		height: 0.6rem;
		color: white;
	}

	/* Content */
	.task-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.task-title {
		font-size: 0.9375rem;
		font-weight: 400;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		line-height: 1.4;
		word-break: break-word;
	}

	:global(.dark) .task-title {
		color: hsl(var(--color-foreground));
	}

	.task-title.line-through {
		text-decoration: line-through;
		opacity: 0.5;
	}

	/* Inline title input */
	.title-input {
		width: 100%;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		background: rgba(255, 255, 255, 0.9);
		border: 1px solid #8b5cf6;
		border-radius: 0.5rem;
		padding: 0.25rem 0.5rem;
		outline: none;
	}

	:global(.dark) .title-input {
		background: rgba(30, 30, 30, 0.9);
		color: #f3f4f6;
		border-color: #8b5cf6;
	}

	/* Meta info */
	.task-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: #6b7280;
	}

	:global(.dark) .meta-item {
		color: #9ca3af;
	}

	.meta-item.overdue {
		color: #ef4444;
	}

	.meta-icon {
		width: 0.75rem;
		height: 0.75rem;
	}

	.label-tag {
		font-size: 0.625rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: color-mix(in srgb, var(--label-color) 15%, transparent);
		color: var(--label-color);
		font-weight: 500;
	}

	/* Contacts display */
	.contacts-display {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.assignee-avatar {
		position: relative;
	}

	.assignee-avatar::after {
		content: '';
		position: absolute;
		bottom: -1px;
		right: -1px;
		width: 6px;
		height: 6px;
		background: #8b5cf6;
		border-radius: 50%;
		border: 1px solid white;
	}

	:global(.dark) .assignee-avatar::after {
		border-color: rgba(30, 30, 30, 1);
	}

	.involved-avatars {
		display: flex;
		align-items: center;
	}

	.involved-avatar {
		margin-left: -0.375rem;
	}

	.involved-avatar:first-child {
		margin-left: 0;
	}

	.more-contacts {
		font-size: 0.625rem;
		color: #6b7280;
		margin-left: 0.25rem;
		font-weight: 500;
	}

	:global(.dark) .more-contacts {
		color: #9ca3af;
	}

	/* Context Menu */
	.context-menu {
		position: fixed;
		z-index: 100;
		min-width: 160px;
		padding: 0.375rem;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 0.75rem;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
	}

	:global(.dark) .context-menu {
		background: rgba(40, 40, 40, 0.95);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.context-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		background: transparent;
		font-size: 0.875rem;
		color: #374151;
		cursor: pointer;
		border-radius: 0.5rem;
		transition: background 0.15s;
		text-align: left;
	}

	:global(.dark) .context-item {
		color: #e5e7eb;
	}

	.context-item:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .context-item:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.context-item.danger {
		color: #ef4444;
	}

	.context-item.danger:hover {
		background: rgba(239, 68, 68, 0.1);
	}

	.context-icon {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
	}

	.context-divider {
		height: 1px;
		background: rgba(0, 0, 0, 0.1);
		margin: 0.25rem 0.5rem;
	}

	:global(.dark) .context-divider {
		background: rgba(255, 255, 255, 0.1);
	}

	/* Inline subtasks — same size as title, just indented */
	.subtasks-inline {
		display: flex;
		flex-direction: column;
		/* indent = priority-dot(3px) + gap(0.625rem) + checkbox(1.1rem) + gap(0.625rem) */
		padding-left: calc(3px + 0.625rem + 1.1rem + 0.625rem);
		margin-top: 0;
		position: relative;
	}

	.subtasks-inline::before {
		content: '';
		position: absolute;
		left: calc(3px + 0.625rem + 0.55rem);
		top: 0.2rem;
		bottom: 0.3rem;
		width: 1px;
		background: rgba(0, 0, 0, 0.15);
	}

	:global(.dark) .subtasks-inline::before {
		background: rgba(255, 255, 255, 0.15);
	}

	.subtask-row {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		padding: 0.15rem 0;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		width: 100%;
	}

	.subtask-check {
		width: 1.1rem;
		height: 1.1rem;
		border-radius: 50%;
		border: 1.5px solid rgba(0, 0, 0, 0.3);
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.15s;
		color: white;
		margin-top: 0.2rem;
	}

	:global(.dark) .subtask-check {
		border-color: rgba(255, 255, 255, 0.35);
	}

	.subtask-check:hover {
		border-color: #8b5cf6;
	}

	.subtask-check.checked {
		background: #8b5cf6;
		border-color: #8b5cf6;
	}

	.subtask-title {
		font-size: 0.9375rem;
		font-weight: 400;
		color: hsl(var(--color-foreground));
		line-height: 1.4;
		word-break: break-word;
	}

	:global(.dark) .subtask-title {
		color: hsl(var(--color-foreground));
	}

	.subtask-row.done .subtask-title {
		text-decoration: line-through;
		opacity: 0.45;
	}
</style>
