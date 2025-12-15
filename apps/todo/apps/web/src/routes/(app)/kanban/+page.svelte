<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import type { TaskPriority } from '@todo/shared';
	import { authStore } from '$lib/stores/auth.svelte';
	import { kanbanStore } from '$lib/stores/kanban.svelte';
	import { KanbanBoard, KanbanFilters, BoardNavigation } from '$lib/components/kanban';

	// Filter state
	let filterPriorities = $state<TaskPriority[]>([]);
	let filterProjectId = $state<string | null>(null);
	let filterLabelIds = $state<string[]>([]);
	let filterSearchQuery = $state('');
	let showFilters = $state(false);

	// Board creation state
	let showCreateBoard = $state(false);
	let newBoardName = $state('');
	let newBoardColor = $state('#8b5cf6');
	let isCreatingBoard = $state(false);

	// Editable title state
	let isEditingTitle = $state(false);
	let editTitle = $state('');

	// Responsive state - Mobile breakpoint at 768px
	let isMobile = $state(false);

	function checkMobile() {
		isMobile = window.innerWidth < 768;
	}

	// Get current board from store
	let currentBoard = $derived(kanbanStore.currentBoard);
	let boardTitle = $derived(currentBoard?.name ?? 'Kanban Board');

	function startEditingTitle() {
		if (!currentBoard) return;
		editTitle = currentBoard.name;
		isEditingTitle = true;
	}

	async function saveTitle() {
		if (!currentBoard || !editTitle.trim()) {
			isEditingTitle = false;
			return;
		}

		if (editTitle.trim() !== currentBoard.name) {
			await kanbanStore.updateBoard(currentBoard.id, { name: editTitle.trim() });
		}
		isEditingTitle = false;
	}

	function handleTitleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			saveTitle();
		} else if (event.key === 'Escape') {
			isEditingTitle = false;
		}
	}

	function clearFilters() {
		filterPriorities = [];
		filterProjectId = null;
		filterLabelIds = [];
		filterSearchQuery = '';
	}

	let hasActiveFilters = $derived(
		filterPriorities.length > 0 ||
			filterProjectId !== null ||
			filterLabelIds.length > 0 ||
			filterSearchQuery.trim() !== ''
	);

	// Board operations
	async function handleSelectBoard(boardId: string) {
		await kanbanStore.selectBoard(boardId);
	}

	function openCreateBoard() {
		newBoardName = '';
		newBoardColor = '#8b5cf6';
		showCreateBoard = true;
	}

	async function handleCreateBoard() {
		if (!newBoardName.trim()) return;

		isCreatingBoard = true;
		try {
			const board = await kanbanStore.createBoard({
				name: newBoardName.trim(),
				color: newBoardColor,
			});
			showCreateBoard = false;
			await kanbanStore.selectBoard(board.id);
		} catch (e) {
			console.error('Failed to create board:', e);
		} finally {
			isCreatingBoard = false;
		}
	}

	function handleCreateBoardKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !isCreatingBoard) {
			handleCreateBoard();
		} else if (event.key === 'Escape') {
			showCreateBoard = false;
		}
	}

	// Color options for board creation
	const boardColors = [
		'#8b5cf6', // violet
		'#3b82f6', // blue
		'#22c55e', // green
		'#f59e0b', // amber
		'#ef4444', // red
		'#ec4899', // pink
		'#06b6d4', // cyan
		'#6b7280', // gray
	];

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Check initial mobile state
		checkMobile();
		window.addEventListener('resize', checkMobile);

		// Fetch boards first
		await kanbanStore.fetchBoards();

		// If no boards exist, get/create the global board
		if (kanbanStore.boards.length === 0) {
			await kanbanStore.getOrCreateGlobalBoard();
		}

		// Fetch kanban data for current board
		if (kanbanStore.currentBoardId) {
			await kanbanStore.fetchKanbanData(kanbanStore.currentBoardId);
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('resize', checkMobile);
		}
	});
</script>

<svelte:head>
	<title>{boardTitle} - Todo</title>
</svelte:head>

