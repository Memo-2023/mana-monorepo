<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import { playlistsStore } from '$lib/modules/music/stores/playlists.svelte';
	import type { Playlist } from '$lib/modules/music/types';
	import {
		ArrowLeft,
		Plus,
		Trash,
		MusicNote,
		Playlist as PlaylistIcon,
		X,
	} from '@mana/shared-icons';

	const playlistsCtx: { readonly value: Playlist[] } = getContext('playlists');

	let showCreateModal = $state(false);
	let newName = $state('');
	let newDescription = $state('');
	let isCreating = $state(false);

	async function handleCreate() {
		if (!newName.trim()) return;
		isCreating = true;
		try {
			await playlistsStore.create(newName.trim(), newDescription.trim() || undefined);
			newName = '';
			newDescription = '';
			showCreateModal = false;
		} catch (e) {
			console.error('Failed to create playlist:', e);
		}
		isCreating = false;
	}

	async function handleDelete(id: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		if (!confirm('Playlist wirklich loschen?')) return;
		await playlistsStore.delete(id);
	}
</script>

<svelte:head>
	<title>Playlists - Music - Mana</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a
				href="/music"
				class="rounded-lg p-1.5 text-[hsl(var(--color-muted-foreground))] hover:bg-[hsl(var(--color-muted))]"
			>
				<ArrowLeft size={20} />
			</a>
			<h1 class="text-2xl font-bold text-[hsl(var(--color-foreground))]">Playlists</h1>
		</div>
		<button
			onclick={() => (showCreateModal = true)}
			class="flex items-center gap-2 rounded-lg bg-[hsl(var(--color-primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--color-primary-foreground))] hover:opacity-90"
		>
			<Plus size={16} />
			Neue Playlist
		</button>
	</div>

	{#if playlistsCtx.value.length === 0}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[hsl(var(--color-border))] py-16"
		>
			<PlaylistIcon size={48} class="mb-3 text-[hsl(var(--color-muted-foreground))]" />
			<p class="mb-3 text-[hsl(var(--color-muted-foreground))]">Noch keine Playlists</p>
			<button
				onclick={() => (showCreateModal = true)}
				class="text-sm text-[hsl(var(--color-primary))] hover:underline"
			>
				Erste Playlist erstellen
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each playlistsCtx.value as playlist (playlist.id)}
				<a
					href="/music/playlists/{playlist.id}"
					class="group relative rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-4 transition-all hover:border-[hsl(var(--color-primary)/0.3)]"
				>
					<div
						class="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-[hsl(var(--color-muted))]"
					>
						<MusicNote size={48} class="text-[hsl(var(--color-muted-foreground))]" />
					</div>
					<h3
						class="truncate font-medium text-[hsl(var(--color-foreground))] group-hover:text-[hsl(var(--color-primary))]"
					>
						{playlist.name}
					</h3>
					{#if playlist.description}
						<p class="mt-1 text-sm text-[hsl(var(--color-muted-foreground))] line-clamp-1">
							{playlist.description}
						</p>
					{/if}
					<button
						onclick={(e) => handleDelete(playlist.id, e)}
						class="absolute right-3 top-3 rounded-lg bg-[hsl(var(--color-card)/0.8)] p-1.5 text-[hsl(var(--color-muted-foreground))] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
					>
						<Trash size={16} />
					</button>
				</a>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Playlist Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div
			class="w-full max-w-md rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-6"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-bold text-[hsl(var(--color-foreground))]">Neue Playlist</h2>
				<button
					onclick={() => (showCreateModal = false)}
					class="rounded p-1 text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
				>
					<X size={20} />
				</button>
			</div>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleCreate();
				}}
			>
				<div class="mb-4">
					<label for="pl-name" class="mb-1 block text-sm font-medium">Name</label>
					<input
						id="pl-name"
						type="text"
						bind:value={newName}
						placeholder="Meine Playlist"
						required
						class="w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
					/>
				</div>
				<div class="mb-6">
					<label for="pl-desc" class="mb-1 block text-sm font-medium">Beschreibung (optional)</label
					>
					<textarea
						id="pl-desc"
						bind:value={newDescription}
						placeholder="Beschreibe deine Playlist..."
						rows="3"
						class="w-full resize-none rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]"
					></textarea>
				</div>
				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={() => (showCreateModal = false)}
						class="px-4 py-2 text-sm text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))]"
					>
						Abbrechen
					</button>
					<button
						type="submit"
						disabled={!newName.trim() || isCreating}
						class="rounded-lg bg-[hsl(var(--color-primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--color-primary-foreground))] hover:opacity-90 disabled:opacity-50"
					>
						{isCreating ? $_('common.creating') : $_('common.create')}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
