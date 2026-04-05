<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { boardsStore } from '$lib/modules/picture/stores/boards.svelte';
	import type { BoardWithCount } from '$lib/modules/picture/types';
	import { Plus, SquaresFour, Image, Trash, Copy } from '@mana/shared-icons';

	const allBoards: { value: BoardWithCount[] } = getContext('allBoards');

	// Create board form
	let showCreateForm = $state(false);
	let boardName = $state('');
	let boardDescription = $state('');
	let isCreating = $state(false);

	// Delete confirmation
	let showDeleteConfirm = $state(false);
	let deletingBoardId = $state<string | null>(null);

	async function handleCreateBoard() {
		if (!boardName.trim()) return;

		isCreating = true;
		const result = await boardsStore.createBoard({
			name: boardName,
			description: boardDescription || undefined,
		});

		if (result.success) {
			boardName = '';
			boardDescription = '';
			showCreateForm = false;
		}
		isCreating = false;
	}

	async function handleDeleteBoard() {
		if (!deletingBoardId) return;
		await boardsStore.deleteBoard(deletingBoardId);
		showDeleteConfirm = false;
		deletingBoardId = null;
	}

	async function handleDuplicate(boardId: string) {
		await boardsStore.duplicateBoard(boardId);
	}

	function confirmDelete(boardId: string) {
		deletingBoardId = boardId;
		showDeleteConfirm = true;
	}
</script>

<svelte:head>
	<title>Moodboards - Picture - Mana</title>
</svelte:head>

<div class="p-4">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Moodboards</h1>
			<p class="mt-1 text-sm text-muted-foreground">
				Erstelle und organisiere deine Bilder auf einem Canvas
			</p>
		</div>
		<button
			onclick={() => (showCreateForm = true)}
			class="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
		>
			<Plus size={16} />
			Neues Board
		</button>
	</div>

	{#if allBoards.value.length === 0}
		<!-- Empty State -->
		<div class="flex flex-col items-center justify-center py-20">
			<SquaresFour size={96} weight="thin" class="text-muted-foreground/30" />
			<h3 class="mt-4 text-xl font-semibold text-foreground">Keine Boards vorhanden</h3>
			<p class="mt-2 text-muted-foreground">
				Erstelle dein erstes Moodboard und organisiere deine Bilder
			</p>
			<button
				onclick={() => (showCreateForm = true)}
				class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
			>
				Erstes Board erstellen
			</button>
		</div>
	{:else}
		<!-- Boards Grid -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each allBoards.value as board (board.id)}
				<div
					class="group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-lg hover:border-primary/50"
				>
					<!-- Thumbnail -->
					<button
						onclick={() => goto(`/picture/board/${board.id}`)}
						class="block w-full overflow-hidden"
						style="aspect-ratio: 4/3; background-color: {board.backgroundColor || '#ffffff'}"
					>
						{#if board.thumbnailUrl}
							<img
								src={board.thumbnailUrl}
								alt={board.name}
								class="h-full w-full object-cover transition-transform group-hover:scale-105"
							/>
						{:else}
							<div class="flex h-full items-center justify-center">
								<Image size={48} weight="thin" class="text-muted-foreground/30" />
							</div>
						{/if}
					</button>

					<!-- Info -->
					<div class="p-3">
						<button onclick={() => goto(`/picture/board/${board.id}`)} class="w-full text-left">
							<h3 class="font-semibold text-foreground">{board.name}</h3>
							{#if board.description}
								<p class="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
									{board.description}
								</p>
							{/if}
						</button>

						<div class="mt-2 flex items-center justify-between text-xs text-muted-foreground">
							<span>{board.itemCount} {board.itemCount === 1 ? 'Element' : 'Elemente'}</span>
							<span>{new Date(board.updatedAt).toLocaleDateString('de-DE')}</span>
						</div>

						<!-- Actions -->
						<div class="mt-2 flex gap-2">
							<button
								onclick={() => handleDuplicate(board.id)}
								class="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-1"
							>
								<Copy size={12} />
								Duplizieren
							</button>
							<button
								onclick={() => confirmDelete(board.id)}
								class="rounded-lg border border-border px-2 py-1 text-muted-foreground hover:text-red-600 hover:border-red-200 transition-colors"
							>
								<Trash size={14} />
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Board Modal -->
{#if showCreateForm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
			<h2 class="mb-4 text-xl font-semibold text-foreground">Neues Board erstellen</h2>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleCreateBoard();
				}}
				class="space-y-4"
			>
				<div>
					<label for="board-name" class="mb-1 block text-sm font-medium text-foreground">Name</label
					>
					<input
						id="board-name"
						type="text"
						bind:value={boardName}
						placeholder="Mein Moodboard"
						required
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
					/>
				</div>

				<div>
					<label for="board-desc" class="mb-1 block text-sm font-medium text-foreground">
						Beschreibung (optional)
					</label>
					<textarea
						id="board-desc"
						bind:value={boardDescription}
						placeholder="Beschreibe dein Board..."
						rows="3"
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
					></textarea>
				</div>

				<div class="flex gap-3 pt-2">
					<button
						type="button"
						onclick={() => (showCreateForm = false)}
						class="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
					>
						Abbrechen
					</button>
					<button
						type="submit"
						disabled={!boardName.trim() || isCreating}
						class="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
					>
						{isCreating ? $_('common.creating') : $_('common.create')}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
			<h2 class="text-lg font-semibold text-foreground">Board löschen?</h2>
			<p class="mt-2 text-sm text-muted-foreground">
				Möchtest du dieses Board wirklich löschen? Alle Bilder auf dem Board bleiben in deiner
				Galerie erhalten.
			</p>
			<div class="mt-4 flex gap-3">
				<button
					onclick={() => (showDeleteConfirm = false)}
					class="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
				>
					Abbrechen
				</button>
				<button
					onclick={handleDeleteBoard}
					class="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
				>
					Löschen
				</button>
			</div>
		</div>
	</div>
{/if}
