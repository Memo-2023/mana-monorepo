<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getContext, onMount } from 'svelte';
	import type { Observable } from 'dexie';
	import { dropTarget } from '@manacore/shared-ui/dnd';
	import type { DragPayload, TagDragData } from '@manacore/shared-ui/dnd';
	import { useAllTags } from '$lib/stores/tags.svelte';
	import {
		type Task,
		type LocalLabel,
		type LocalBoardView,
		type LocalTodoProject,
		tasksStore,
		taskTable,
	} from '$lib/modules/todo';
	import { Plus, PencilSimple, X, Gear, ArrowsOut } from '@manacore/shared-icons';
	import { ShareModal } from '@manacore/shared-uload';

	// Components
	import TaskEditModal from '$lib/modules/todo/components/TaskEditModal.svelte';
	import QuickAddTask from '$lib/modules/todo/components/QuickAddTask.svelte';
	import SyncIndicator from '$lib/modules/todo/components/SyncIndicator.svelte';
	import SyntaxHelpOverlay from '$lib/modules/todo/components/SyntaxHelpOverlay.svelte';
	import OnboardingModal from '$lib/modules/todo/components/OnboardingModal.svelte';
	import TodoPage from '$lib/modules/todo/components/pages/TodoPage.svelte';
	import PagePicker from '$lib/modules/todo/components/pages/PagePicker.svelte';
	import { todoSettings } from '$lib/modules/todo/stores/settings.svelte';
	import type { PageConfig, PageWidth } from '$lib/modules/todo/stores/settings.svelte';
	import { getTaskStats } from '$lib/modules/todo';

	// Get data from layout context
	const allTasks$: Observable<Task[]> = getContext('tasks');
	const allLabels$: Observable<LocalLabel[]> = getContext('labels');

	let allTasks = $state<Task[]>([]);
	let allLabels = $state<LocalLabel[]>([]);
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

	// ── Edit mode ──────────────────────────────────────────
	let editMode = $state(false);

	// ── Pages ───────────────────────────────────────────────
	let showPagePicker = $state(false);
	let openPages = $state<
		{ id: string; minimized: boolean; maximized?: boolean; customTitle?: string }[]
	>([{ id: 'todo', minimized: false }]);

	let expandedPages = $derived(openPages.filter((p) => !p.minimized));
	let customPages = $derived(todoSettings.customPages);

	// Minimized pages for tab bar
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

	let minimizedPages = $derived(
		openPages
			.filter((p) => p.minimized)
			.map((p) => {
				const config = getCustomPageConfig(p.id);
				const preset = PAGE_META[p.id];
				const title = p.customTitle ?? config?.label ?? preset?.title ?? p.id;
				const color = config?.icon
					? (ICON_COLORS[config.icon] ?? '#8B5CF6')
					: (preset?.color ?? '#6B7280');
				return { id: p.id, title, color };
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

	function handleRemovePage(pageId: string) {
		openPages = openPages.filter((p) => p.id !== pageId);
	}

	function handleMinimizePage(pageId: string) {
		openPages = openPages.map((p) => (p.id === pageId ? { ...p, minimized: true } : p));
	}

	function handleRestorePage(pageId: string) {
		openPages = openPages.map((p) => (p.id === pageId ? { ...p, minimized: false } : p));
	}

	function handleMaximizePage(pageId: string) {
		openPages = openPages.map((p) =>
			p.id === pageId ? { ...p, maximized: !p.maximized, minimized: false } : p
		);
	}

	function handleRenamePage(pageId: string, name: string) {
		openPages = openPages.map((p) => (p.id === pageId ? { ...p, customTitle: name } : p));
		if (pageId.startsWith('custom-')) {
			const updated = customPages.map((cp) => (cp.id === pageId ? { ...cp, label: name } : cp));
			todoSettings.update({ customPages: updated });
		}
	}

	// ── Custom page CRUD ────────────────────────────────────
	function handleCreateCustomPage() {
		const id = `custom-${crypto.randomUUID().slice(0, 8)}`;
		const newPage: PageConfig = { id, label: 'Neue Seite', icon: 'star', filter: {} };
		todoSettings.update({ customPages: [...customPages, newPage] });
		openPages = [...openPages, { id, minimized: false }];
		showPagePicker = false;
		editMode = true;
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

	// ── Page reorder ────────────────────────────────────────
	function handleMovePageLeft(pageId: string) {
		const idx = openPages.findIndex((p) => p.id === pageId);
		if (idx <= 0) return;
		const pages = [...openPages];
		[pages[idx - 1], pages[idx]] = [pages[idx], pages[idx - 1]];
		openPages = pages;
	}

	function handleMovePageRight(pageId: string) {
		const idx = openPages.findIndex((p) => p.id === pageId);
		if (idx === -1 || idx >= openPages.length - 1) return;
		const pages = [...openPages];
		[pages[idx], pages[idx + 1]] = [pages[idx + 1], pages[idx]];
		openPages = pages;
	}

	// ── Page drag reorder ───────────────────────────────────
	let dragPageId = $state<string | null>(null);

	function handlePageDragStart(e: DragEvent, pageId: string) {
		dragPageId = pageId;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', pageId);
		}
	}

	function handlePageDragOver(e: DragEvent) {
		if (!dragPageId) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
	}

	function handlePageDrop(e: DragEvent, targetPageId: string) {
		e.preventDefault();
		if (!dragPageId || dragPageId === targetPageId) return;
		const fromIdx = openPages.findIndex((p) => p.id === dragPageId);
		const toIdx = openPages.findIndex((p) => p.id === targetPageId);
		if (fromIdx === -1 || toIdx === -1) return;
		const pages = [...openPages];
		const [moved] = pages.splice(fromIdx, 1);
		pages.splice(toIdx, 0, moved);
		openPages = pages;
		dragPageId = null;
	}

	function handlePageDragEnd() {
		dragPageId = null;
	}

	function togglePagePicker() {
		showPagePicker = !showPagePicker;
	}

	function toggleEditMode() {
		editMode = !editMode;
		if (!editMode) showPagePicker = false;
	}

	// ── Width pills ─────────────────────────────────────────
	const WIDTH_OPTIONS: { id: PageWidth; label: string }[] = [
		{ id: 'narrow', label: 'S' },
		{ id: 'medium', label: 'M' },
		{ id: 'wide', label: 'L' },
		{ id: 'full', label: 'XL' },
	];

	function setPageWidth(width: PageWidth) {
		todoSettings.update({ pageWidth: width });
	}

	const PAGE_WIDTH_MAP: Record<string, string> = {
		narrow: 'min(360px, 85vw)',
		medium: 'min(480px, 85vw)',
		wide: 'min(640px, 90vw)',
		full: 'min(840px, 95vw)',
	};

	let sheetWidthVar = $derived(PAGE_WIDTH_MAP[todoSettings.pageWidth] || PAGE_WIDTH_MAP.medium);

	let pagePickerEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (showPagePicker && pagePickerEl) {
			pagePickerEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
		}
	});
</script>

<svelte:head>
	<title>Todo - ManaCore</title>
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
			<a href="/todo/settings" class="settings-btn" title="Einstellungen">
				<Gear size={16} />
			</a>
		</div>
	</header>

	<!-- Quick Add -->
	<div class="quick-add-wrapper">
		<QuickAddTask labels={allLabels} onShowSyntaxHelp={() => (showSyntaxHelp = true)} />
	</div>

	<!-- Width pills (visible in edit mode) -->
	{#if editMode}
		<div class="edit-toolbar">
			<div class="width-pills">
				{#each WIDTH_OPTIONS as opt (opt.id)}
					<button
						class="width-pill"
						class:active={todoSettings.pageWidth === opt.id}
						onclick={() => setPageWidth(opt.id)}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Pages carousel -->
	<div class="fokus-track" style="--sheet-width: {sheetWidthVar}">
		{#each expandedPages as page, pageIdx (page.id)}
			{@const config = getCustomPageConfig(page.id)}
			{@const isCustom = page.id.startsWith('custom-')}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="page-drag-wrapper"
				class:dragging={dragPageId === page.id}
				draggable={!editMode}
				ondragstart={(e) => handlePageDragStart(e, page.id)}
				ondragover={handlePageDragOver}
				ondrop={(e) => handlePageDrop(e, page.id)}
				ondragend={handlePageDragEnd}
			>
				<TodoPage
					pageId={page.id}
					{allTasks}
					title={page.customTitle ?? config?.label}
					maximized={page.maximized}
					{editMode}
					filterConfig={isCustom ? config?.filter : undefined}
					pageIcon={isCustom ? config?.icon : undefined}
					customPageConfig={isCustom ? config : undefined}
					isFirst={pageIdx === 0}
					isLast={pageIdx === expandedPages.length - 1}
					onClose={() => handleRemovePage(page.id)}
					onMinimize={() => handleMinimizePage(page.id)}
					onMaximize={() => handleMaximizePage(page.id)}
					onRename={(name) => handleRenamePage(page.id, name)}
					onUpdateConfig={isCustom ? (data) => handleUpdateCustomPage(page.id, data) : undefined}
					onMoveLeft={editMode ? () => handleMovePageLeft(page.id) : undefined}
					onMoveRight={editMode ? () => handleMovePageRight(page.id) : undefined}
					onDelete={editMode ? () => handleDeletePage(page.id) : undefined}
					onOpenTask={(task) => (editTask = task)}
				/>
			</div>
		{/each}

		<!-- Page picker / add button -->
		{#if expandedPages.length === 0}
			<div class="empty-pages-wrapper">
				{#if showPagePicker}
					<PagePicker
						onSelect={handleAddPage}
						onClose={() => (showPagePicker = false)}
						onCreateCustom={handleCreateCustomPage}
						activePageIds={openPages.map((p) => p.id)}
					/>
				{:else}
					<button
						class="neue-seite-card alone"
						onclick={togglePagePicker}
						title="Neue Seite hinzufügen"
					>
						<Plus size={24} />
						<span class="neue-seite-label">Seite hinzufügen</span>
					</button>
				{/if}
			</div>
		{:else if showPagePicker}
			<div bind:this={pagePickerEl}>
				<PagePicker
					onSelect={handleAddPage}
					onClose={() => (showPagePicker = false)}
					onCreateCustom={handleCreateCustomPage}
					activePageIds={openPages.map((p) => p.id)}
				/>
			</div>
		{:else}
			<button class="neue-seite-card" onclick={togglePagePicker} title="Neue Seite hinzufügen">
				<Plus size={18} />
			</button>
		{/if}
	</div>

	<!-- Minimized tabs bar -->
	{#if minimizedPages.length > 0}
		<div class="minimized-tabs">
			{#each minimizedPages as page (page.id)}
				<div class="minimized-tab group">
					<span class="tab-dot" style="background-color: {page.color}"></span>
					<button class="tab-title" onclick={() => handleRestorePage(page.id)}>
						{page.title}
					</button>
					<button
						class="tab-maximize"
						onclick={() => handleMaximizePage(page.id)}
						title="Maximieren"
					>
						<ArrowsOut size={12} />
					</button>
					<button class="tab-close" onclick={() => handleRemovePage(page.id)} title="Schließen">
						<X size={12} />
					</button>
				</div>
			{/each}
			<button class="tab-add" onclick={togglePagePicker} title="Seite hinzufügen">
				<Plus size={14} />
			</button>
		</div>
	{/if}

	<!-- Edit FAB -->
	<button
		class="edit-fab"
		class:active={editMode}
		onclick={toggleEditMode}
		title={editMode ? 'Bearbeitung beenden' : 'Seiten bearbeiten'}
	>
		{#if editMode}
			<X size={20} />
		{:else}
			<PencilSimple size={20} />
		{/if}
	</button>
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
		color: var(--color-foreground);
	}

	.todo-stats {
		display: flex;
		gap: 1rem;
		margin-top: 0.25rem;
		font-size: 0.875rem;
		color: var(--color-muted-foreground);
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
		color: var(--color-muted-foreground);
		transition: background 0.15s;
	}
	.settings-btn:hover {
		background: var(--color-muted);
	}

	.quick-add-wrapper {
		padding: 0 1rem;
		margin-bottom: 1rem;
	}

	/* Edit toolbar */
	.edit-toolbar {
		display: flex;
		justify-content: center;
		padding: 0.5rem 1rem;
		animation: fadeDown 0.2s ease-out;
	}
	@keyframes fadeDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.width-pills {
		display: flex;
		gap: 0.25rem;
		background: rgba(0, 0, 0, 0.04);
		border-radius: 0.5rem;
		padding: 0.125rem;
	}
	:global(.dark) .width-pills {
		background: rgba(255, 255, 255, 0.06);
	}
	.width-pill {
		padding: 0.25rem 0.75rem;
		border: none;
		border-radius: 0.375rem;
		background: transparent;
		color: #6b7280;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}
	.width-pill:hover {
		color: #374151;
		background: rgba(0, 0, 0, 0.04);
	}
	.width-pill.active {
		background: var(--color-primary, #8b5cf6);
		color: white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
	}
	:global(.dark) .width-pill {
		color: #9ca3af;
	}
	:global(.dark) .width-pill:hover {
		color: #e5e7eb;
		background: rgba(255, 255, 255, 0.08);
	}
	:global(.dark) .width-pill.active {
		background: var(--color-primary, #8b5cf6);
		color: white;
	}

	/* Pages carousel */
	.fokus-track {
		display: flex;
		gap: 1.5rem;
		overflow-x: auto;
		padding: 1rem calc(50% - var(--sheet-width) / 2);
		scrollbar-width: none;
		flex: 1;
	}
	.fokus-track::-webkit-scrollbar {
		display: none;
	}

	.page-drag-wrapper {
		flex: 0 0 auto;
		transition: opacity 0.15s;
	}
	.page-drag-wrapper.dragging {
		opacity: 0.4;
	}

	/* Add page button */
	.neue-seite-card {
		flex: 0 0 auto;
		width: 48px;
		align-self: stretch;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		border: 2px dashed rgba(0, 0, 0, 0.08);
		border-radius: 0.375rem;
		background: transparent;
		color: #9ca3af;
		cursor: pointer;
		transition: all 0.2s;
	}
	.empty-pages-wrapper {
		flex: 0 0 auto;
		width: var(--sheet-width, min(480px, 85vw));
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
	}
	.neue-seite-card.alone {
		width: 100%;
		min-height: 60vh;
		border-color: rgba(0, 0, 0, 0.12);
	}
	.neue-seite-card:hover {
		border-color: var(--color-primary, #8b5cf6);
		color: var(--color-primary, #8b5cf6);
		background: color-mix(in srgb, var(--color-primary, #8b5cf6) 4%, transparent);
	}
	:global(.dark) .neue-seite-card {
		border-color: rgba(255, 255, 255, 0.06);
		color: #4b5563;
	}
	:global(.dark) .neue-seite-card.alone {
		border-color: rgba(255, 255, 255, 0.1);
		color: #6b7280;
	}
	:global(.dark) .neue-seite-card:hover {
		border-color: var(--color-primary, #8b5cf6);
		color: var(--color-primary, #8b5cf6);
		background: color-mix(in srgb, var(--color-primary, #8b5cf6) 8%, transparent);
	}
	.neue-seite-label {
		font-size: 0.875rem;
		font-weight: 500;
		letter-spacing: 0.01em;
	}

	/* Minimized tabs */
	.minimized-tabs {
		position: fixed;
		bottom: 4.5rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 45;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.75rem;
		background: #fffef5;
		border: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		animation: slideUp 0.25s ease-out;
	}
	:global(.dark) .minimized-tabs {
		background: #252220;
		border-color: rgba(255, 255, 255, 0.08);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
	}
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.minimized-tab {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		transition: background 0.15s;
	}
	.minimized-tab:hover {
		background: rgba(0, 0, 0, 0.04);
	}
	:global(.dark) .minimized-tab:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.tab-dot {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		flex-shrink: 0;
	}

	.tab-title {
		border: none;
		background: none;
		color: #374151;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		max-width: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding: 0;
	}
	.tab-title:hover {
		color: var(--color-primary, #8b5cf6);
	}
	:global(.dark) .tab-title {
		color: #e5e7eb;
	}
	:global(.dark) .tab-title:hover {
		color: var(--color-primary, #8b5cf6);
	}

	.tab-maximize,
	.tab-close {
		border: none;
		background: none;
		color: #9ca3af;
		cursor: pointer;
		padding: 0.125rem;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		opacity: 0;
		transition: all 0.15s;
	}
	:global(.group:hover) .tab-maximize,
	:global(.group:hover) .tab-close,
	.minimized-tab:hover .tab-maximize,
	.minimized-tab:hover .tab-close {
		opacity: 1;
	}
	.tab-maximize:hover {
		color: var(--color-primary, #8b5cf6);
		background: rgba(139, 92, 246, 0.08);
	}
	.tab-close:hover {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.08);
	}

	.tab-add {
		border: none;
		background: none;
		color: #9ca3af;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		transition: all 0.15s;
		margin-left: 0.125rem;
	}
	.tab-add:hover {
		color: var(--color-primary, #8b5cf6);
		background: rgba(139, 92, 246, 0.08);
	}

	/* Edit FAB */
	.edit-fab {
		position: fixed;
		bottom: 5.5rem;
		right: 1.25rem;
		width: 44px;
		height: 44px;
		border-radius: 9999px;
		border: none;
		background: #fffef5;
		color: #6b7280;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.12),
			0 0 0 1px rgba(0, 0, 0, 0.06);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		z-index: 40;
	}
	.edit-fab:hover {
		color: var(--color-primary, #8b5cf6);
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.15),
			0 0 0 1px rgba(0, 0, 0, 0.08);
		transform: scale(1.05);
	}
	.edit-fab.active {
		background: var(--color-primary, #8b5cf6);
		color: white;
		box-shadow:
			0 4px 12px rgba(139, 92, 246, 0.3),
			0 0 0 1px rgba(139, 92, 246, 0.5);
	}
	.edit-fab.active:hover {
		background: color-mix(in srgb, var(--color-primary, #8b5cf6) 85%, black);
		color: white;
	}
	:global(.dark) .edit-fab {
		background: #252220;
		color: #9ca3af;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.3),
			0 0 0 1px rgba(255, 255, 255, 0.08);
	}
	:global(.dark) .edit-fab:hover {
		color: var(--color-primary, #8b5cf6);
	}
	:global(.dark) .edit-fab.active {
		background: var(--color-primary, #8b5cf6);
		color: white;
	}

	:global(.mana-drop-target-hover) {
		outline: 2px solid var(--color-primary, #6366f1);
		outline-offset: -2px;
		border-radius: 0.5rem;
		background: rgba(99, 102, 241, 0.06) !important;
	}
	:global(.mana-drop-target-success) {
		animation: drop-success 400ms ease-out;
	}
	@keyframes drop-success {
		0% {
			outline-color: #10b981;
			background: rgba(16, 185, 129, 0.1);
		}
		100% {
			outline-color: transparent;
			background: transparent;
		}
	}
</style>
