<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { dataService } from '$lib/api';
	import type { Character } from '$lib/types/character';
	import { isSystemCharacter } from '$lib/types/character';

	let character = $state<Character | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Edit state
	let isEditing = $state(false);
	let editedName = $state('');
	let saving = $state(false);

	// Story creation state
	let storyPrompt = $state('');
	let creatingStory = $state(false);

	// Get character ID from route params
	let characterId = $derived($page.params.id);
	let isSystem = $derived(character ? isSystemCharacter(character) : false);

	// Fetch character data
	async function loadCharacter() {
		if (!characterId) return;

		loading = true;
		error = null;

		try {
			character = await dataService.getCharacterById(characterId);
			editedName = character.name;
		} catch (err) {
			console.error('[CharacterDetail] Failed to load character:', err);
			error = err instanceof Error ? err.message : 'Charakter konnte nicht geladen werden';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadCharacter();
	});

	// Get image URL
	function getImageUrl(char: Character): string {
		return char.imageUrl || char.image_url || '/images/placeholder-character.png';
	}

	// Save name edit
	async function handleSaveName() {
		if (!character || !editedName.trim()) return;

		saving = true;
		try {
			await dataService.updateCharacter(character.id, { name: editedName.trim() });
			character = { ...character, name: editedName.trim() };
			isEditing = false;
		} catch (err) {
			console.error('[CharacterDetail] Failed to update name:', err);
			error = 'Name konnte nicht gespeichert werden';
		} finally {
			saving = false;
		}
	}

	// Cancel editing
	function handleCancelEdit() {
		if (character) {
			editedName = character.name;
		}
		isEditing = false;
	}

	// Archive character
	async function handleArchive() {
		if (!character || !confirm(`Möchtest du "${character.name}" wirklich archivieren?`)) return;

		try {
			await dataService.updateCharacter(character.id, { archived: true });
			goto('/characters');
		} catch (err) {
			console.error('[CharacterDetail] Failed to archive:', err);
			error = 'Charakter konnte nicht archiviert werden';
		}
	}

	// Create story with this character
	async function handleCreateStory() {
		if (!character || !storyPrompt.trim()) return;

		creatingStory = true;
		error = null;

		try {
			const result = await dataService.createStory({
				storyDescription: storyPrompt,
				characters: [character.id],
			});
			goto(`/stories/${result.storyId}`);
		} catch (err) {
			console.error('[CharacterDetail] Failed to create story:', err);
			error = err instanceof Error ? err.message : 'Geschichte konnte nicht erstellt werden';
			creatingStory = false;
		}
	}

	// Copy share code
	function handleCopyShareCode() {
		if (character?.share_code) {
			navigator.clipboard.writeText(character.share_code);
			// Could add a toast notification here
		}
	}
</script>

<svelte:head>
	<title>{character?.name || 'Charakter'} | Märchenzauber</title>
</svelte:head>

