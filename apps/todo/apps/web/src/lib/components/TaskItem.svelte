<script lang="ts">
	import type {
		Task,
		Subtask,
		TaskPriority,
		TaskStatus,
		EffectiveDuration,
		UpdateTaskInput,
	} from '@todo/shared';
	import type { ContactReference, ContactOrManual } from '@manacore/shared-types';
	import { STATUS_OPTIONS, RECURRENCE_OPTIONS } from '@todo/shared';
	import { format, isToday, isPast, isTomorrow } from 'date-fns';
	import { de } from 'date-fns/locale';
	import { projectsStore } from '$lib/stores/projects.svelte';
	import { contactsStore } from '$lib/stores/contacts.svelte';
	import { ContactAvatar, ContactSelector } from '@manacore/shared-ui';
	import SubtaskList from './SubtaskList.svelte';
	import {
		PrioritySelector,
		StorypointsSelector,
		DurationPicker,
		FunRatingPicker,
		TagSelector,
	} from './form';

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

	// Form state for expanded mode
	let title = $state('');
	let description = $state('');
	let dueDate = $state('');
	let dueTime = $state('');
	let startDate = $state('');
	let priority = $state<TaskPriority>('medium');
	let status = $state<TaskStatus>('pending');
	let projectId = $state<string | null>(null);
	let selectedLabelIds = $state<string[]>([]);
	let subtasks = $state<Subtask[]>([]);
	let recurrenceRule = $state('');
	let notes = $state('');
	let storyPoints = $state<number | null>(null);
	let effectiveDuration = $state<EffectiveDuration | null>(null);
	let funRating = $state<number | null>(null);
	let assignee = $state<ContactOrManual[]>([]);
	let involvedContacts = $state<ContactOrManual[]>([]);
	let contactsAvailable = $state<boolean | null>(null);
	let isLoading = $state(false);
	let showDeleteConfirm = $state(false);
	let titleInputRef = $state<HTMLInputElement | null>(null);

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
			title = task.title || '';
			description = task.description || '';
			dueDate = task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '';
			dueTime = task.dueTime || '';
			startDate = task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '';
			priority = task.priority || 'medium';
			status = task.status || 'pending';
			projectId = task.projectId || null;
			selectedLabelIds = task.labels?.map((l) => l.id) || [];
			subtasks = task.subtasks ? [...task.subtasks] : [];
			recurrenceRule = task.recurrenceRule || '';
			notes = task.metadata?.notes || '';
			storyPoints = task.metadata?.storyPoints ?? null;
			effectiveDuration = task.metadata?.effectiveDuration ?? null;
			funRating = task.metadata?.funRating ?? null;
			assignee = task.metadata?.assignee ? [task.metadata.assignee] : [];
			involvedContacts = task.metadata?.involvedContacts || [];
			showDeleteConfirm = false;

			contactsStore.checkAvailability().then((available) => {
				contactsAvailable = available;
			});
		}
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

	function handleContentClick() {
		if (onExpand) {
			onExpand();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isExpanded) return;
		if (e.key === 'Escape') {
			onCollapse?.();
		} else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			handleSave();
		}
	}

	function toContactReference(contact: ContactOrManual): ContactReference | null {
		if ('isManual' in contact && contact.isManual) {
			return null;
		}
		return contact as ContactReference;
	}

	async function handleSave() {
		if (!title.trim() || !onSave) return;

		isLoading = true;
		try {
			const assigneeRef = assignee.length > 0 ? toContactReference(assignee[0]) : null;
			const involvedRefs = involvedContacts
				.map(toContactReference)
				.filter((c): c is ContactReference => c !== null);

			const data: UpdateTaskInput = {
				title: title.trim(),
				description: description.trim() || null,
				dueDate: dueDate ? new Date(dueDate).toISOString() : null,
				dueTime: dueTime || null,
				startDate: startDate ? new Date(startDate).toISOString() : null,
				priority,
				status,
				projectId: projectId || null,
				subtasks: subtasks.length > 0 ? subtasks : null,
				recurrenceRule: recurrenceRule || null,
				metadata: {
					...task.metadata,
					notes: notes.trim() || undefined,
					storyPoints: storyPoints ?? undefined,
					effectiveDuration: effectiveDuration ?? undefined,
					funRating: funRating ?? undefined,
					assignee: assigneeRef ?? undefined,
					involvedContacts: involvedRefs.length > 0 ? involvedRefs : undefined,
				},
				labelIds: selectedLabelIds,
			};

			onSave(data);
		} finally {
			isLoading = false;
		}
	}

	function handleDeleteClick() {
		if (showDeleteConfirm) {
			onDelete();
		} else {
			showDeleteConfirm = true;
		}
	}

	function handleSubtasksChange(newSubtasks: Subtask[]) {
		subtasks = newSubtasks;
	}

	// Priority colors
	const priorityColors: Record<string, string> = {
		low: '#22c55e',
		medium: '#eab308',
		high: '#f97316',
		urgent: '#ef4444',
	};

	// Format due date
	let dueDateText = $derived(() => {
		if (!task.dueDate) return null;
		const date = new Date(task.dueDate);
		if (isToday(date)) return 'Heute';
		if (isTomorrow(date)) return 'Morgen';
		return format(date, 'dd. MMM', { locale: de });
	});

	// Check if overdue
	let isOverdue = $derived(() => {
		if (!task.dueDate || task.isCompleted) return false;
		const date = new Date(task.dueDate);
		return isPast(date) && !isToday(date);
	});

	// Get project color
	let projectColor = $derived(() => {
		if (!task.projectId) return null;
		return projectsStore.getColor(task.projectId);
	});

	// Subtasks progress
	let subtaskProgress = $derived(() => {
		if (!task.subtasks || task.subtasks.length === 0) return null;
		const completed = task.subtasks.filter((s) => s.isCompleted).length;
		return `${completed}/${task.subtasks.length}`;
	});

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

