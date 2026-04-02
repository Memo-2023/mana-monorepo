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
import { reminderCollection, type LocalReminder } from '$lib/data/local-store';
import { remindersStore } from '$lib/stores/reminders.svelte';

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
	let selectedLabelIds = $state<string[]>([]);
	let subtasks = $state<Subtask[]>([]);
	let recurrenceRule = $state('');
	let storyPoints = $state<number | null>(null);
	let effectiveDuration = $state<EffectiveDuration | null>(null);
	let funRating = $state<number | null>(null);
	let assignee = $state<ContactOrManual[]>([]);
	let involvedContacts = $state<ContactOrManual[]>([]);
	let reminderMinutes = $state<number | null>(null);

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
		selectedLabelIds = task.labels?.map((l) => l.id) || [];
		subtasks = task.subtasks ? [...task.subtasks] : [];
		recurrenceRule = task.recurrenceRule || '';
		storyPoints = task.metadata?.storyPoints ?? null;
		effectiveDuration = task.metadata?.effectiveDuration ?? null;
		funRating = task.metadata?.funRating ?? null;
		assignee = task.metadata?.assignee ? [task.metadata.assignee] : [];
		involvedContacts = task.metadata?.involvedContacts || [];
		showDeleteConfirm = false;

		// Load existing reminder for this task
		reminderMinutes = null;
		reminderCollection.getAll().then((all) => {
			const existing = all.find((r) => r.taskId === task.id);
			if (existing) reminderMinutes = existing.minutesBefore;
		});

		// Check contacts availability
		contactsStore.checkAvailability().then((available) => {
			contactsAvailable = available;
		});
	}

	/**
	 * Persist reminder changes (create/delete based on form state).
	 * Called after saving the task.
	 */
	async function persistReminder(taskId: string) {
		const all = await reminderCollection.getAll();
		const existing = all.find((r) => r.taskId === taskId);

		if (reminderMinutes === null && existing) {
			await remindersStore.deleteReminder(existing.id);
		} else if (reminderMinutes !== null && !existing) {
			await remindersStore.createReminder(taskId, reminderMinutes);
		} else if (reminderMinutes !== null && existing && existing.minutesBefore !== reminderMinutes) {
			await remindersStore.deleteReminder(existing.id);
			await remindersStore.createReminder(taskId, reminderMinutes);
		}
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
			subtasks: subtasks.length > 0 ? subtasks : null,
			recurrenceRule: recurrenceRule || null,
			metadata: {
				...task.metadata,
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
		get reminderMinutes() {
			return reminderMinutes;
		},
		set reminderMinutes(v: number | null) {
			reminderMinutes = v;
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
		persistReminder,
		toContactReference,
	};
}
