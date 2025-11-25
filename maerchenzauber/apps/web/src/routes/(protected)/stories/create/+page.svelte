<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { dataService } from '$lib/api';
	import type { Character } from '$lib/types/character';

	let characters = $state<Character[]>([]);
	let selectedCharacter = $state<Character | null>(null);
	let storyPrompt = $state('');
	let loading = $state(true);
	let creating = $state(false);
	let error = $state<string | null>(null);

	// Fetch characters on mount
	async function fetchCharacters() {
		try {
			loading = true;
			characters = await dataService.getCharacters();
		} catch (e) {
			console.error('[CreateStory] Failed to fetch characters:', e);
			error = 'Charaktere konnten nicht geladen werden';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchCharacters();
	});

	// Select a character
	function selectCharacter(character: Character) {
		selectedCharacter = character;
	}

	// Create the story
	async function handleCreateStory() {
		if (!selectedCharacter) {
			error = 'Bitte wähle einen Charakter aus.';
			return;
		}

		if (!storyPrompt.trim()) {
			error = 'Bitte beschreibe deine Geschichte.';
			return;
		}

		creating = true;
		error = null;

		try {
			const result = await dataService.createStory({
				storyDescription: storyPrompt,
				characters: [selectedCharacter.id],
			});

			// Navigate to the newly created story
			goto(`/stories/${result.storyId}`);
		} catch (e) {
			console.error('[CreateStory] Failed to create story:', e);
			error = e instanceof Error ? e.message : 'Geschichte konnte nicht erstellt werden';
			creating = false;
		}
	}

	// Get image URL for a character
	function getImageUrl(character: Character): string {
		return character.imageUrl || character.image_url || '/images/placeholder-character.png';
	}
</script>

<svelte:head>
	<title>Geschichte erstellen | Märchenzauber</title>
</svelte:head>

<!-- Creating Overlay -->
{#if creating}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur">
		<div class="flex flex-col items-center gap-6 p-8 text-center">
			<!-- Magical Animation -->
			<div class="relative">
				<div class="h-24 w-24 animate-spin rounded-full border-4 border-pink-500/30 border-t-pink-500"></div>
				<div class="absolute inset-0 flex items-center justify-center">
					<svg class="h-10 w-10 animate-pulse text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
					</svg>
				</div>
			</div>

			<div>
				<h2 class="mb-2 text-xl font-bold text-white">Deine Geschichte wird erschaffen...</h2>
				<p class="text-white/70">
					Die Magie arbeitet! Dies kann bis zu 2 Minuten dauern.
				</p>
			</div>

			<!-- Progress Steps -->
			<div class="mt-4 flex flex-col gap-2 text-left text-sm text-white/60">
				<div class="flex items-center gap-2">
					<div class="h-2 w-2 animate-pulse rounded-full bg-pink-500"></div>
					<span>Geschichte wird geschrieben...</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="h-2 w-2 rounded-full bg-white/30"></div>
					<span>Illustrationen werden erstellt...</span>
				</div>
				<div class="flex items-center gap-2">
					<div class="h-2 w-2 rounded-full bg-white/30"></div>
					<span>Alles wird zusammengesetzt...</span>
				</div>
			</div>
		</div>
	</div>
{/if}

<div class="mx-auto max-w-4xl space-y-8">
	<!-- Header -->
	<div class="text-center">
		<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200 sm:text-3xl">
			Geschichte erstellen
		</h1>
		<p class="mt-2 text-gray-500 dark:text-gray-400">
			Wähle einen Charakter und beschreibe deine Geschichte
		</p>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="rounded-xl bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
			<div class="flex items-start gap-3">
				<svg class="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				<span>{error}</span>
			</div>
		</div>
	{/if}

	<!-- Step 1: Character Selection -->
	<section class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
				1. Wähle deinen Charakter
			</h2>
			<a
				href="/characters/create"
				class="text-sm font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
			>
				+ Neuen Charakter erstellen
			</a>
		</div>

		{#if loading}
			<!-- Loading Skeleton -->
			<div class="flex gap-4 overflow-x-auto pb-2">
				{#each Array(5) as _}
					<div class="flex flex-shrink-0 flex-col items-center gap-2">
						<div class="h-20 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700"></div>
						<div class="h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
					</div>
				{/each}
			</div>
		{:else if characters.length === 0}
			<!-- No Characters -->
			<div class="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
				<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
				</svg>
				<p class="mt-2 font-medium text-gray-700 dark:text-gray-300">Noch keine Charaktere</p>
				<p class="text-sm text-gray-500 dark:text-gray-400">
					Erstelle zuerst einen Charakter für deine Geschichte.
				</p>
				<a
					href="/characters/create"
					class="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Charakter erstellen
				</a>
			</div>
		{:else}
			<!-- Character Grid -->
			<div class="flex flex-wrap gap-4">
				{#each characters.filter(c => !c.archived) as character (character.id)}
					<button
						onclick={() => selectCharacter(character)}
						class="flex flex-col items-center gap-2 rounded-2xl p-3 transition-all {selectedCharacter?.id === character.id ? 'bg-pink-100 dark:bg-pink-900/30 ring-2 ring-pink-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}"
					>
						<div class="relative">
							<div class="h-20 w-20 overflow-hidden rounded-full border-3 border-white shadow-md dark:border-gray-700">
								<img
									src={getImageUrl(character)}
									alt={character.name}
									class="h-full w-full object-cover"
									loading="lazy"
								/>
							</div>
							{#if selectedCharacter?.id === character.id}
								<div class="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-white">
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
								</div>
							{/if}
						</div>
						<span class="max-w-[100px] truncate text-sm font-medium text-gray-700 dark:text-gray-300">
							{character.name}
						</span>
					</button>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Step 2: Story Prompt -->
	<section class="space-y-4">
		<h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
			2. Beschreibe deine Geschichte
		</h2>

		<div class="space-y-2">
			<textarea
				bind:value={storyPrompt}
				placeholder="z.B. Mein Charakter geht auf eine magische Reise durch einen verzauberten Wald und trifft dort sprechende Tiere..."
				rows={6}
				class="w-full resize-none rounded-xl border border-gray-200 bg-white p-4 text-gray-800 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
			></textarea>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				Beschreibe den Handlungsablauf, die Stimmung und wichtige Ereignisse. Die KI wird daraus eine passende Geschichte erstellen und illustrieren.
			</p>
		</div>
	</section>

	<!-- Submit Button -->
	<div class="flex justify-center pt-4">
		<button
			onclick={handleCreateStory}
			disabled={creating || !selectedCharacter || !storyPrompt.trim()}
			class="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-pink-600 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
		>
			<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
			</svg>
			Geschichte erstellen
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
			</svg>
		</button>
	</div>

	<!-- Credit Info -->
	<p class="text-center text-sm text-gray-500 dark:text-gray-400">
		Das Erstellen einer Geschichte kostet 10 Mana.
	</p>
</div>
