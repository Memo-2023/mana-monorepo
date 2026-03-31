<script lang="ts">
	import type { Task, Subtask, UpdateTaskInput } from '@todo/shared';
	import { STATUS_OPTIONS, RECURRENCE_OPTIONS } from '@todo/shared';
	import { format, isToday, isPast } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { formatDueDate } from '$lib/utils/date-display';
	import { getSubtaskProgress } from '$lib/utils/task-helpers';
	import { useTaskForm } from '$lib/composables/useTaskForm.svelte';
	import { contactsStore } from '$lib/stores/contacts.svelte';
	import { ContactAvatar, ContactSelector } from '@manacore/shared-ui';
	import SubtaskList from './SubtaskList.svelte';
	import { Check, CheckSquare, DotsSixVertical, ArrowsOutSimple } from '@manacore/shared-icons';
	import TaskEditModal from './TaskEditModal.svelte';
	import {
		PrioritySelector,
		StorypointsSelector,
		DurationPicker,
		FunRatingPicker,
		TagSelector,
	} from './form';
	import { PRIORITY_COLORS } from '$lib/constants/priority';

	interface Props {
		task: Task;
		showCompleted?: boolean;
		animateComplete?: boolean;
		isExpanded?: boolean;
		onToggleComplete: () => void;
		onDelete: () => void;
		onExpand?: () => void;
		onCollapse?: () => void;
		onSave?: (data: UpdateTaskInput) => void;
	}

	let {
		task,
		showCompleted = false,
		animateComplete = false,
		isExpanded = false,
		onToggleComplete,
		onDelete,
		onExpand,
		onCollapse,
		onSave,
	}: Props = $props();

	// Toggle for showing created date on completed tasks
	let showCreatedDate = $state(false);

	// Detail modal
	let showModal = $state(false);

	function handleOpenModal(e: MouseEvent) {
		e.stopPropagation();
		showModal = true;
	}

	function handleModalClose() {
		showModal = false;
	}

	function handleModalSave(data: Partial<Task>) {
		onSave?.(data as UpdateTaskInput);
	}

	function handleModalDelete(_taskId: string) {
		onDelete();
		showModal = false;
	}

	// Shared form state
	const form = useTaskForm();

	let titleInputRef = $state<HTMLInputElement | null>(null);
	let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
	let isInitializing = $state(false);

	// Focus title input when expanded
	$effect(() => {
		if (isExpanded && titleInputRef) {
			// Small delay to ensure DOM is ready
			setTimeout(() => titleInputRef?.focus(), 50);
		}
	});

	// Initialize form when expanded
	$effect(() => {
		if (isExpanded && task) {
			isInitializing = true;
			form.initFromTask(task);

			// Allow a tick for all state to settle before enabling auto-save
			setTimeout(() => {
				isInitializing = false;
			}, 0);
		}
	});

	// Auto-save: debounce changes and save automatically
	function scheduleAutoSave() {
		if (isInitializing || !isExpanded) return;
		if (autoSaveTimer) clearTimeout(autoSaveTimer);
		autoSaveTimer = setTimeout(() => {
			handleSave();
		}, 500);
	}

	// Watch all form fields for changes and trigger auto-save
	$effect(() => {
		// Read all reactive form fields to create dependencies
		void [
			form.title,
			form.description,
			form.dueDate,
			form.dueTime,
			form.startDate,
			form.priority,
			form.status,
			form.selectedLabelIds,
			form.subtasks,
			form.recurrenceRule,
			form.storyPoints,
			form.effectiveDuration,
			form.funRating,
			form.assignee,
			form.involvedContacts,
		];
		scheduleAutoSave();
	});

	// Animation state for completing
	let isAnimatingComplete = $state(false);

	// External animation trigger
	$effect(() => {
		if (animateComplete && !task.isCompleted) {
			isAnimatingComplete = true;
		}
	});

	function handleToggleClick() {
		if (!task.isCompleted) {
			// Animate before completing
			isAnimatingComplete = true;
			setTimeout(() => {
				isAnimatingComplete = false;
				onToggleComplete();
			}, 500);
		} else {
			// Uncomplete immediately
			onToggleComplete();
		}
	}

	// Inline title editing
	let inlineTitleInputRef = $state<HTMLInputElement | null>(null);
	let isEditingTitle = $state(false);
	let editTitleValue = $state('');

	function startTitleEdit(e: MouseEvent) {
		e.stopPropagation();
		editTitleValue = task.title;
		isEditingTitle = true;
	}

	$effect(() => {
		if (isEditingTitle && inlineTitleInputRef) {
			inlineTitleInputRef.focus();
			inlineTitleInputRef.select();
		}
	});

	function handleInlineTitleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			inlineTitleInputRef?.blur();
		} else if (e.key === 'Escape') {
			editTitleValue = task.title;
			isEditingTitle = false;
		}
	}

	function handleInlineTitleBlur() {
		const trimmed = editTitleValue.trim();
		if (trimmed && trimmed !== task.title) {
			onSave?.({ title: trimmed });
		}
		isEditingTitle = false;
	}

	function handleContentClick() {
		if (onExpand) {
			onExpand();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isExpanded) return;
		if (e.key === 'Escape') {
			onCollapse?.();
		}
	}

	async function handleSave() {
		if (!form.title.trim() || !onSave) return;

		form.isLoading = true;
		try {
			const data = form.buildUpdateInput(task);
			onSave(data);
		} finally {
			form.isLoading = false;
		}
	}

	function handleDeleteClick() {
		if (form.showDeleteConfirm) {
			onDelete();
		} else {
			form.showDeleteConfirm = true;
		}
	}

	function handleSubtasksChange(newSubtasks: Subtask[]) {
		form.subtasks = newSubtasks;
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

	const priorityColors = PRIORITY_COLORS;

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

	// Long press to expand (mobile)
	let longPressTimer: ReturnType<typeof setTimeout> | null = null;

	function handleTouchStart() {
		longPressTimer = setTimeout(() => {
			longPressTimer = null;
			if (!isExpanded && onExpand) {
				onExpand();
			}
		}, 500);
	}

	function handleTouchEnd() {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
	}

	function handleTouchMove() {
		if (longPressTimer) {
			clearTimeout(longPressTimer);
			longPressTimer = null;
		}
	}

	// Only allow drag from the drag handle
	function handlePointerDown(e: PointerEvent) {
		const target = e.target as HTMLElement;
		const isDragHandle = target.closest('.drag-handle');
		if (!isDragHandle) {
			// Prevent drag from starting if not on drag handle
			e.stopPropagation();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="task-item-wrapper"
	class:expanded={isExpanded}
	onpointerdown={handlePointerDown}
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
	ontouchmove={handleTouchMove}
>
	<div
		class="task-item group"
		class:completed={task.isCompleted}
		class:completing={isAnimatingComplete}
	>
		<!-- Drag handle -->
		<div class="drag-handle">
			<DotsSixVertical size={16} class="drag-icon" />
		</div>

		<!-- Checkbox with priority fill -->
		<button
			class="task-checkbox priority-{task.priority || 'medium'}"
			class:checked={task.isCompleted}
			class:animating={isAnimatingComplete}
			style="--priority-color: {priorityColors[task.priority] || priorityColors.medium}"
			onclick={handleToggleClick}
		>
			{#if task.isCompleted || isAnimatingComplete}
				<Check size={20} class="check-icon" />
			{:else if task.priority === 'urgent'}
				<span class="priority-bang">!</span>
			{/if}
		</button>

		<!-- Content -->
		<div class="task-content">
			{#if isEditingTitle}
				<input
					bind:this={inlineTitleInputRef}
					class="task-title-edit"
					bind:value={editTitleValue}
					onclick={(e) => e.stopPropagation()}
					onkeydown={handleInlineTitleKeydown}
					onblur={handleInlineTitleBlur}
				/>
			{:else}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<span
					class="task-title"
					class:line-through={task.isCompleted}
					onclick={startTitleEdit}
				>
					{task.title}
				</span>
			{/if}

			<!-- Labels below title -->
			{#if task.labels && task.labels.length > 0}
				<div class="task-meta">
					{#each task.labels.slice(0, 2) as label}
						<span class="label-tag" style="--label-color: {label.color}">
							{label.name}
						</span>
					{/each}
					{#if task.labels.length > 2}
						<span class="meta-item">+{task.labels.length - 2}</span>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Assignee and involved contacts -->
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

		<!-- Due date / Completed date (right side) -->
		{#if task.isCompleted && task.completedAt}
			<button
				type="button"
				class="completed-date-toggle"
				onclick={(e) => {
					e.stopPropagation();
					showCreatedDate = !showCreatedDate;
				}}
				title="Klicken für Erstellungsdatum"
			>
				{#if showCreatedDate}
					<span class="date-label">Erstellt</span>
					<span class="date-value"
						>{format(new Date(task.createdAt), 'd. MMM yyyy', { locale: de })}</span
					>
				{/if}
				<span class="date-label">Erledigt</span>
				<span class="date-value"
					>{format(new Date(task.completedAt), 'd. MMM yyyy', { locale: de })}</span
				>
			</button>
		{:else if dueDateText()}
			<span
				class="due-date"
				class:overdue={isOverdue()}
				class:today={task.dueDate && isToday(new Date(task.dueDate))}
			>
				{dueDateText()}
			</span>
		{/if}

		<!-- Detail modal button -->
		<button
			type="button"
			class="detail-btn"
			onclick={handleOpenModal}
			title="Details öffnen"
			tabindex="-1"
		>
			<ArrowsOutSimple size={14} />
		</button>
	</div>

	<!-- Inline subtasks -->
	{#if task.subtasks && task.subtasks.length > 0 && !task.isCompleted}
		<div class="subtasks-inline">
			{#each task.subtasks as subtask (subtask.id)}
				<button
					class="subtask-row"
					class:done={subtask.isCompleted}
					onclick={() => toggleSubtask(subtask.id)}
				>
					<span class="subtask-check" class:checked={subtask.isCompleted}>
						{#if subtask.isCompleted}<Check size={10} />{/if}
					</span>
					<span class="subtask-title">{subtask.title}</span>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Detail modal -->
	<TaskEditModal
		{task}
		open={showModal}
		onClose={handleModalClose}
		onSave={handleModalSave}
		onDelete={handleModalDelete}
	/>

	<!-- Expanded inline edit form -->
	{#if isExpanded}
		<div class="expanded-form">
			<!-- Title -->
			<div class="form-section">
				<label class="form-label" for="task-title-{task.id}">Titel</label>
				<input
					bind:this={titleInputRef}
					id="task-title-{task.id}"
					type="text"
					class="form-input"
					bind:value={form.title}
					placeholder="Aufgabentitel..."
				/>
			</div>

			<!-- Description -->
			<div class="form-section">
				<label class="form-label" for="task-description-{task.id}">Beschreibung</label>
				<textarea
					id="task-description-{task.id}"
					class="form-textarea"
					bind:value={form.description}
					placeholder="Beschreibung hinzufügen..."
					rows="2"
				></textarea>
			</div>

			<!-- Time planning row -->
			<div class="form-section">
				<label class="form-label">Zeitplanung</label>
				<div class="form-row">
					<div class="form-field">
						<label class="form-sublabel" for="due-date-{task.id}">Fällig</label>
						<input
							id="due-date-{task.id}"
							type="date"
							class="form-input-sm"
							bind:value={form.dueDate}
						/>
					</div>
					<div class="form-field">
						<label class="form-sublabel" for="due-time-{task.id}">Uhrzeit</label>
						<input
							id="due-time-{task.id}"
							type="time"
							class="form-input-sm"
							bind:value={form.dueTime}
						/>
					</div>
					<div class="form-field">
						<label class="form-sublabel" for="start-date-{task.id}">Start</label>
						<input
							id="start-date-{task.id}"
							type="date"
							class="form-input-sm"
							bind:value={form.startDate}
						/>
					</div>
				</div>
			</div>

			<!-- Priority -->
			<div class="form-section">
				<label class="form-label">Priorität</label>
				<PrioritySelector value={form.priority} onChange={(p) => (form.priority = p)} />
			</div>

			<!-- Status -->
			<div class="form-section">
				<label class="form-label" for="task-status-{task.id}">Status</label>
				<select id="task-status-{task.id}" class="form-select" bind:value={form.status}>
					{#each STATUS_OPTIONS as s}
						<option value={s.value}>{s.label}</option>
					{/each}
				</select>
			</div>

			<!-- Tags -->
			<div class="form-section">
				<label class="form-label">Tags</label>
				<TagSelector
					selectedIds={form.selectedLabelIds}
					onChange={(ids) => (form.selectedLabelIds = ids)}
				/>
			</div>

			<!-- Subtasks -->
			<div class="form-section">
				<label class="form-label">Subtasks</label>
				<SubtaskList subtasks={form.subtasks} onChange={handleSubtasksChange} />
			</div>

			<!-- Recurrence -->
			<div class="form-section">
				<label class="form-label" for="task-recurrence-{task.id}">Wiederholung</label>
				<select id="task-recurrence-{task.id}" class="form-select" bind:value={form.recurrenceRule}>
					{#each RECURRENCE_OPTIONS as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>

			<!-- Contacts: Assignee -->
			<div class="form-section">
				<label class="form-label">Zuständig</label>
				<ContactSelector
					selectedContacts={form.assignee}
					onContactsChange={(contacts) => (form.assignee = contacts)}
					onSearch={(q) => contactsStore.searchContacts(q)}
					singleSelect={true}
					allowManualEntry={false}
					placeholder="Person zuweisen..."
					addLabel="Zuweisen"
					searchPlaceholder="Name oder E-Mail..."
					isAvailable={form.contactsAvailable ?? false}
				/>
			</div>

			<!-- Contacts: Involved -->
			<div class="form-section">
				<label class="form-label">Beteiligte</label>
				<ContactSelector
					selectedContacts={form.involvedContacts}
					onContactsChange={(contacts) => (form.involvedContacts = contacts)}
					onSearch={(q) => contactsStore.searchContacts(q)}
					allowManualEntry={false}
					placeholder="Personen hinzufügen..."
					addLabel="Person hinzufügen"
					searchPlaceholder="Name oder E-Mail..."
					isAvailable={form.contactsAvailable ?? false}
				/>
			</div>

			<!-- Story Points & Duration & Fun Rating row -->
			<div class="form-row-3">
				<div class="form-section">
					<label class="form-label">Storypoints</label>
					<StorypointsSelector value={form.storyPoints} onChange={(v) => (form.storyPoints = v)} />
				</div>
				<div class="form-section">
					<label class="form-label">Dauer</label>
					<DurationPicker
						value={form.effectiveDuration}
						onChange={(v) => (form.effectiveDuration = v)}
					/>
				</div>
				<div class="form-section">
					<label class="form-label">Spaß</label>
					<FunRatingPicker value={form.funRating} onChange={(v) => (form.funRating = v)} />
				</div>
			</div>

			<!-- Action buttons -->
			<div class="form-actions">
				<button
					type="button"
					class="btn btn-danger"
					onclick={handleDeleteClick}
					disabled={form.isLoading}
				>
					{form.showDeleteConfirm ? 'Wirklich löschen?' : 'Löschen'}
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Wrapper for expanded state */
	.task-item-wrapper {
		margin-bottom: 0;
		border-radius: 0.5rem;
		transition: all 0.2s ease;
	}

	.task-item-wrapper.expanded {
		position: relative;
		z-index: 9990;
		background: var(--color-surface-elevated-2);
		border: 1px solid color-mix(in srgb, var(--color-primary) 35%, transparent);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
		border-radius: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.task-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		min-height: 2.5rem; /* matches notepad --line-height */
		padding: 0 1.5rem;
		border-radius: 0;
		background: transparent;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
		border: none;
		border-bottom: none;
		box-shadow: none;
		transition: all 0.2s;
	}

	.task-item-wrapper.expanded .task-item {
		background: transparent;
		border: none;
		box-shadow: none;
		backdrop-filter: none;
		border-radius: 0.75rem 0.75rem 0 0;
		border-bottom: 1px solid var(--color-border);
	}

	.task-item:hover {
		background: transparent;
	}

	.task-item.completed {
		opacity: 0.6;
	}

	/* Completing animation */
	.task-item.completing {
		background: color-mix(in srgb, var(--color-success) 8%, transparent);
	}

	/* Drag handle — sticks out left beyond the content area */
	.drag-handle {
		cursor: grab;
		opacity: 0;
		transition: opacity 0.15s;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem 0.25rem;
		margin-left: -2rem;
		margin-right: -0.5rem;
		margin-top: 0.125rem;
		border-radius: 0.25rem;
	}

	.task-item:hover .drag-handle {
		opacity: 0.4;
	}

	.drag-handle:hover {
		opacity: 0.8 !important;
		background: var(--color-surface-hover);
	}

	.drag-handle:active {
		cursor: grabbing;
		opacity: 1 !important;
	}

	.drag-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: currentColor;
	}

	/* During drag, disable pointer events on interactive elements */
	:global([aria-grabbed='true']) .task-checkbox,
	:global([aria-grabbed='true']) .task-content,
	:global([aria-grabbed='true']) .expand-btn,
	:global([aria-grabbed='true']) .detail-btn {
		pointer-events: none;
	}

	/* Detail modal button */
	.detail-btn {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		background: transparent;
		color: var(--color-muted-foreground);
		cursor: pointer;
		border-radius: 0.375rem;
		opacity: 0;
		pointer-events: none;
		transition: all 0.15s;
		padding: 0;
	}

	.task-item:hover .detail-btn {
		opacity: 1;
		pointer-events: auto;
	}

	.detail-btn:hover {
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		opacity: 1;
	}

	/* Checkbox with priority color fill */
	.task-checkbox {
		margin-top: 0.1875rem;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 9999px;
		border: 2px solid var(--priority-color, rgba(0, 0, 0, 0.2));
		background: color-mix(in srgb, var(--priority-color) 15%, transparent);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
		padding: 0;
	}

	:global(.dark) .task-checkbox {
		border-color: var(--priority-color, rgba(255, 255, 255, 0.3));
		background: color-mix(in srgb, var(--priority-color) 20%, transparent);
	}

	.task-checkbox:hover {
		background: color-mix(in srgb, var(--priority-color) 35%, transparent);
	}

	/* Priority: low — dashed thin border */
	.task-checkbox.priority-low {
		border-style: dashed;
		border-width: 1.5px;
	}

	/* Priority: medium — normal solid border */
	.task-checkbox.priority-medium {
		border-width: 2px;
	}

	/* Priority: high — thick border */
	.task-checkbox.priority-high {
		border-width: 3px;
	}

	/* Priority: urgent — thick border + exclamation mark */
	.task-checkbox.priority-urgent {
		border-width: 3px;
	}

	.priority-bang {
		font-size: 0.6875rem;
		font-weight: 800;
		line-height: 1;
		color: var(--priority-color);
		pointer-events: none;
	}

	.task-checkbox.checked {
		background: var(--color-primary);
		border-color: var(--color-primary);
		border-style: solid;
	}

	.task-checkbox.checked .priority-bang {
		display: none;
	}

	.task-checkbox.animating {
		background: var(--color-success);
		border-color: var(--color-success);
		border-style: solid;
		transform: scale(1.2);
	}

	.check-icon {
		width: 0.75rem;
		height: 0.75rem;
		color: white;
	}

	.check-icon.animate-check {
		animation: drawCheck 0.3s ease-out forwards;
	}

	.check-icon.animate-check path {
		stroke-dasharray: 24;
		stroke-dashoffset: 24;
		animation: drawPath 0.3s ease-out forwards;
	}

	@keyframes drawPath {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes drawCheck {
		0% {
			transform: scale(0.5);
			opacity: 0;
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	/* Content */
	.task-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.25rem;
	}

	.task-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-foreground);
		white-space: normal;
		word-break: break-word;
		cursor: text;
		border-radius: 0.25rem;
		padding: 0.125rem 0.25rem;
		margin: -0.125rem -0.25rem;
		user-select: none;
	}

	.task-title:hover {
		background: color-mix(in srgb, var(--color-primary) 5%, transparent);
	}

	.task-title.line-through {
		text-decoration: line-through;
		color: var(--color-muted-foreground);
	}

	.task-title-edit {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-foreground);
		background: color-mix(in srgb, var(--color-primary) 6%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
		border-radius: 0.25rem;
		padding: 0.125rem 0.25rem;
		margin: -0.125rem -0.25rem;
		outline: none;
		width: calc(100% + 0.5rem);
		word-break: break-word;
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
		color: var(--color-muted-foreground);
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
		background: var(--color-primary);
		border-radius: 50%;
		border: 1px solid var(--color-surface-elevated-2);
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
		color: var(--color-muted-foreground);
		margin-left: 0.25rem;
		font-weight: 500;
	}

	/* Due date */
	.due-date {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		flex-shrink: 0;
		white-space: nowrap;
		margin-top: 0.25rem;
	}

	.due-date.overdue {
		color: var(--color-error);
	}

	.due-date.today {
		color: var(--color-warning);
	}

	/* Completed date toggle */
	.completed-date-toggle {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.125rem;
		flex-shrink: 0;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.125rem 0;
		opacity: 0.7;
		transition: opacity 0.15s;
	}

	.completed-date-toggle:hover {
		opacity: 1;
	}

	.completed-date-toggle .date-label {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: #9ca3af;
		line-height: 1;
	}

	.completed-date-toggle .date-value {
		font-size: 0.6875rem;
		color: #6b7280;
		white-space: nowrap;
		line-height: 1.2;
	}

	:global(.dark) .completed-date-toggle .date-value {
		color: #9ca3af;
	}

	/* Expand button */
	.expand-btn {
		padding: 0.25rem;
		border: none;
		background: transparent;
		color: var(--color-muted-foreground);
		cursor: pointer;
		border-radius: 9999px;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.expand-btn:hover {
		color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
	}

	.expand-icon {
		width: 1rem;
		height: 1rem;
		transition: transform 0.2s ease;
	}

	.expand-icon.rotated {
		transform: rotate(180deg);
	}

	/* Expanded form */
	.expanded-form {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.form-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-foreground);
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.form-sublabel {
		font-size: 0.6875rem;
		color: var(--color-muted-foreground);
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}

	.form-row-2 {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.form-row-3 {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	@media (max-width: 480px) {
		.form-row,
		.form-row-2,
		.form-row-3 {
			grid-template-columns: 1fr;
		}
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.form-input,
	.form-textarea,
	.form-select,
	.form-input-sm {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		background: var(--color-surface);
		font-size: 0.875rem;
		color: var(--color-foreground);
		transition: all 0.15s;
	}

	.form-input:focus,
	.form-textarea:focus,
	.form-select:focus,
	.form-input-sm:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 10%, transparent);
	}

	.form-input-sm {
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
	}

	.form-textarea {
		resize: vertical;
		min-height: 60px;
	}

	/* Action buttons */
	.form-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border);
		margin-top: 0.5rem;
	}

	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-danger {
		background: color-mix(in srgb, var(--color-error) 10%, transparent);
		color: var(--color-error);
	}

	.btn-danger:hover:not(:disabled) {
		background: var(--color-error);
		color: white;
	}

	/* ── Inline subtasks ────────────────────────────── */
	.subtasks-inline {
		display: flex;
		flex-direction: column;
		/* align with task title: padding-left + gap + checkbox + gap */
		padding: 0.125rem 1.5rem 0.375rem calc(1.5rem + 1.25rem + 1.25rem);
		position: relative;
	}

	.subtasks-inline::before {
		content: '';
		position: absolute;
		left: calc(1.5rem + 0.625rem + 0.625rem);
		top: 0;
		bottom: 0.375rem;
		width: 1px;
		background: rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .subtasks-inline::before {
		background: rgba(255, 255, 255, 0.1);
	}

	.subtask-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.1875rem 0;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		width: 100%;
		border-radius: 0.25rem;
		transition: background 0.1s;
	}

	.subtask-row:hover {
		background: rgba(0, 0, 0, 0.03);
	}

	:global(.dark) .subtask-row:hover {
		background: rgba(255, 255, 255, 0.04);
	}

	.subtask-check {
		width: 0.875rem;
		height: 0.875rem;
		border-radius: 50%;
		border: 1.5px solid rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: all 0.15s;
		color: white;
	}

	:global(.dark) .subtask-check {
		border-color: rgba(255, 255, 255, 0.25);
	}

	.subtask-check.checked {
		background: #8b5cf6;
		border-color: #8b5cf6;
	}

	.subtask-title {
		font-size: 0.8125rem;
		color: #374151;
		line-height: 1.4;
	}

	:global(.dark) .subtask-title {
		color: #d1d5db;
	}

	.subtask-row.done .subtask-title {
		text-decoration: line-through;
		color: #9ca3af;
	}
</style>