<!-- Creating Story Overlay -->
{#if creatingStory}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur">
		<div class="flex flex-col items-center gap-6 p-8 text-center">
			<div class="relative">
				<div class="h-24 w-24 animate-spin rounded-full border-4 border-pink-500/30 border-t-pink-500"></div>
				<div class="absolute inset-0 flex items-center justify-center">
					<svg class="h-10 w-10 animate-pulse text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
					</svg>
				</div>
			</div>
			<div>
				<h2 class="mb-2 text-xl font-bold text-white">Geschichte wird erschaffen...</h2>
				<p class="text-white/70">Die Magie arbeitet!</p>
			</div>
		</div>
	</div>
{/if}

{#if loading}
	<!-- Loading State -->
	<div class="mx-auto max-w-2xl animate-pulse space-y-8 p-4">
		<div class="flex flex-col items-center gap-4">
			<div class="h-48 w-48 rounded-full bg-gray-200 dark:bg-gray-700"></div>
			<div class="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
		</div>
		<div class="h-32 rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
	</div>
{:else if error && !character}
	<!-- Error State -->
	<div class="mx-auto max-w-md p-4 text-center">
		<div class="rounded-2xl bg-red-50 p-8 dark:bg-red-900/20">
			<svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			<h2 class="mt-4 text-xl font-bold text-red-600 dark:text-red-400">Fehler</h2>
			<p class="mt-2 text-red-500 dark:text-red-300">{error}</p>
			<button
				onclick={() => goto('/characters')}
				class="mt-6 rounded-xl bg-red-500 px-6 py-2 font-medium text-white hover:bg-red-600"
			>
				Zurück zur Übersicht
			</button>
		</div>
	</div>
{:else if character}
	<div class="mx-auto max-w-2xl space-y-8">
		<!-- Back Link -->
		<a
			href="/characters"
			class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
			</svg>
			Zurück zu Charakteren
		</a>

		<!-- Error Alert -->
		{#if error}
			<div class="rounded-xl bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
				{error}
			</div>
		{/if}

		<!-- Character Header -->
		<div class="flex flex-col items-center text-center">
			<!-- Character Image -->
			<div class="relative">
				<div class="h-48 w-48 overflow-hidden rounded-full border-4 border-pink-500 shadow-xl shadow-pink-500/20">
					<img
						src={getImageUrl(character)}
						alt={character.name}
						class="h-full w-full object-cover"
					/>
				</div>
				{#if isSystem}
					<div
						class="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 shadow-lg"
						title="System-Charakter"
					>
						<svg class="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
						</svg>
					</div>
				{/if}
			</div>

			<!-- Character Name -->
			{#if isEditing}
				<div class="mt-6 w-full max-w-sm space-y-4">
					<input
						type="text"
						bind:value={editedName}
						class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-xl font-bold text-gray-800 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
					/>
					<div class="flex gap-3">
						<button
							onclick={handleCancelEdit}
							class="flex-1 rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
						>
							Abbrechen
						</button>
						<button
							onclick={handleSaveName}
							disabled={saving || !editedName.trim()}
							class="flex-1 rounded-xl bg-pink-500 px-4 py-2 font-medium text-white hover:bg-pink-600 disabled:opacity-50"
						>
							{saving ? 'Speichern...' : 'Speichern'}
						</button>
					</div>
				</div>
			{:else}
				<h1 class="mt-6 text-3xl font-bold text-gray-800 dark:text-gray-200">
					{character.name}
				</h1>
			{/if}

			<!-- Sharing Status Badge -->
			{#if character.share_code && !isSystem}
				<div class="mt-3 flex items-center gap-2">
					<span class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
						</svg>
						Geteilt
					</span>
					<button
						onclick={handleCopyShareCode}
						class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-pink-600 dark:text-gray-400"
						title="Share-Code kopieren"
					>
						<span class="font-mono">{character.share_code.slice(0, 8)}</span>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
						</svg>
					</button>
				</div>
			{/if}

			<!-- Action Buttons (only for non-system characters) -->
			{#if !isSystem && !isEditing}
				<div class="mt-6 flex flex-wrap justify-center gap-3">
					<button
						onclick={() => (isEditing = true)}
						class="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
						</svg>
						Bearbeiten
					</button>
					<button
						onclick={handleArchive}
						class="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-100 hover:text-red-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
						</svg>
						Archivieren
					</button>
				</div>
			{/if}
		</div>

		<!-- Quick Story Creation -->
		<div class="rounded-2xl bg-white/80 p-6 shadow-lg backdrop-blur dark:bg-gray-800/80">
			<h2 class="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
				Neue Geschichte mit {character.name}
			</h2>
			<p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
				Beschreibe eine Geschichte und {character.name} wird der Hauptcharakter sein.
			</p>
			<textarea
				bind:value={storyPrompt}
				placeholder="z.B. {character.name} erlebt ein spannendes Abenteuer im Zauberwald..."
				rows={4}
				class="w-full resize-none rounded-xl border border-gray-200 bg-white p-4 text-gray-800 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
			></textarea>
			<button
				onclick={handleCreateStory}
				disabled={creatingStory || !storyPrompt.trim()}
				class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:from-pink-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
				</svg>
				Geschichte erstellen
			</button>
		</div>

		<!-- Character Info (if available) -->
		{#if character.originalDescription}
			<div class="rounded-2xl bg-gray-50 p-6 dark:bg-gray-800/50">
				<h3 class="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
					Original-Beschreibung
				</h3>
				<p class="text-gray-700 dark:text-gray-300">
					{character.originalDescription}
				</p>
			</div>
		{/if}
	</div>
{/if}
