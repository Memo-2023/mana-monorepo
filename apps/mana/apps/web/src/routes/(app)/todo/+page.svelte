<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getContext, onMount } from 'svelte';
	import type { Observable } from 'dexie';
	import type { DragPayload } from '@mana/shared-ui/dnd';
	import { type Task, type TaskTag, tasksStore, taskTable } from '$lib/modules/todo';
	import { Gear } from '@mana/shared-icons';
	import { ShareModal } from '@mana/shared-uload';

	// Components
	import TaskEditModal from '$lib/modules/todo/components/TaskEditModal.svelte';
	import QuickAddTask from '$lib/modules/todo/components/QuickAddTask.svelte';
	import SyncIndicator from '$lib/modules/todo/components/SyncIndicator.svelte';
	import SyntaxHelpOverlay from '$lib/modules/todo/components/SyntaxHelpOverlay.svelte';
	import OnboardingModal from '$lib/modules/todo/components/OnboardingModal.svelte';
	import TodoPage from '$lib/modules/todo/components/pages/TodoPage.svelte';
	import PagePicker from '$lib/modules/todo/components/pages/PagePicker.svelte';
	import { todoSettings } from '$lib/modules/todo/stores/settings.svelte';
	import type { PageConfig } from '$lib/modules/todo/stores/settings.svelte';
	import { getTaskStats } from '$lib/modules/todo';
	import { PageCarousel, type CarouselPage } from '$lib/components/page-carousel';

	// Get data from layout context
	const allTasks$: Observable<Task[]> = getContext('tasks');
	const allLabels$: Observable<TaskTag[]> = getContext('labels');

	let allTasks = $state<Task[]>([]);
	let allLabels = $state<TaskTag[]>([]);
	let isLoaded = $state(false);

	$effect(() => {
		const sub = allTasks$.subscribe((t) => {
			allTasks = t;
			isLoaded = true;
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = allLabels$.subscribe((l) => (allLabels = l));
		return () => sub.unsubscribe();
	});

	// Stats
	let stats = $derived(getTaskStats(allTasks));

	// Modal states
	let editTask = $state<Task | null>(null);
	let shareTask = $state<Task | null>(null);
	let showSyntaxHelp = $state(false);
	let showOnboarding = $state(false);

	let shareUrl = $derived(
		shareTask
			? `${typeof window !== 'undefined' ? window.location.origin : ''}/todo?task=${shareTask.id}`
			: ''
	);

	onMount(() => {
		try {
			if (!localStorage.getItem('todo-onboarding-done')) {
				showOnboarding = true;
			}
		} catch {}
	});

	// DnD tag drop handler
	const tagDropCtx = getContext<{
		set: (handler: (tagId: string, payload: DragPayload) => void) => void;
		clear: () => void;
	}>('tagDropHandler');

	onMount(() => {
		tagDropCtx?.set(async (tagId: string, payload: DragPayload) => {
			const taskData = payload.data as { id: string };
			const task = await taskTable.get(taskData.id);
			if (!task) return;
			const currentLabels: string[] = (task.metadata as { labelIds?: string[] })?.labelIds ?? [];
			if (!currentLabels.includes(tagId)) {
				tasksStore.updateLabels(taskData.id, [...currentLabels, tagId]);
			}
		});
		return () => tagDropCtx?.clear();
	});

	// ── Pages ───────────────────────────────────────────────
	const DEFAULT_WIDTH = 480;
	let showPagePicker = $state(false);
	let openPages = $state<
		{
			id: string;
			minimized: boolean;
			maximized?: boolean;
			widthPx?: number;
			customTitle?: string;
		}[]
	>([{ id: 'todo', minimized: false }]);

	let customPages = $derived(todoSettings.customPages);

	const PAGE_META: Record<string, { title: string; color: string }> = {
		todo: { title: 'To Do', color: '#6B7280' },
		completed: { title: 'Erledigt', color: '#22C55E' },
		today: { title: 'Heute', color: '#F59E0B' },
		overdue: { title: 'Überfällig', color: '#EF4444' },
		all: { title: 'Alle Aufgaben', color: '#3B82F6' },
		'high-priority': { title: 'Hohe Priorität', color: '#EF4444' },
		'this-week': { title: 'Diese Woche', color: '#8B5CF6' },
		'no-date': { title: 'Ohne Datum', color: '#6B7280' },
	};

	const ICON_COLORS: Record<string, string> = {
		warning: '#EF4444',
		calendar: '#3B82F6',
		'calendar-dots': '#8B5CF6',
		check: '#22C55E',
		star: '#F59E0B',
		lightning: '#F97316',
		clock: '#6B7280',
		fire: '#EF4444',
		leaf: '#22C55E',
		heart: '#EC4899',
	};

	// Map to CarouselPage[]
	let carouselPages = $derived<CarouselPage[]>(
		openPages.map((p) => {
			const config = getCustomPageConfig(p.id);
			const preset = PAGE_META[p.id];
			const title = p.customTitle ?? config?.label ?? preset?.title ?? p.id;
			const color = config?.icon
				? (ICON_COLORS[config.icon] ?? '#8B5CF6')
				: (preset?.color ?? '#6B7280');
			return {
				id: p.id,
				minimized: p.minimized,
				maximized: p.maximized,
				widthPx: p.widthPx ?? DEFAULT_WIDTH,
				title,
				color,
			};
		})
	);

	function handleAddPage(pageId: string) {
		if (!openPages.some((p) => p.id === pageId)) {
			openPages = [...openPages, { id: pageId, minimized: false }];
		} else {
			openPages = openPages.map((p) => (p.id === pageId ? { ...p, minimized: false } : p));
		}
		showPagePicker = false;
	}

	function handleRemovePage(id: string) {
		openPages = openPages.filter((p) => p.id !== id);
	}

	function handleMinimizePage(id: string) {
		openPages = openPages.map((p) => (p.id === id ? { ...p, minimized: true } : p));
	}

	function handleRestorePage(id: string) {
		openPages = openPages.map((p) => (p.id === id ? { ...p, minimized: false } : p));
	}

	function handleMaximizePage(id: string) {
		openPages = openPages.map((p) =>
			p.id === id ? { ...p, maximized: !p.maximized, minimized: false } : p
		);
	}

	function handleResize(id: string, widthPx: number) {
		openPages = openPages.map((p) => (p.id === id ? { ...p, widthPx } : p));
	}

	function handleRenamePage(pageId: string, name: string) {
		openPages = openPages.map((p) => (p.id === pageId ? { ...p, customTitle: name } : p));
		if (pageId.startsWith('custom-')) {
			const updated = customPages.map((cp) => (cp.id === pageId ? { ...cp, label: name } : cp));
			todoSettings.update({ customPages: updated });
		}
	}

	function handleReorder(fromId: string, toId: string) {
		const fromIdx = openPages.findIndex((p) => p.id === fromId);
		const toIdx = openPages.findIndex((p) => p.id === toId);
		if (fromIdx === -1 || toIdx === -1) return;
		const pages = [...openPages];
		const [moved] = pages.splice(fromIdx, 1);
		pages.splice(toIdx, 0, moved);
		openPages = pages;
	}

	// ── Custom page CRUD ────────────────────────────────────
	function handleCreateCustomPage() {
		const id = `custom-${crypto.randomUUID().slice(0, 8)}`;
		const newPage: PageConfig = { id, label: 'Neue Seite', icon: 'star', filter: {} };
		todoSettings.update({ customPages: [...customPages, newPage] });
		openPages = [...openPages, { id, minimized: false }];
		showPagePicker = false;
	}

	function handleUpdateCustomPage(pageId: string, data: Partial<PageConfig>) {
		const updated = customPages.map((cp) => {
			if (cp.id !== pageId) return cp;
			return { ...cp, ...data, filter: data.filter ?? cp.filter };
		});
		todoSettings.update({ customPages: updated });
	}

	function handleDeletePage(pageId: string) {
		openPages = openPages.filter((p) => p.id !== pageId);
		if (pageId.startsWith('custom-')) {
			todoSettings.update({ customPages: customPages.filter((cp) => cp.id !== pageId) });
		}
	}

	function getCustomPageConfig(pageId: string): PageConfig | undefined {
		return customPages.find((cp) => cp.id === pageId);
	}
</script>

<svelte:head>
	<title>Todo - Mana</title>
</svelte:head>

<div class="todo-board">
	<!-- Header -->
	<header class="todo-header">
		<div>
			<h1 class="todo-title">Todo</h1>
			{#if isLoaded}
				<div class="todo-stats">
					<span>{stats.total} {$_('todo.tasks')}</span>
					<span>{stats.completed} {$_('todo.completed')}</span>
					{#if stats.overdue > 0}
						<span class="text-red-500">{stats.overdue} überfällig</span>
					{/if}
				</div>
			{/if}
		</div>
		<div class="todo-header-actions">
			<SyncIndicator />
			<a href="/todo/settings" class="settings-btn" title={$_('common.settings')}>
				<Gear size={16} />
			</a>
		</div>
	</header>

	<!-- Quick Add -->
	<div class="quick-add-wrapper">
		<QuickAddTask labels={allLabels} onShowSyntaxHelp={() => (showSyntaxHelp = true)} />
	</div>

	<!-- Pages carousel -->
	<PageCarousel
		pages={carouselPages}
		defaultWidth={DEFAULT_WIDTH}
		showPicker={showPagePicker}
		onReorder={handleReorder}
		onRestore={handleRestorePage}
		onMaximize={handleMaximizePage}
		onRemove={handleRemovePage}
		onTogglePicker={() => (showPagePicker = !showPagePicker)}
		addLabel="Seite hinzufügen"
	>
		{#snippet page(p)}
			{@const config = getCustomPageConfig(p.id)}
			{@const isCustom = p.id.startsWith('custom-')}
			<TodoPage
				pageId={p.id}
				{allTasks}
				widthPx={p.widthPx}
				title={openPages.find((op) => op.id === p.id)?.customTitle ?? config?.label}
				maximized={p.maximized}
				filterConfig={isCustom ? config?.filter : undefined}
				pageIcon={isCustom ? config?.icon : undefined}
				customPageConfig={isCustom ? config : undefined}
				onClose={() => handleRemovePage(p.id)}
				onMinimize={() => handleMinimizePage(p.id)}
				onMaximize={() => handleMaximizePage(p.id)}
				onResize={(w) => handleResize(p.id, w)}
				onRename={(name) => handleRenamePage(p.id, name)}
				onUpdateConfig={isCustom ? (data) => handleUpdateCustomPage(p.id, data) : undefined}
				onDelete={() => handleDeletePage(p.id)}
				onOpenTask={(task) => (editTask = task)}
			/>
		{/snippet}
		{#snippet picker()}
			<PagePicker
				onSelect={handleAddPage}
				onClose={() => (showPagePicker = false)}
				onCreateCustom={handleCreateCustomPage}
				activePageIds={openPages.map((p) => p.id)}
			/>
		{/snippet}
	</PageCarousel>
</div>

<!-- Task Edit Modal -->
{#if editTask}
	<TaskEditModal task={editTask} open={true} onClose={() => (editTask = null)} />
{/if}

<!-- Syntax Help Overlay -->
<SyntaxHelpOverlay open={showSyntaxHelp} onClose={() => (showSyntaxHelp = false)} />

<!-- Onboarding Modal -->
<OnboardingModal open={showOnboarding} onClose={() => (showOnboarding = false)} />

<!-- Share Modal -->
<ShareModal
	visible={shareTask !== null}
	onClose={() => (shareTask = null)}
	url={shareUrl}
	title={shareTask?.title ?? ''}
	source="todo"
	description={shareTask?.description ?? ''}
/>

<style>
	.todo-board {
		min-height: calc(100vh - 140px);
		display: flex;
		flex-direction: column;
		position: relative;
	}

	.todo-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 0 1rem;
		margin-bottom: 0.75rem;
	}

	.todo-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}

	.todo-stats {
		display: flex;
		gap: 1rem;
		margin-top: 0.25rem;
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.todo-header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.settings-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		color: hsl(var(--color-muted-foreground));
		transition: background 0.15s;
	}
	.settings-btn:hover {
		background: hsl(var(--color-muted));
	}

	.quick-add-wrapper {
		padding: 0 1rem;
		margin-bottom: 1rem;
	}

	:global(.mana-drop-target-hover) {
		outline: 2px solid hsl(var(--color-primary));
		outline-offset: -2px;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary) / 0.06) !important;
	}
	:global(.mana-drop-target-success) {
		animation: drop-success 400ms ease-out;
	}
	@keyframes drop-success {
		0% {
			outline-color: hsl(var(--color-success));
			background: hsl(var(--color-success) / 0.1);
		}
		100% {
			outline-color: transparent;
			background: transparent;
		}
	}
</style>
