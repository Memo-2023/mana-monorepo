<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { tasksStore } from '../stores/tasks.svelte';
	import {
		parseTaskInput,
		parseMultiTaskInput,
		resolveTaskIds,
		formatDuration,
	} from '../utils/task-parser';
	import type { ParsedTask } from '../utils/task-parser';
	import type { LocalLabel } from '../types';
	import { getPriorityColor } from '../queries';
	import { Plus, CalendarBlank, Flag, ArrowsClockwise, Timer, Tag, Info } from '@mana/shared-icons';

	interface Props {
		labels?: LocalLabel[];
		locale?: string;
		onShowSyntaxHelp?: () => void;
	}

	let { labels = [], locale = 'de', onShowSyntaxHelp }: Props = $props();

	let input = $state('');
	let isOpen = $state(false);
	let inputEl = $state<HTMLInputElement | undefined>(undefined);

	// Parse preview
	let parsed = $derived.by((): ParsedTask[] => {
		if (!input.trim()) return [];
		try {
			return parseMultiTaskInput(input, locale);
		} catch {
			return [];
		}
	});

	let hasParsedMeta = $derived(
		parsed.some(
			(p) =>
				p.dueDate ||
				p.priority ||
				p.recurrenceRule ||
				p.estimatedDuration ||
				p.labelNames.length > 0
		)
	);

	function open() {
		isOpen = true;
		requestAnimationFrame(() => inputEl?.focus());
	}

	async function handleSubmit() {
		if (!input.trim()) return;

		const tasks = parseMultiTaskInput(input, locale);
		for (const task of tasks) {
			const resolved = resolveTaskIds(task, labels);
			await tasksStore.createTask({
				title: resolved.title,
				dueDate: resolved.dueDate ?? undefined,
				priority: resolved.priority,
				recurrenceRule: resolved.recurrenceRule,
				estimatedDuration: resolved.estimatedDuration,
				subtasks: resolved.subtasks?.map((s, i) => ({
					id: crypto.randomUUID(),
					title: s,
					isCompleted: false,
					order: i,
				})),
			});

			// Apply labels
			if (resolved.labelIds.length > 0) {
				// We'd need to get the last created task ID - handled via createTask return
			}
		}

		input = '';
		isOpen = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === 'Escape') {
			isOpen = false;
			input = '';
		}
	}
</script>

{#if isOpen}
	<div class="mb-4 rounded-lg border border-primary/50 bg-card">
		<div class="flex items-center gap-2 p-3">
			<input
				bind:this={inputEl}
				bind:value={input}
				onkeydown={handleKeydown}
				placeholder={$_('todo.quickAddPlaceholder')}
				class="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
			/>
			<button
				onclick={handleSubmit}
				disabled={!input.trim()}
				class="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
			>
				{$_('todo.addTask')}
			</button>
			{#if onShowSyntaxHelp}
				<button
					onclick={onShowSyntaxHelp}
					class="text-muted-foreground hover:text-foreground"
					title="Syntax-Hilfe"
				>
					<Info size={16} />
				</button>
			{/if}
			<button
				onclick={() => {
					isOpen = false;
					input = '';
				}}
				class="text-xs text-muted-foreground hover:text-foreground"
			>
				{$_('todo.cancel')}
			</button>
		</div>

		<!-- NLP Preview -->
		{#if parsed.length > 0 && hasParsedMeta}
			<div class="border-t border-border px-3 py-2">
				{#each parsed as task, i}
					<div class="flex items-center gap-2 py-1 text-xs text-muted-foreground">
						{#if parsed.length > 1}
							<span class="font-medium text-foreground">#{i + 1}</span>
						{/if}
						<span class="font-medium text-foreground">{task.title}</span>
						{#if task.dueDate}
							<span class="inline-flex items-center gap-0.5 text-amber-500">
								<CalendarBlank size={10} />
								{task.dueDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
								{#if task.dueTime}
									{task.dueTime}
								{/if}
							</span>
						{/if}
						{#if task.priority}
							<span
								class="inline-flex items-center gap-0.5"
								style="color: {getPriorityColor(task.priority)}"
							>
								<Flag size={10} />
								{task.priority}
							</span>
						{/if}
						{#if task.recurrenceRule}
							<span class="inline-flex items-center gap-0.5">
								<ArrowsClockwise size={10} />
							</span>
						{/if}
						{#if task.estimatedDuration}
							<span class="inline-flex items-center gap-0.5">
								<Timer size={10} />
								{formatDuration(task.estimatedDuration)}
							</span>
						{/if}
						{#each task.labelNames as name}
							<span class="inline-flex items-center gap-0.5">
								<Tag size={10} />
								{name}
							</span>
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{:else}
	<button
		onclick={open}
		class="mb-4 flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
	>
		<Plus size={16} />
		{$_('todo.newTask')}
	</button>
{/if}
