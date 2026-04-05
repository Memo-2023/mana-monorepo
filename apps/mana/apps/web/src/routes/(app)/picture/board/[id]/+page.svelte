<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import { boardsStore } from '$lib/modules/picture/stores/boards.svelte';
	import { findBoardById } from '$lib/modules/picture/queries';
	import type { BoardWithCount } from '$lib/modules/picture/types';
	import { CaretLeft, Trash, PencilSimple, Image } from '@mana/shared-icons';

	const allBoards: { value: BoardWithCount[] } = getContext('allBoards');

	let boardId = $derived($page.params.id);
	let board = $derived(findBoardById(allBoards.value, boardId));

	// Edit state
	let isEditing = $state(false);
	let editName = $state('');
	let editDescription = $state('');

	function startEditing() {
		if (!board) return;
		editName = board.name;
		editDescription = board.description ?? '';
		isEditing = true;
	}

	async function handleSave() {
		if (!board) return;
		await boardsStore.updateBoard(board.id, {
			name: editName,
			description: editDescription || null,
		});
		isEditing = false;
	}

	async function handleDelete() {
		if (!board) return;
		await boardsStore.deleteBoard(board.id);
		goto('/picture/board');
	}
</script>

<svelte:head>
	<title>{board?.name ?? 'Board'} - Picture - Mana</title>
</svelte:head>

<div class="flex h-full flex-col">
	{#if !board}
		<div class="flex flex-col items-center justify-center py-20">
			<p class="text-lg text-muted-foreground">Board nicht gefunden</p>
			<a href="/picture/board" class="mt-4 text-sm text-primary hover:underline">
				Zurück zu den Boards
			</a>
		</div>
	{:else}
		<!-- Toolbar -->
		<header class="flex items-center justify-between border-b border-border px-4 py-3">
			<div class="flex items-center gap-3">
				<a
					href="/picture/board"
					class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
				>
					<CaretLeft size={18} />
				</a>
				<div>
					<h1 class="font-semibold text-foreground">{board.name}</h1>
					{#if board.description}
						<p class="text-xs text-muted-foreground">{board.description}</p>
					{/if}
				</div>
			</div>

			<div class="flex items-center gap-2">
				<button
					onclick={startEditing}
					class="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
					title={$_('common.edit')}
				>
					<PencilSimple size={18} />
				</button>
				<button
					onclick={handleDelete}
					class="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 transition-colors"
					title={$_('common.delete')}
				>
					<Trash size={18} />
				</button>
			</div>
		</header>

		<!-- Canvas Area (placeholder) -->
		<div
			class="flex-1 flex items-center justify-center"
			style="background-color: {board.backgroundColor}"
		>
			<div class="text-center">
				<Image size={64} weight="thin" class="mx-auto text-muted-foreground/30" />
				<p class="mt-4 text-lg font-medium text-muted-foreground">Canvas-Editor</p>
				<p class="mt-1 text-sm text-muted-foreground">
					Der vollständige Canvas-Editor mit Drag-and-Drop wird in einem zukünftigen Update
					hinzugefügt.
				</p>
				<p class="mt-2 text-xs text-muted-foreground">
					{board.canvasWidth} x {board.canvasHeight} px &middot; {board.itemCount}
					{board.itemCount === 1 ? 'Element' : 'Elemente'}
				</p>
			</div>
		</div>
	{/if}
</div>

<!-- Edit Modal -->
{#if isEditing && board}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
			<h2 class="mb-4 text-xl font-semibold text-foreground">Board bearbeiten</h2>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSave();
				}}
				class="space-y-4"
			>
				<div>
					<label for="edit-name" class="mb-1 block text-sm font-medium text-foreground">Name</label>
					<input
						id="edit-name"
						type="text"
						bind:value={editName}
						required
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
					/>
				</div>

				<div>
					<label for="edit-desc" class="mb-1 block text-sm font-medium text-foreground"
						>Beschreibung</label
					>
					<textarea
						id="edit-desc"
						bind:value={editDescription}
						rows="3"
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
					></textarea>
				</div>

				<div class="flex gap-3 pt-2">
					<button
						type="button"
						onclick={() => (isEditing = false)}
						class="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
					>
						Abbrechen
					</button>
					<button
						type="submit"
						class="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
					>
						Speichern
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