<div class="kanban-page">
	<!-- Board Navigation - Top on Desktop -->
	{#if !isMobile}
		<BoardNavigation
			boards={kanbanStore.boards}
			currentBoardId={kanbanStore.currentBoardId}
			loading={kanbanStore.boardsLoading}
			position="top"
			onSelectBoard={handleSelectBoard}
			onCreateBoard={openCreateBoard}
		/>
	{/if}

	<!-- Header with editable title -->
	<div class="mb-6 flex items-center justify-between px-4 sm:px-6 lg:px-8">
		<div class="editable-title">
			{#if isEditingTitle}
				<!-- svelte-ignore a11y_autofocus -->
				<input
					type="text"
					bind:value={editTitle}
					onblur={saveTitle}
					onkeydown={handleTitleKeydown}
					class="title-input"
					autofocus
				/>
			{:else}
				<button class="title-button" onclick={startEditingTitle} title="Klicken zum Bearbeiten">
					<h1>{boardTitle}</h1>
					<svg class="edit-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
						/>
					</svg>
				</button>
			{/if}
		</div>
		<button
			type="button"
			onclick={() => (showFilters = !showFilters)}
			class="filter-button px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 {showFilters ||
			hasActiveFilters
				? 'active'
				: ''}"
		>
			<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
			</svg>
			Filter
			{#if hasActiveFilters}
				<span
					class="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary-foreground text-primary"
				>
					{filterPriorities.length +
						(filterProjectId ? 1 : 0) +
						filterLabelIds.length +
						(filterSearchQuery ? 1 : 0)}
				</span>
			{/if}
		</button>
	</div>

	<!-- Collapsible Filters -->
	{#if showFilters}
		<div class="mb-6 px-4 sm:px-6 lg:px-8 animate-in slide-in-from-top-2 duration-200">
			<KanbanFilters
				selectedPriorities={filterPriorities}
				selectedProjectId={filterProjectId}
				selectedLabelIds={filterLabelIds}
				searchQuery={filterSearchQuery}
				onPrioritiesChange={(priorities) => (filterPriorities = priorities)}
				onProjectChange={(projectId) => (filterProjectId = projectId)}
				onLabelsChange={(labelIds) => (filterLabelIds = labelIds)}
				onSearchChange={(query) => (filterSearchQuery = query)}
				onClearFilters={clearFilters}
			/>
		</div>
	{/if}

	<!-- Board Container -->
	<div class="board-container" class:mobile-bottom-padding={isMobile}>
		<KanbanBoard {filterPriorities} {filterProjectId} {filterLabelIds} {filterSearchQuery} />
	</div>

	<!-- Board Navigation - Bottom on Mobile -->
	{#if isMobile}
		<BoardNavigation
			boards={kanbanStore.boards}
			currentBoardId={kanbanStore.currentBoardId}
			loading={kanbanStore.boardsLoading}
			position="bottom"
			onSelectBoard={handleSelectBoard}
			onCreateBoard={openCreateBoard}
		/>
	{/if}
</div>

<!-- Create Board Modal -->
{#if showCreateBoard}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="modal-overlay"
		onclick={() => (showCreateBoard = false)}
		onkeydown={(e) => e.key === 'Escape' && (showCreateBoard = false)}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="modal-content"
			onclick={(e) => e.stopPropagation()}
			onkeydown={() => {}}
			role="document"
		>
			<h2 class="modal-title">Neues Board erstellen</h2>

			<div class="modal-body">
				<label class="input-label">
					Name
					<!-- svelte-ignore a11y_autofocus -->
					<input
						type="text"
						bind:value={newBoardName}
						onkeydown={handleCreateBoardKeydown}
						class="input-field"
						placeholder="z.B. Projekt Alpha"
						autofocus
					/>
				</label>

				<div class="color-picker">
					<span class="input-label">Farbe</span>
					<div class="color-options">
						{#each boardColors as color}
							<button
								type="button"
								class="color-option"
								class:selected={newBoardColor === color}
								style="background-color: {color}"
								onclick={() => (newBoardColor = color)}
							>
								{#if newBoardColor === color}
									<svg
										class="check-icon"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="3"
									>
										<path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
									</svg>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="modal-actions">
				<button
					type="button"
					class="btn-cancel"
					onclick={() => (showCreateBoard = false)}
					disabled={isCreatingBoard}
				>
					Abbrechen
				</button>
				<button
					type="button"
					class="btn-create"
					onclick={handleCreateBoard}
					disabled={isCreatingBoard || !newBoardName.trim()}
				>
					{#if isCreatingBoard}
						Erstelle...
					{:else}
						Erstellen
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.kanban-page {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 140px);
	}

	.board-container {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.board-container.mobile-bottom-padding {
		padding-bottom: 70px; /* Space for fixed BoardNavigation */
	}

	/* Glass-Pill filter button */
	.filter-button {
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 9999px;
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		color: #6b7280;
	}

	:global(.dark) .filter-button {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #9ca3af;
	}

	.filter-button:hover {
		background: rgba(255, 255, 255, 0.95);
		border-color: rgba(0, 0, 0, 0.15);
		transform: translateY(-1px);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
		color: #374151;
	}

	:global(.dark) .filter-button:hover {
		background: rgba(255, 255, 255, 0.2);
		border-color: rgba(255, 255, 255, 0.25);
		color: #f3f4f6;
	}

	.filter-button.active {
		background: #8b5cf6;
		border-color: #8b5cf6;
		color: white;
		box-shadow:
			0 4px 6px -1px rgba(139, 92, 246, 0.3),
			0 2px 4px -1px rgba(139, 92, 246, 0.2);
	}

	.filter-button.active:hover {
		background: #7c3aed;
		border-color: #7c3aed;
		color: white;
	}

	/* Editable title styles */
	.editable-title {
		display: flex;
		align-items: center;
	}

	.title-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: none;
		border: none;
		padding: 0.25rem 0.5rem;
		margin: -0.25rem -0.5rem;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.15s;
	}

	.title-button:hover {
		background: rgba(0, 0, 0, 0.05);
	}

	:global(.dark) .title-button:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.title-button h1 {
		font-size: 1.875rem;
		font-weight: 700;
		color: var(--foreground);
		margin: 0;
	}

	.edit-icon {
		width: 1rem;
		height: 1rem;
		opacity: 0;
		color: var(--muted-foreground);
		transition: opacity 0.15s;
	}

	.title-button:hover .edit-icon {
		opacity: 1;
	}

	.title-input {
		font-size: 1.875rem;
		font-weight: 700;
		color: var(--foreground);
		background: transparent;
		border: none;
		border-bottom: 2px solid var(--primary);
		outline: none;
		padding: 0.25rem 0;
		min-width: 200px;
	}

	/* Modal styles */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		animation: fadeIn 0.15s ease-out;
	}

	.modal-content {
		background: var(--background);
		border-radius: 1rem;
		padding: 1.5rem;
		width: 90%;
		max-width: 400px;
		box-shadow:
			0 25px 50px -12px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(0, 0, 0, 0.05);
		animation: slideUp 0.2s ease-out;
	}

	:global(.dark) .modal-content {
		box-shadow:
			0 25px 50px -12px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(255, 255, 255, 0.1);
	}

	.modal-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--foreground);
		margin: 0 0 1.5rem;
	}

	.modal-body {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.input-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--muted-foreground);
		margin-bottom: 0.375rem;
	}

	.input-field {
		width: 100%;
		padding: 0.625rem 0.875rem;
		font-size: 0.9375rem;
		color: var(--foreground);
		background: var(--input);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		outline: none;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.input-field:focus {
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
	}

	.color-picker {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.color-options {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.color-option {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition:
			transform 0.15s,
			border-color 0.15s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.color-option:hover {
		transform: scale(1.1);
	}

	.color-option.selected {
		border-color: var(--foreground);
	}

	.check-icon {
		width: 1rem;
		height: 1rem;
		color: white;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.btn-cancel,
	.btn-create {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-cancel {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--muted-foreground);
	}

	.btn-cancel:hover:not(:disabled) {
		background: var(--accent);
		color: var(--foreground);
	}

	.btn-create {
		background: #8b5cf6;
		border: none;
		color: white;
	}

	.btn-create:hover:not(:disabled) {
		background: #7c3aed;
	}

	.btn-create:disabled,
	.btn-cancel:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Animations */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-in {
		animation: animateIn 0.2s ease-out;
	}

	.slide-in-from-top-2 {
		--tw-enter-translate-y: -0.5rem;
	}

	@keyframes animateIn {
		from {
			opacity: 0;
			transform: translateY(var(--tw-enter-translate-y, 0));
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
