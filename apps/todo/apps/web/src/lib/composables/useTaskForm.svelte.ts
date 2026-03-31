import type {
	Task,
	Subtask,
	TaskPriority,
	TaskStatus,
	EffectiveDuration,
	UpdateTaskInput,
} from '@todo/shared';
import type { ContactReference, ContactOrManual } from '@manacore/shared-types';
import { format } from 'date-fns';
import { contactsStore } from '$lib/stores/contacts.svelte';

/**
 * Shared composable for task form state and logic.
 * Used by both TaskItem (inline edit) and TaskEditModal.
 */
export function useTaskForm() {
	// Form state
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

	// UI state
	let showDeleteConfirm = $state(false);
	let isLoading = $state(false);
	let contactsAvailable = $state<boolean | null>(null);

	/**
	 * Initialize all form fields from a Task object.
	 * Call this when the task changes or the form becomes visible.
	 */
	function initFromTask(task: Task) {
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

		// Check contacts availability
		contactsStore.checkAvailability().then((available) => {
			contactsAvailable = available;
		});
	}

	/**
	 * Extract ContactReference from ContactOrManual (filter out manual entries).
	 */
	function toContactReference(contact: ContactOrManual): ContactReference | null {
		if ('isManual' in contact && contact.isManual) {
			return null;
		}
		return contact as ContactReference;
	}

	/**
	 * Build an UpdateTaskInput object from the current form state.
	 * Requires the original task for metadata merging.
	 */
	function buildUpdateInput(task: Task): UpdateTaskInput {
		const assigneeRef = assignee.length > 0 ? toContactReference(assignee[0]) : null;
		const involvedRefs = involvedContacts
			.map(toContactReference)
			.filter((c): c is ContactReference => c !== null);

		return {
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
	}

	return {
		// State — exposed as getters/setters so bind:value works via form.title etc.
		get title() {
			return title;
		},
		set title(v: string) {
			title = v;
		},
		get description() {
			return description;
		},
		set description(v: string) {
			description = v;
		},
		get dueDate() {
			return dueDate;
		},
		set dueDate(v: string) {
			dueDate = v;
		},
		get dueTime() {
			return dueTime;
		},
		set dueTime(v: string) {
			dueTime = v;
		},
		get startDate() {
			return startDate;
		},
		set startDate(v: string) {
			startDate = v;
		},
		get priority() {
			return priority;
		},
		set priority(v: TaskPriority) {
			priority = v;
		},
		get status() {
			return status;
		},
		set status(v: TaskStatus) {
			status = v;
		},
		get projectId() {
			return projectId;
		},
		set projectId(v: string | null) {
			projectId = v;
		},
		get selectedLabelIds() {
			return selectedLabelIds;
		},
		set selectedLabelIds(v: string[]) {
			selectedLabelIds = v;
		},
		get subtasks() {
			return subtasks;
		},
		set subtasks(v: Subtask[]) {
			subtasks = v;
		},
		get recurrenceRule() {
			return recurrenceRule;
		},
		set recurrenceRule(v: string) {
			recurrenceRule = v;
		},
		get notes() {
			return notes;
		},
		set notes(v: string) {
			notes = v;
		},
		get storyPoints() {
			return storyPoints;
		},
		set storyPoints(v: number | null) {
			storyPoints = v;
		},
		get effectiveDuration() {
			return effectiveDuration;
		},
		set effectiveDuration(v: EffectiveDuration | null) {
			effectiveDuration = v;
		},
		get funRating() {
			return funRating;
		},
		set funRating(v: number | null) {
			funRating = v;
		},
		get assignee() {
			return assignee;
		},
		set assignee(v: ContactOrManual[]) {
			assignee = v;
		},
		get involvedContacts() {
			return involvedContacts;
		},
		set involvedContacts(v: ContactOrManual[]) {
			involvedContacts = v;
		},
		get showDeleteConfirm() {
			return showDeleteConfirm;
		},
		set showDeleteConfirm(v: boolean) {
			showDeleteConfirm = v;
		},
		get isLoading() {
			return isLoading;
		},
		set isLoading(v: boolean) {
			isLoading = v;
		},
		get contactsAvailable() {
			return contactsAvailable;
		},
		set contactsAvailable(v: boolean | null) {
			contactsAvailable = v;
		},

		// Functions
		initFromTask,
		buildUpdateInput,
		toContactReference,
	};
}
