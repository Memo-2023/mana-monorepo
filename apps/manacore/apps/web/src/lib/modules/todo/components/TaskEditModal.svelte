<script lang="ts">
	import type { Task, Subtask, TaskPriority } from '../types';
	import { tasksStore } from '../stores/tasks.svelte';
	import { useTaskForm } from '../composables/useTaskForm.svelte';
	import SubtaskList from './SubtaskList.svelte';
	import {
		PrioritySelector,
		TagSelector,
		ReminderSelector,
		DurationPicker,
		StorypointsSelector,
		FunRatingPicker,
	} from './form';
	import { X, Trash, CalendarBlank, Clock, ArrowsClockwise, Flag } from '@manacore/shared-icons';
	import { _ } from 'svelte-i18n';

	interface Props {
		task: Task;
		open: boolean;
		onClose: () => void;
	}

	let { task, open, onClose }: Props = $props();

	const form = useTaskForm();

	$effect(() => {
		if (open && task) form.initFromTask(task);
	});

	let RECURRENCE_OPTIONS = $derived([
		{ value: '', label: $_('todo.recurrenceNone') },
		{ value: 'FREQ=DAILY', label: $_('todo.recurrenceDaily') },
		{ value: 'FREQ=WEEKLY', label: $_('todo.recurrenceWeekly') },
		{ value: 'FREQ=MONTHLY', label: $_('todo.recurrenceMonthly') },
		{ value: 'FREQ=YEARLY', label: $_('todo.recurrenceYearly') },
	]);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
		else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			handleSave();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}

	async function handleSave() {
		if (!form.title.trim()) return;
		form.isLoading = true;
		try {
			const payload = form.buildUpdatePayload();
			await tasksStore.updateTask(task.id, payload);
			await form.persistReminder(task.id);
			onClose();
		} finally {
			form.isLoading = false;
		}
	}

	async function handleDelete() {
		if (form.showDeleteConfirm) {
			await tasksStore.deleteTask(task.id);
			onClose();
		} else {
			form.showDeleteConfirm = true;
		}
	}

	function handleSubtasksChange(newSubtasks: Subtask[]) {
		form.subtasks = newSubtasks;
	}

	function autoGrow(node: HTMLTextAreaElement) {
		function resize() {
			node.style.height = 'auto';
			node.style.height = node.scrollHeight + 'px';
		}
		node.addEventListener('input', resize);
		resize();
		return { destroy: () => node.removeEventListener('input', resize) };
	}
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[9995] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm sm:p-8"
		onclick={handleBackdropClick}
	>
		<div
			class="flex max-h-[calc(100vh-4rem)] w-full max-w-[1040px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl max-sm:max-h-[calc(100vh-60px)] max-sm:rounded-b-none"
		>
			<!-- Top bar -->
			<div
				class="flex flex-shrink-0 items-center justify-between border-b border-border px-5 py-2.5"
			>
				<div class="flex items-center gap-2">
					{#if form.showDeleteConfirm}
						<span class="text-sm font-medium text-red-500">{$_('todo.deleteConfirm')}</span>
						<button
							class="rounded-md px-2.5 py-1 text-sm text-red-500 transition-colors hover:bg-red-500/10"
							onclick={handleDelete}>{$_('todo.yesDelete')}</button
						>
						<button
							class="rounded-md px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted"
							onclick={() => (form.showDeleteConfirm = false)}>{$_('common.cancel')}</button
						>
					{:else}
						<button
							class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
							onclick={handleDelete}
							title={$_('common.delete')}
						>
							<Trash size={16} />
						</button>
					{/if}
				</div>
				<div class="flex items-center gap-2">
					<button
						class="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-45"
						onclick={handleSave}
						disabled={form.isLoading || !form.title.trim()}
					>
						{#if form.isLoading}
							<span
								class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-transparent border-t-white"
							></span>
						{:else}
							{$_('common.save')}
						{/if}
					</button>
					<button
						class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						onclick={onClose}
						title={$_('todo.close')}
					>
						<X size={18} />
					</button>
				</div>
			</div>

			<!-- Title -->
			<div class="flex-shrink-0 px-6 pb-3 pt-4">
				<textarea
					class="w-full resize-none overflow-hidden border-none bg-transparent p-0 text-2xl font-bold text-foreground outline-none placeholder:text-border"
					bind:value={form.title}
					placeholder={$_('todo.newTask')}
					rows="1"
					use:autoGrow
				></textarea>
			</div>

			<!-- Content: Description | Subtasks -->
			<div
				class="grid min-h-0 flex-1 grid-cols-1 overflow-hidden border-t border-border sm:grid-cols-2"
			>
				<div class="flex flex-col gap-2.5 overflow-y-auto p-5">
					<span class="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground"
						>{$_('todo.description')}</span
					>
					<textarea
						class="min-h-[100px] flex-1 resize-none border-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-border"
						bind:value={form.description}
						placeholder={$_('todo.addDescription')}
						rows="5"
					></textarea>
				</div>

				<div
					class="flex flex-col gap-2.5 overflow-y-auto border-t border-border p-5 sm:border-l sm:border-t-0"
				>
					<span class="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground"
						>{$_('todo.subtasks')}</span
					>
					<SubtaskList subtasks={form.subtasks} onChange={handleSubtasksChange} />
				</div>
			</div>

			<!-- Properties strip -->
			<div class="flex flex-shrink-0 flex-wrap items-stretch border-t border-border bg-muted/30">
				<!-- Status -->
				<div class="flex flex-col gap-1 border-r border-border px-3.5 py-2">
					<span class="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground"
						>{$_('todo.status')}</span
					>
					<select
						class="border-none bg-transparent text-sm text-foreground outline-none"
						bind:value={form.status}
					>
						<option value="pending">{$_('todo.statusPending')}</option>
						<option value="in_progress">{$_('todo.statusInProgress')}</option>
						<option value="completed">{$_('todo.statusCompleted')}</option>
						<option value="cancelled">{$_('todo.statusCancelled')}</option>
					</select>
				</div>

				<!-- Priority -->
				<div class="flex flex-col gap-1 border-r border-border px-3.5 py-2">
					<span class="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground"
						>{$_('todo.priority')}</span
					>
					<PrioritySelector value={form.priority} onChange={(p) => (form.priority = p)} />
				</div>

				<!-- Due Date -->
				<div class="flex flex-col gap-1 border-r border-border px-3.5 py-2">
					<span class="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground"
						>{$_('todo.dueDate')}</span
					>
					<input
						type="date"
						class="border-none bg-transparent text-sm text-foreground outline-none"
						bind:value={form.dueDate}
					/>
				</div>

				<!-- Time -->
				<div class="flex flex-col gap-1 border-r border-border px-3.5 py-2">
					<span class="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground"
						>{$_('todo.time')}</span
					>
					<input
						type="time"
						class="border-none bg-transparent text-sm text-foreground outline-none"
						bind:value={form.dueTime}
					/>
				</div>

				<!-- Start Date -->
				<div class="flex flex-col gap-1 border-r border-border px-3.5 py-2">
					<span class="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground"
						>{$_('todo.startDate')}</span
					>
					<input
						type="date"
						class="border-none bg-transparent text-sm text-foreground outline-none"
						bind:value={form.startDate}
					/>
				</div>

				<!-- Recurrence -->
				<div class="flex flex-col gap-1 border-r border-border px-3.5 py-2">
					<span class="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground"
						>{$_('todo.recurrence')}</span
					>
					<select
						class="border-none bg-transparent text-sm text-foreground outline-none"
						bind:value={form.recurrenceRule}
					>
						{#each RECURRENCE_OPTIONS as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>

				<!-- Reminder -->
				<div class="flex flex-col gap-1 border-r border-border px-3.5 py-2">
					<span class="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground"
						>{$_('todo.reminder')}</span
					>
					<ReminderSelector
						value={form.reminderMinutes}
						onChange={(v) => (form.reminderMinutes = v)}
						disabled={!form.dueDate}
					/>
				</div>

				<!-- Tags -->
				<div class="flex min-w-[140px] flex-1 flex-col gap-1 border-r border-border px-3.5 py-2">
					<span class="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground"
						>{$_('todo.tags')}</span
					>
					<TagSelector
						selectedIds={form.selectedLabelIds}
						onChange={(ids) => (form.selectedLabelIds = ids)}
					/>
				</div>

				<!-- Story Points -->
				<div class="flex flex-col gap-1 border-r border-border px-3.5 py-2">
					<span class="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground"
						>{$_('todo.storypoints')}</span
					>
					<StorypointsSelector value={form.storyPoints} onChange={(v) => (form.storyPoints = v)} />
				</div>

				<!-- Duration -->
				<div class="flex flex-col gap-1 border-r border-border px-3.5 py-2">
					<span class="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground"
						>{$_('todo.duration')}</span
					>
					<DurationPicker
						value={form.effectiveDuration}
						onChange={(v) => (form.effectiveDuration = v)}
					/>
				</div>

				<!-- Fun Rating -->
				<div class="flex flex-col gap-1 px-3.5 py-2">
					<span class="text-[0.625rem] font-bold uppercase tracking-widest text-muted-foreground"
						>{$_('todo.fun')}</span
					>
					<FunRatingPicker value={form.funRating} onChange={(v) => (form.funRating = v)} />
				</div>
			</div>
		</div>
	</div>
{/if}
