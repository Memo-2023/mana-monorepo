<script lang="ts">
	import { Plus, MagnifyingGlass } from '@manacore/shared-icons';
	import { useAllSpaces } from '$lib/modules/context/queries';
	import { contextSpaceTable } from '$lib/modules/context/collections';
	import type { LocalContextSpace } from '$lib/modules/context/types';

	let searchQuery = $state('');
	let showCreateForm = $state(false);
	let newName = $state('');
	let newDescription = $state('');
	let newPrefix = $state('');
	let deleteTarget = $state<string | null>(null);

	const allSpaces = useAllSpaces();
	const spaces = $derived(allSpaces.value);

	const filteredSpaces = $derived(
		searchQuery.trim()
			? spaces.filter(
					(s) =>
						s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						s.description?.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: spaces
	);

	async function handleCreate() {
		if (!newName.trim()) return;
		const prefix = newPrefix.trim() || newName.trim()[0]?.toUpperCase() || 'S';
		await contextSpaceTable.add({
			id: crypto.randomUUID(),
			name: newName.trim(),
			description: newDescription.trim() || null,
			pinned: false,
			prefix,
		} satisfies LocalContextSpace);
		newName = '';
		newDescription = '';
		newPrefix = '';
		showCreateForm = false;
	}

	async function handleTogglePin(id: string) {
		const space = spaces.find((s) => s.id === id);
		if (space) {
			await contextSpaceTable.update(id, { pinned: !space.pinned });
		}
	}

	async function handleDelete(id: string) {
		await contextSpaceTable.delete(id);
		deleteTarget = null;
	}

	const inputClass =
		'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700';
</script>

<svelte:head>
	<title>Spaces - Context - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/context" class="text-sm opacity-60 hover:opacity-100">&larr; Context</a>
			<h1 class="text-2xl font-bold">Spaces</h1>
		</div>
		<button
			class="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
			onclick={() => (showCreateForm = !showCreateForm)}
		>
			<Plus size={16} />
			Neuer Space
		</button>
	</div>

	<!-- Create Form -->
	{#if showCreateForm}
		<div
			class="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
		>
			<h3 class="mb-4 text-lg font-semibold">Neuen Space erstellen</h3>
			<div class="space-y-4">
				<div>
					<label for="space-name" class="mb-1 block text-sm font-medium">Name</label>
					<input
						id="space-name"
						type="text"
						bind:value={newName}
						placeholder="Mein Workspace"
						class={inputClass}
						onkeydown={(e) => e.key === 'Enter' && handleCreate()}
					/>
				</div>
				<div>
					<label for="space-desc" class="mb-1 block text-sm font-medium"
						>Beschreibung (optional)</label
					>
					<textarea
						id="space-desc"
						bind:value={newDescription}
						rows="2"
						placeholder="Worum geht es in diesem Space?"
						class="{inputClass} resize-none"
					></textarea>
				</div>
				<div>
					<label for="space-prefix" class="mb-1 block text-sm font-medium">Prefix (optional)</label>
					<input
						id="space-prefix"
						type="text"
						bind:value={newPrefix}
						placeholder="W"
						maxlength="3"
						class="{inputClass} max-w-[100px]"
					/>
				</div>
				<div class="flex justify-end gap-2">
					<button
						onclick={() => (showCreateForm = false)}
						class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
					>
						Abbrechen
					</button>
					<button
						onclick={handleCreate}
						disabled={!newName.trim()}
						class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
					>
						Erstellen
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Search -->
	<div class="relative mb-6">
		<MagnifyingGlass size={16} class="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Spaces durchsuchen..."
			class="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-4 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-700"
		/>
	</div>

	{#if filteredSpaces.length > 0}
		<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
			{#each filteredSpaces as space (space.id)}
				<div
					class="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="flex items-start justify-between">
						<a href="/context/spaces/{space.id}" class="min-w-0 flex-1">
							<div class="flex items-center gap-3">
								<span
									class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-lg font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
								>
									{space.prefix || space.name[0]?.toUpperCase() || 'S'}
								</span>
								<div>
									<h3 class="font-semibold">{space.name}</h3>
									{#if space.description}
										<p class="text-xs opacity-60 line-clamp-2">{space.description}</p>
									{/if}
								</div>
							</div>
						</a>
						<div
							class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
						>
							<button
								onclick={() => handleTogglePin(space.id)}
								class="rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
								title={space.pinned ? 'Loslassen' : 'Anheften'}
							>
								{space.pinned ? '&#9733;' : '&#9734;'}
							</button>
							<button
								onclick={() => (deleteTarget = space.id)}
								class="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
								title="Loeschen"
							>
								&times;
							</button>
						</div>
					</div>
					<div class="mt-3 text-xs opacity-40">
						Erstellt: {new Date(space.created_at).toLocaleDateString('de')}
					</div>
				</div>
			{/each}
		</div>
	{:else if searchQuery}
		<div class="py-12 text-center">
			<p class="opacity-60">Keine Spaces gefunden fuer "{searchQuery}"</p>
		</div>
	{:else}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-16 text-center dark:border-gray-600"
		>
			<Plus size={48} class="mb-4 opacity-20" />
			<h2 class="text-lg font-medium opacity-60">Noch keine Spaces</h2>
			<p class="mt-1 max-w-md text-sm opacity-40">
				Spaces helfen dir, dein Wissen zu organisieren. Erstelle deinen ersten Space, um loszulegen.
			</p>
			<button
				class="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
				onclick={() => (showCreateForm = true)}
			>
				<Plus size={16} />
				Ersten Space erstellen
			</button>
		</div>
	{/if}
</div>

<!-- Delete Confirmation -->
{#if deleteTarget}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={() => (deleteTarget = null)}
	>
		<div
			class="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800"
			onclick={(e) => e.stopPropagation()}
		>
			<h3 class="text-lg font-semibold">Space loeschen?</h3>
			<p class="mt-2 text-sm opacity-60">
				Alle Dokumente in diesem Space werden ebenfalls geloescht. Diese Aktion kann nicht
				rueckgaengig gemacht werden.
			</p>
			<div class="mt-4 flex justify-end gap-2">
				<button
					onclick={() => (deleteTarget = null)}
					class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
				>
					Abbrechen
				</button>
				<button
					onclick={() => deleteTarget && handleDelete(deleteTarget)}
					class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
				>
					Loeschen
				</button>
			</div>
		</div>
	</div>
{/if}
