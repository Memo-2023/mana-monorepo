<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import {
		boards,
		isLoadingBoards,
		currentBoardsPage,
		hasBoardsMore,
		showCreateBoardModal,
		selectedBoard,
		resetBoardsState,
		addBoard,
		removeBoardFromList,
	} from '$lib/stores/boards';
	import { getBoards, deleteBoard, duplicateBoard } from '$lib/api/boards';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { showToast } from '$lib/stores/toast';

	let loadingMore = $state(false);
	let observer: IntersectionObserver | null = null;
	let loadMoreTrigger = $state<HTMLElement | null>(null);

	// Create board modal state
	let boardName = $state('');
	let boardDescription = $state('');
	let isCreating = $state(false);

	// Delete confirmation modal
	let showDeleteModal = $state(false);
	let deletingBoard = $state<string | null>(null);

	onMount(async () => {
		resetBoardsState();
		await loadInitialBoards();

		// Setup Intersection Observer for infinite scroll
		observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && $hasBoardsMore && !$isLoadingBoards && !loadingMore) {
					loadMoreBoards();
				}
			},
			{
				threshold: 0.1,
				rootMargin: '100px',
			}
		);

		if (loadMoreTrigger) {
			observer.observe(loadMoreTrigger);
		}

		return () => {
			if (observer) observer.disconnect();
		};
	});

	async function loadInitialBoards() {
		if (!authStore.user) return;

		isLoadingBoards.set(true);
		try {
			const data = await getBoards({ userId: authStore.user.id, page: 1 });
			boards.set(data);
			currentBoardsPage.set(1);
			hasBoardsMore.set(data.length === 20);
		} catch (error) {
			console.error('Error loading boards:', error);
			showToast('Fehler beim Laden der Boards', 'error');
		} finally {
			isLoadingBoards.set(false);
		}
	}

	async function loadMoreBoards() {
		if (!authStore.user || !$hasBoardsMore || $isLoadingBoards || loadingMore) return;

		loadingMore = true;
		const nextPage = $currentBoardsPage + 1;

		try {
			const newBoards = await getBoards({ userId: authStore.user.id, page: nextPage });
			if (newBoards.length > 0) {
				boards.update((current) => [...current, ...newBoards]);
				currentBoardsPage.set(nextPage);
				hasBoardsMore.set(newBoards.length === 20);
			} else {
				hasBoardsMore.set(false);
			}
		} catch (error) {
			console.error('Error loading more boards:', error);
		} finally {
			loadingMore = false;
		}
	}

	async function handleCreateBoard() {
		if (!authStore.user || !boardName.trim()) return;

		isCreating = true;
		try {
			const { createBoard } = await import('$lib/api/boards');
			const newBoard = await createBoard({
				user_id: authStore.user.id,
				name: boardName,
				description: boardDescription || null,
			});
			addBoard({ ...newBoard, item_count: 0 });
			showCreateBoardModal.set(false);
			boardName = '';
			boardDescription = '';
			showToast('Board erstellt', 'success');
		} catch (error) {
			console.error('Error creating board:', error);
			showToast('Fehler beim Erstellen', 'error');
		} finally {
			isCreating = false;
		}
	}

	async function handleDeleteBoard() {
		if (!deletingBoard) return;

		try {
			await deleteBoard(deletingBoard);
			removeBoardFromList(deletingBoard);
			showDeleteModal = false;
			deletingBoard = null;
			showToast('Board gelöscht', 'success');
		} catch (error) {
			console.error('Error deleting board:', error);
			showToast('Fehler beim Löschen', 'error');
		}
	}

	async function handleDuplicateBoard(boardId: string) {
		if (!authStore.user) return;

		try {
			const newBoard = await duplicateBoard(boardId, authStore.user.id);
			addBoard({ ...newBoard, item_count: 0 });
			showToast('Board dupliziert', 'success');
		} catch (error) {
			console.error('Error duplicating board:', error);
			showToast('Fehler beim Duplizieren', 'error');
		}
	}

	function openBoard(boardId: string) {
		goto(`/app/board/${boardId}`);
	}

	function confirmDelete(boardId: string) {
		deletingBoard = boardId;
		showDeleteModal = true;
	}
</script>

<svelte:head>
	<title>Moodboards - Picture</title>
</svelte:head>

