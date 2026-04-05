<script lang="ts">
	import { isToday, isTomorrow, isPast, startOfDay, addDays, subHours } from 'date-fns';
	import type { Task } from '../../types';
	import { tasksStore } from '../../stores/tasks.svelte';
	import type { PageConfig, PageIcon } from '../../stores/settings.svelte';
	import PageEditBar from './PageEditBar.svelte';
	import TaskItem from '../TaskItem.svelte';
	import {
		Circle,
		Warning,
		Calendar,
		CalendarDots,
		CheckCircle,
		Star,
		Lightning,
		Clock,
		Fire,
		Leaf,
		Heart,
	} from '@mana/shared-icons';
	import { PageShell } from '$lib/components/page-carousel';

	interface Props {
		pageId: string;
		allTasks: Task[];
		widthPx: number;
		title?: string;
		maximized?: boolean;
		filterConfig?: PageConfig['filter'];
		pageIcon?: PageIcon;
		customPageConfig?: PageConfig;
		onClose: () => void;
		onMinimize?: () => void;
		onMaximize?: () => void;
		onResize?: (widthPx: number) => void;
		onRename?: (name: string) => void;
		onUpdateConfig?: (data: Partial<PageConfig>) => void;
		onDelete?: () => void;
		onOpenTask?: (task: Task) => void;
	}

	let {
		pageId,
		allTasks,
		widthPx,
		title: customTitle,
		maximized = false,
		filterConfig,
		pageIcon,
		customPageConfig,
		onClose,
		onMinimize,
		onMaximize,
		onResize,
		onRename,
		onUpdateConfig,
		onDelete,
		onOpenTask,
	}: Props = $props();

	let titleEl = $state<HTMLSpanElement | null>(null);
	let isTitleFocused = $state(false);

	$effect(() => {
		if (titleEl && !isTitleFocused) {
			titleEl.textContent = displayTitle;
		}
	});

	function handleTitleInput() {
		const text = titleEl?.textContent?.trim() ?? '';
		if (text && onRename) onRename(text);
	}

	function handleTitleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			(e.target as HTMLElement).blur();
		}
	}

	const ICON_MAP: Record<PageIcon, typeof Warning> = {
		warning: Warning,
		calendar: Calendar,
		'calendar-dots': CalendarDots,
		check: CheckCircle,
		star: Star,
		lightning: Lightning,
		clock: Clock,
		fire: Fire,
		leaf: Leaf,
		heart: Heart,
	};

	const PAGE_META: Record<string, { title: string; color: string; icon?: PageIcon }> = {
		todo: { title: 'To Do', color: '#6B7280' },
		completed: { title: 'Erledigt', color: '#22C55E', icon: 'check' },
		today: { title: 'Heute', color: '#F59E0B', icon: 'calendar' },
		overdue: { title: 'Überfällig', color: '#EF4444', icon: 'warning' },
		all: { title: 'Alle Aufgaben', color: '#3B82F6' },
		'high-priority': { title: 'Hohe Priorität', color: '#EF4444', icon: 'fire' },
		'this-week': { title: 'Diese Woche', color: '#8B5CF6', icon: 'calendar-dots' },
		'no-date': { title: 'Ohne Datum', color: '#6B7280' },
	};

	let pageMeta = $derived(PAGE_META[pageId] ?? { title: pageId, color: '#6B7280' });
	let displayTitle = $derived(customTitle ?? pageMeta.title);
	let displayColor = $derived(pageMeta.color);
	let displayIcon = $derived(pageIcon ?? pageMeta.icon);
	let IconComponent = $derived(displayIcon ? ICON_MAP[displayIcon] : undefined);
	let isCustom = $derived(pageId.startsWith('custom-'));

	let filteredTasks = $derived.by(() => {
		const tasks = allTasks;
		const today = startOfDay(new Date());
		const weekEnd = addDays(today, 7);

		if (filterConfig) {
			return tasks.filter((task) => {
				if (filterConfig.completed) {
					if (!task.isCompleted) return false;
				} else {
					if (task.isCompleted) return false;
				}
				if (filterConfig.priorities?.length) {
					if (!filterConfig.priorities.includes(task.priority)) return false;
				}
				if (filterConfig.dateRange && filterConfig.dateRange !== 'any') {
					if (!task.dueDate) return false;
					const dueDate = startOfDay(new Date(task.dueDate));
					switch (filterConfig.dateRange) {
						case 'overdue':
							if (!isPast(dueDate) || isToday(dueDate)) return false;
							break;
						case 'today':
							if (!isToday(dueDate)) return false;
							break;
						case 'tomorrow':
							if (!isTomorrow(dueDate)) return false;
							break;
						case 'upcoming':
							if (isPast(dueDate) && !isToday(dueDate)) return false;
							break;
					}
				}
				return true;
			});
		}

		switch (pageId) {
			case 'todo': {
				const recentCutoff = subHours(new Date(), 24);
				return tasks.filter(
					(t) =>
						!t.isCompleted ||
						(t.isCompleted && t.completedAt && new Date(t.completedAt) >= recentCutoff)
				);
			}
			case 'completed':
				return tasks.filter((t) => t.isCompleted);
			case 'today':
				return tasks.filter(
					(t) =>
						!t.isCompleted &&
						t.dueDate &&
						(isToday(new Date(t.dueDate)) || isPast(startOfDay(new Date(t.dueDate))))
				);
			case 'overdue':
				return tasks.filter(
					(t) =>
						!t.isCompleted &&
						t.dueDate &&
						isPast(startOfDay(new Date(t.dueDate))) &&
						!isToday(new Date(t.dueDate))
				);
			case 'all':
				return tasks;
			case 'high-priority':
				return tasks.filter(
					(t) => !t.isCompleted && (t.priority === 'urgent' || t.priority === 'high')
				);
			case 'this-week':
				return tasks.filter(
					(t) =>
						!t.isCompleted &&
						t.dueDate &&
						new Date(t.dueDate) <= weekEnd &&
						new Date(t.dueDate) >= today
				);
			case 'no-date':
				return tasks.filter((t) => !t.isCompleted && !t.dueDate);
			default:
				return [];
		}
	});

	let showCompleted = $derived(filterConfig?.completed ?? false);
	let openTasks = $derived(
		pageId === 'todo' ? filteredTasks.filter((t) => !t.isCompleted) : filteredTasks
	);
	let recentlyCompleted = $derived(
		pageId === 'todo' ? filteredTasks.filter((t) => t.isCompleted) : []
	);

	let newTaskTitle = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);

	async function handleInlineCreate() {
		const title = newTaskTitle.trim();
		if (!title) return;
		const data: Record<string, unknown> = { title };
		if (pageId === 'today' || filterConfig?.dateRange === 'today') {
			data.dueDate = new Date().toISOString();
		}
		if (filterConfig?.priorities?.length === 1) {
			data.priority = filterConfig.priorities[0];
		}
		await tasksStore.createTask(
			data as { title: string; dueDate?: string; priority?: 'low' | 'medium' | 'high' | 'urgent' }
		);
		newTaskTitle = '';
		inputEl?.focus();
	}