<div class="task-item-wrapper" class:expanded={isExpanded} onpointerdown={handlePointerDown}>
	<div
		class="task-item group"
		class:completed={task.isCompleted}
		class:completing={isAnimatingComplete}
	>
		<!-- Drag handle -->
		<div class="drag-handle">
			<svg class="drag-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
			</svg>
		</div>

		<!-- Priority indicator -->
		<div
			class="priority-dot"
			style="background-color: {priorityColors[task.priority] || priorityColors.medium}"
		></div>

		<!-- Checkbox -->
		<button
			class="task-checkbox"
			class:checked={task.isCompleted}
			class:animating={isAnimatingComplete}
			onclick={handleToggleClick}
		>
			{#if task.isCompleted || isAnimatingComplete}
				<svg
					class="check-icon"
					class:animate-check={isAnimatingComplete}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="3"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			{/if}
		</button>

		<!-- Content (clickable to expand) -->
		<button type="button" class="task-content" onclick={handleContentClick}>
			<span class="task-title" class:line-through={task.isCompleted}>
				{task.title}
			</span>

			<!-- Labels and subtasks below title -->
			{#if subtaskProgress() || (task.labels && task.labels.length > 0)}
				<div class="task-meta">
					{#if subtaskProgress()}
						<span class="meta-item">
							<svg class="meta-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
								/>
							</svg>
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
		</button>

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

		<!-- Due date (always on the right) -->
		{#if dueDateText()}
			<span
				class="due-date"
				class:overdue={isOverdue()}
				class:today={task.dueDate && isToday(new Date(task.dueDate))}
			>
				{dueDateText()}
			</span>
		{/if}

		<!-- Project indicator -->
		{#if projectColor()}
			<div class="project-dot" style="background-color: {projectColor()}"></div>
		{/if}

		<!-- Expand/Collapse indicator -->
		<button
			class="expand-btn"
			onclick={handleContentClick}
			title={isExpanded ? 'Einklappen' : 'Bearbeiten'}
		>
			<svg
				class="expand-icon"
				class:rotated={isExpanded}
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>
	</div>

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
					bind:value={title}
					placeholder="Aufgabentitel..."
				/>
			</div>

			<!-- Description -->
			<div class="form-section">
				<label class="form-label" for="task-description-{task.id}">Beschreibung</label>
				<textarea
					id="task-description-{task.id}"
					class="form-textarea"
					bind:value={description}
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
						<input id="due-date-{task.id}" type="date" class="form-input-sm" bind:value={dueDate} />
					</div>
					<div class="form-field">
						<label class="form-sublabel" for="due-time-{task.id}">Uhrzeit</label>
						<input id="due-time-{task.id}" type="time" class="form-input-sm" bind:value={dueTime} />
					</div>
					<div class="form-field">
						<label class="form-sublabel" for="start-date-{task.id}">Start</label>
						<input
							id="start-date-{task.id}"
							type="date"
							class="form-input-sm"
							bind:value={startDate}
						/>
					</div>
				</div>
			</div>

			<!-- Priority -->
			<div class="form-section">
				<label class="form-label">Priorität</label>
				<PrioritySelector value={priority} onChange={(p) => (priority = p)} />
			</div>

			<!-- Status & Project row -->
			<div class="form-row-2">
				<div class="form-section">
					<label class="form-label" for="task-status-{task.id}">Status</label>
					<select id="task-status-{task.id}" class="form-select" bind:value={status}>
						{#each STATUS_OPTIONS as s}
							<option value={s.value}>{s.label}</option>
						{/each}
					</select>
				</div>
				<div class="form-section">
					<label class="form-label" for="task-project-{task.id}">Projekt</label>
					<select id="task-project-{task.id}" class="form-select" bind:value={projectId}>
						<option value={null}>Kein Projekt</option>
						{#each projectsStore.activeProjects as project}
							<option value={project.id}>{project.name}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Tags -->
			<div class="form-section">
				<label class="form-label">Tags</label>
				<TagSelector selectedIds={selectedLabelIds} onChange={(ids) => (selectedLabelIds = ids)} />
			</div>

			<!-- Subtasks -->
			<div class="form-section">
				<label class="form-label">Subtasks</label>
				<SubtaskList {subtasks} onChange={handleSubtasksChange} />
			</div>

			<!-- Recurrence -->
			<div class="form-section">
				<label class="form-label" for="task-recurrence-{task.id}">Wiederholung</label>
				<select id="task-recurrence-{task.id}" class="form-select" bind:value={recurrenceRule}>
					{#each RECURRENCE_OPTIONS as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>

			<!-- Contacts: Assignee -->
			<div class="form-section">
				<label class="form-label">Zuständig</label>
				<ContactSelector
					selectedContacts={assignee}
					onContactsChange={(contacts) => (assignee = contacts)}
					onSearch={(q) => contactsStore.searchContacts(q)}
					singleSelect={true}
					allowManualEntry={false}
					placeholder="Person zuweisen..."
					addLabel="Zuweisen"
					searchPlaceholder="Name oder E-Mail..."
					isAvailable={contactsAvailable ?? false}
				/>
			</div>

			<!-- Contacts: Involved -->
			<div class="form-section">
				<label class="form-label">Beteiligte</label>
				<ContactSelector
					selectedContacts={involvedContacts}
					onContactsChange={(contacts) => (involvedContacts = contacts)}
					onSearch={(q) => contactsStore.searchContacts(q)}
					allowManualEntry={false}
					placeholder="Personen hinzufügen..."
					addLabel="Person hinzufügen"
					searchPlaceholder="Name oder E-Mail..."
					isAvailable={contactsAvailable ?? false}
				/>
			</div>

			<!-- Notes -->
			<div class="form-section">
				<label class="form-label" for="task-notes-{task.id}">Notizen</label>
				<textarea
					id="task-notes-{task.id}"
					class="form-textarea"
					bind:value={notes}
					placeholder="Zusätzliche Notizen..."
					rows="2"
				></textarea>
			</div>

			<!-- Story Points & Duration & Fun Rating row -->
			<div class="form-row-3">
				<div class="form-section">
					<label class="form-label">Storypoints</label>
					<StorypointsSelector value={storyPoints} onChange={(v) => (storyPoints = v)} />
				</div>
				<div class="form-section">
					<label class="form-label">Dauer</label>
					<DurationPicker value={effectiveDuration} onChange={(v) => (effectiveDuration = v)} />
				</div>
				<div class="form-section">
					<label class="form-label">Spaß</label>
					<FunRatingPicker value={funRating} onChange={(v) => (funRating = v)} />
				</div>
			</div>

			<!-- Action buttons -->
			<div class="form-actions">
				<button
					type="button"
					class="btn btn-danger"
					onclick={handleDeleteClick}
					disabled={isLoading}
				>
					{showDeleteConfirm ? 'Wirklich löschen?' : 'Löschen'}
				</button>
				<div class="actions-right">
					<button type="button" class="btn btn-secondary" onclick={onCollapse} disabled={isLoading}>
						Abbrechen
					</button>
					<button
						type="button"
						class="btn btn-primary"
						onclick={handleSave}
						disabled={isLoading || !title.trim()}
					>
						{#if isLoading}
							<div class="spinner"></div>
						{:else}
							Speichern
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* DEBUG BORDERS - REMOVE AFTER DEBUGGING */
	.task-item-wrapper {
		outline: 2px dashed red !important;
	}
	.task-item {
		outline: 2px solid blue !important;
	}
	.drag-handle {
		outline: 2px solid green !important;
	}
	.task-checkbox {
		outline: 2px solid orange !important;
	}
	.task-content {
		outline: 2px solid purple !important;
	}
	.expand-btn {
		outline: 2px solid cyan !important;
	}
	.priority-dot {
		outline: 1px solid yellow !important;
	}
	.contacts-display {
		outline: 1px solid pink !important;
	}
	.due-date {
		outline: 1px solid lime !important;
	}
	.project-dot {
		outline: 1px solid magenta !important;
	}
	/* END DEBUG BORDERS */

	/* Wrapper for expanded state */
	.task-item-wrapper {
		margin-bottom: 0;
		border-radius: 0.5rem;
		transition: all 0.2s ease;
	}

	.task-item-wrapper.expanded {
		position: relative;
		z-index: 9990;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(139, 92, 246, 0.3);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
		border-radius: 0.75rem;
		margin-bottom: 0.75rem;
	}

	:global(.dark) .task-item-wrapper.expanded {
		background: rgba(30, 30, 30, 0.95);
		border-color: rgba(139, 92, 246, 0.4);
	}

	.task-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
		transition: all 0.2s;
	}

	.task-item-wrapper.expanded .task-item {
		background: transparent;
		border: none;
		box-shadow: none;
		backdrop-filter: none;
		border-radius: 0.75rem 0.75rem 0 0;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	:global(.dark) .task-item-wrapper.expanded .task-item {
		border-bottom-color: rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .task-item {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.task-item:hover {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.12);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
	}

	:global(.dark) .task-item:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.task-item-wrapper.expanded .task-item:hover {
		background: transparent;
		box-shadow: none;
	}

	.task-item.completed {
		opacity: 0.6;
	}

	/* Completing animation */
	.task-item.completing {
		background: rgba(34, 197, 94, 0.15);
		border-color: rgba(34, 197, 94, 0.3);
	}

	:global(.dark) .task-item.completing {
		background: rgba(34, 197, 94, 0.2);
		border-color: rgba(34, 197, 94, 0.4);
	}

	/* Drag handle */
	.drag-handle {
		cursor: grab;
		opacity: 0.25;
		transition: opacity 0.15s;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		padding: 0.25rem;
		margin-left: -0.125rem;
		border-radius: 0.25rem;
	}

	.task-item:hover .drag-handle {
		opacity: 0.5;
	}

	.drag-handle:hover {
		opacity: 0.8 !important;
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .drag-handle:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.drag-handle:active {
		cursor: grabbing;
		opacity: 1 !important;
	}

	.drag-icon {
		width: 1rem;
		height: 1rem;
		color: currentColor;
	}

	/* During drag, disable pointer events on interactive elements */
	:global([aria-grabbed='true']) .task-checkbox,
	:global([aria-grabbed='true']) .task-content,
	:global([aria-grabbed='true']) .expand-btn {
		pointer-events: none;
	}

	/* Priority dot */
	.priority-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	/* Checkbox */
	.task-checkbox {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 9999px;
		border: 2px solid rgba(0, 0, 0, 0.2);
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.15s;
		flex-shrink: 0;
		padding: 0;
	}

	:global(.dark) .task-checkbox {
		border-color: rgba(255, 255, 255, 0.3);
	}

	.task-checkbox:hover {
		border-color: #8b5cf6;
		background: rgba(139, 92, 246, 0.1);
	}

	.task-checkbox.checked {
		background: #8b5cf6;
		border-color: #8b5cf6;
	}

	.task-checkbox.animating {
		background: #22c55e;
		border-color: #22c55e;
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
		gap: 0.25rem;
		background: none;
		border: none;
		padding: 0;
		text-align: left;
		cursor: pointer;
	}

	.task-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.dark) .task-title {
		color: #f3f4f6;
	}

	.task-title.line-through {
		text-decoration: line-through;
		color: #9ca3af;
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

	/* Due date */
	.due-date {
		font-size: 0.75rem;
		color: #6b7280;
		flex-shrink: 0;
		white-space: nowrap;
	}

	:global(.dark) .due-date {
		color: #9ca3af;
	}

	.due-date.overdue {
		color: #ef4444;
	}

	.due-date.today {
		color: #f97316;
	}

	/* Project dot */
	.project-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	/* Expand button */
	.expand-btn {
		padding: 0.25rem;
		border: none;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		border-radius: 9999px;
		transition: all 0.15s;
		flex-shrink: 0;
	}

	.task-item:hover .expand-btn {
		color: #6b7280;
	}

	.expand-btn:hover {
		color: #8b5cf6;
		background: rgba(139, 92, 246, 0.1);
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
		color: #374151;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	:global(.dark) .form-label {
		color: #d1d5db;
	}

	.form-sublabel {
		font-size: 0.6875rem;
		color: #6b7280;
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
		border: 1px solid rgba(0, 0, 0, 0.15);
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.8);
		font-size: 0.875rem;
		color: #374151;
		transition: all 0.15s;
	}

	:global(.dark) .form-input,
	:global(.dark) .form-textarea,
	:global(.dark) .form-select,
	:global(.dark) .form-input-sm {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.15);
		color: #f3f4f6;
	}

	.form-input:focus,
	.form-textarea:focus,
	.form-select:focus,
	.form-input-sm:focus {
		outline: none;
		border-color: #8b5cf6;
		box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
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
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		margin-top: 0.5rem;
	}

	:global(.dark) .form-actions {
		border-top-color: rgba(255, 255, 255, 0.1);
	}

	.actions-right {
		display: flex;
		gap: 0.5rem;
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

	.btn-primary {
		background: #8b5cf6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #7c3aed;
	}

	.btn-secondary {
		background: rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	:global(.dark) .btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: #e5e7eb;
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .btn-secondary:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.15);
	}

	.btn-danger {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	.btn-danger:hover:not(:disabled) {
		background: #ef4444;
		color: white;
	}

	.spinner {
		width: 0.875rem;
		height: 0.875rem;
		border: 2px solid transparent;
		border-top-color: white;
		border-radius: 9999px;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