<div class="min-h-screen px-4 py-8">
	<!-- Header -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Moodboards</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">
				Erstelle und organisiere deine Bilder auf einem Canvas
			</p>
		</div>
		<Button onclick={() => showCreateBoardModal.set(true)}>
			<svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Neues Board
		</Button>
	</div>

	<!-- Loading State -->
	{#if $isLoadingBoards}
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each Array(8) as _}
				<div class="animate-pulse">
					<div class="aspect-[4/3] rounded-lg bg-gray-200 dark:bg-gray-700"></div>
					<div class="mt-3 h-6 rounded bg-gray-200 dark:bg-gray-700"></div>
					<div class="mt-2 h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700"></div>
				</div>
			{/each}
		</div>
	{:else if $boards.length === 0}
		<!-- Empty State -->
		<div class="flex flex-col items-center justify-center py-20">
			<svg
				class="h-24 w-24 text-gray-300 dark:text-gray-600"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
				/>
			</svg>
			<h3 class="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
				Keine Boards vorhanden
			</h3>
			<p class="mt-2 text-gray-600 dark:text-gray-400">
				Erstelle dein erstes Moodboard und organisiere deine Bilder
			</p>
			<Button class="mt-6" onclick={() => showCreateBoardModal.set(true)}>
				Erstes Board erstellen
			</Button>
		</div>
	{:else}
		<!-- Boards Grid -->
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each $boards as board (board.id)}
				<div
					class="group relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
				>
					<!-- Thumbnail -->
					<button
						onclick={() => openBoard(board.id)}
						class="block w-full overflow-hidden bg-gray-100 dark:bg-gray-700"
						style="aspect-ratio: 4/3; background-color: {board.background_color || '#ffffff'}"
					>
						{#if board.thumbnail_url}
							<img
								src={board.thumbnail_url}
								alt={board.name}
								class="h-full w-full object-cover transition-transform group-hover:scale-105"
							/>
						{:else}
							<div class="flex h-full items-center justify-center">
								<svg
									class="h-16 w-16 text-gray-300 dark:text-gray-600"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
							</div>
						{/if}
					</button>

					<!-- Info -->
					<div class="p-4">
						<button onclick={() => openBoard(board.id)} class="w-full text-left">
							<h3 class="font-semibold text-gray-900 dark:text-gray-100">
								{board.name}
							</h3>
							{#if board.description}
								<p class="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
									{board.description}
								</p>
							{/if}
						</button>

						<div
							class="mt-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400"
						>
							<span>{board.item_count} {board.item_count === 1 ? 'Bild' : 'Bilder'}</span>
							<span>{new Date(board.updated_at).toLocaleDateString('de-DE')}</span>
						</div>

						<!-- Actions -->
						<div class="mt-3 flex gap-2">
							<Button
								size="sm"
								variant="outline"
								class="flex-1"
								onclick={() => handleDuplicateBoard(board.id)}
							>
								Duplizieren
							</Button>
							<Button size="sm" variant="danger" onclick={() => confirmDelete(board.id)}>
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</Button>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Infinite Scroll Trigger -->
		{#if $hasBoardsMore}
			<div bind:this={loadMoreTrigger} class="mt-8 flex justify-center">
				{#if loadingMore}
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent dark:border-blue-400"
					></div>
				{:else}
					<p class="text-sm text-gray-500 dark:text-gray-400">Scroll to load more</p>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<!-- Create Board Modal -->
<Modal open={$showCreateBoardModal} onClose={() => showCreateBoardModal.set(false)}>
	<div class="p-6">
		<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Neues Board erstellen</h2>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleCreateBoard();
			}}
			class="mt-6 space-y-4"
		>
			<div>
				<label for="board-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
					Name
				</label>
				<input
					id="board-name"
					type="text"
					bind:value={boardName}
					placeholder="Mein Moodboard"
					required
					class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
				/>
			</div>

			<div>
				<label
					for="board-description"
					class="block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					Beschreibung (optional)
				</label>
				<textarea
					id="board-description"
					bind:value={boardDescription}
					placeholder="Beschreibe dein Board..."
					rows="3"
					class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
				></textarea>
			</div>

			<div class="flex gap-3 pt-4">
				<Button
					type="button"
					variant="outline"
					class="flex-1"
					onclick={() => showCreateBoardModal.set(false)}
				>
					Abbrechen
				</Button>
				<Button type="submit" class="flex-1" loading={isCreating} disabled={!boardName.trim()}>
					Erstellen
				</Button>
			</div>
		</form>
	</div>
</Modal>

<!-- Delete Confirmation Modal -->
<Modal open={showDeleteModal} onClose={() => (showDeleteModal = false)}>
	<div class="p-6">
		<h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Board löschen?</h2>
		<p class="mt-4 text-gray-600 dark:text-gray-400">
			Möchtest du dieses Board wirklich löschen? Alle Bilder auf dem Board bleiben in deiner Galerie
			erhalten.
		</p>

		<div class="mt-6 flex gap-3">
			<Button variant="outline" class="flex-1" onclick={() => (showDeleteModal = false)}>
				Abbrechen
			</Button>
			<Button variant="danger" class="flex-1" onclick={handleDeleteBoard}>Löschen</Button>
		</div>
	</div>
</Modal>