</script>

<PageShell
	{widthPx}
	{maximized}
	color={displayColor}
	icon={IconComponent}
	{onClose}
	{onMinimize}
	{onMaximize}
	{onResize}
>
	{#snippet header_left()}
		{#if IconComponent}
			<span class="header-icon" style="color: {displayColor}">
				<IconComponent size={16} weight="fill" />
			</span>
		{:else}
			<span class="color-dot" style="background-color: {displayColor}"></span>
		{/if}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<span
			bind:this={titleEl}
			class="page-title"
			contenteditable={!!onRename}
			oninput={handleTitleInput}
			onkeydown={handleTitleKeydown}
			onfocus={() => (isTitleFocused = true)}
			onblur={() => (isTitleFocused = false)}
		></span>
	{/snippet}

	{#snippet badge()}
		<span class="task-count">{filteredTasks.length}</span>
	{/snippet}

	{#snippet toolbar()}
		{#if isCustom && customPageConfig && onUpdateConfig && onDelete}
			<PageEditBar config={customPageConfig} onUpdate={onUpdateConfig} {onDelete} />
		{/if}
	{/snippet}

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="page-content" ondragstart={(e) => e.preventDefault()}>
		{#each openTasks as task (task.id)}
			<div class="task-card-wrapper" class:completed-task={task.isCompleted}>
				<TaskItem
					{task}
					compact={false}
					onToggleComplete={() => tasksStore.toggleComplete(task.id)}
					onClick={() => onOpenTask?.(task)}
					onContextMenu={() => {}}
				/>
			</div>
		{/each}

		{#if recentlyCompleted.length > 0}
			<div class="completed-section">
				<span class="completed-label">Kürzlich erledigt</span>
				{#each recentlyCompleted as task (task.id)}
					<div class="task-card-wrapper completed-task">
						<TaskItem
							{task}
							compact={false}
							onOpen={onOpenTask ? () => onOpenTask(task) : undefined}
						/>
					</div>
				{/each}
			</div>
		{/if}

		{#if !showCompleted && pageId !== 'completed'}
			<div class="inline-create">
				<span class="inline-create-icon"><Circle size={18} /></span>
				<input
					bind:this={inputEl}
					bind:value={newTaskTitle}
					class="inline-create-input"
					placeholder="Neue Aufgabe..."
					onkeydown={(e) => {
						if (e.key === 'Enter') handleInlineCreate();
					}}
				/>
			</div>
		{/if}
	</div>
</PageShell>

<style>
	.header-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}
	.color-dot {
		width: 0.625rem;
		height: 0.625rem;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	.page-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		outline: none;
		border-radius: 0.125rem;
	}
	.page-title[contenteditable='true'] {
		cursor: text;
	}
	:global(.dark) .page-title {
		color: #f3f4f6;
	}
	.task-count {
		font-size: 0.75rem;
		font-weight: 500;
		color: #9ca3af;
		background: rgba(0, 0, 0, 0.05);
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
	}
	:global(.dark) .task-count {
		background: rgba(255, 255, 255, 0.1);
		color: #6b7280;
	}
	.page-content {
		padding: 0.75rem 1rem;
	}
	.task-card-wrapper {
		margin-bottom: 0.5rem;
	}
	.task-card-wrapper:last-child {
		margin-bottom: 0;
	}
	.completed-task {
		opacity: 0.6;
	}
	.completed-section {
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .completed-section {
		border-top-color: rgba(255, 255, 255, 0.08);
	}
	.completed-label {
		font-size: 0.6875rem;
		font-weight: 500;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 0.5rem;
		display: block;
	}
	.inline-create {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.25rem;
		margin-top: 0.25rem;
	}
	.inline-create-icon {
		flex-shrink: 0;
		color: #d1d5db;
		display: flex;
		align-items: center;
	}
	:global(.dark) .inline-create-icon {
		color: #4b5563;
	}
	.inline-create-input {
		flex: 1;
		border: none;
		background: transparent;
		font-size: 0.8125rem;
		color: #374151;
		outline: none;
	}
	.inline-create-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .inline-create-input {
		color: #f3f4f6;
	}
	:global(.dark) .inline-create-input::placeholder {
		color: #4b5563;
	}
</style>
