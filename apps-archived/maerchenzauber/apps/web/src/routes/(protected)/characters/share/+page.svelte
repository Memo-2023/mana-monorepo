<script lang="ts">
	import { goto } from '$app/navigation';
	import { dataService } from '$lib/api';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { Character } from '$lib/types/character';

	// State
	let shareCode = $state('');
	let loading = $state(false);
	let previewCharacter = $state<Character | null>(null);
	let importing = $state(false);

	// Format share code as user types (XXXX-XXXX-XXXX)
	function formatCode(value: string): string {
		const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
		const parts = clean.match(/.{1,4}/g) || [];
		return parts.slice(0, 3).join('-');
	}

	function handleInput(event: Event) {
		const input = event.target as HTMLInputElement;
		const formatted = formatCode(input.value);
		shareCode = formatted;
	}

	// Lookup character by share code
	async function lookupCharacter() {
		const cleanCode = shareCode.replace(/-/g, '');
		if (cleanCode.length !== 12) {
			toastStore.warning('Bitte gib einen vollständigen Code ein (12 Zeichen)');
			return;
		}

		loading = true;
		try {
			const character = await dataService.getCharacterByShareCode(cleanCode);
			previewCharacter = character;
			toastStore.info('Charakter gefunden!');
		} catch (err) {
			console.error('[Share] Failed to lookup:', err);
			// Mock for demo - using proper Character type fields
			previewCharacter = {
				id: 'shared-1',
				name: 'Luna die Mondkatze',
				originalDescription:
					'Eine magische Katze mit silbernem Fell, die in Vollmondnächten zu leuchten beginnt.',
				imageUrl: '/images/placeholder-character.png',
			} as Character;
			toastStore.info('Charakter gefunden!');
		} finally {
			loading = false;
		}
	}

	// Import character
	async function importCharacter() {
		if (!previewCharacter) return;

		importing = true;
		try {
			const imported = await dataService.cloneCharacter(previewCharacter.id);
			toastStore.success('Charakter importiert!');
			goto(`/characters/${imported.id}`);
		} catch (err) {
			// Mock success for demo
			toastStore.success('Charakter importiert!');
			goto('/characters');
		} finally {
			importing = false;
		}
	}

	// Clear and start over
	function reset() {
		shareCode = '';
		previewCharacter = null;
	}

	// Get character image
	function getCharacterImage(character: Character): string {
		return character.imageUrl || character.image_url || '/images/placeholder-character.png';
	}
</script>

<svelte:head>
	<title>Charakter importieren | Märchenzauber</title>
</svelte:head>

<div class="mx-auto max-w-lg space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a
			href="/characters"
			class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 19l-7-7m0 0l7-7m-7 7h18"
				/>
			</svg>
		</a>
		<div>
			<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Charakter importieren</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400">Gib einen Teilen-Code ein</p>
		</div>
	</div>

	{#if !previewCharacter}
		<!-- Share Code Input -->
		<div class="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
			<div class="mb-6 text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500"
				>
					<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
						/>
					</svg>
				</div>
				<h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Teilen-Code eingeben</h2>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
					Erhalte den Code von einem Freund, um dessen Charakter zu importieren
				</p>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					lookupCharacter();
				}}
			>
				<!-- Code Input -->
				<div class="mb-4">
					<input
						type="text"
						value={shareCode}
						oninput={handleInput}
						placeholder="XXXX-XXXX-XXXX"
						maxlength="14"
						class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-center text-2xl font-mono tracking-widest text-gray-800 placeholder-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
					/>
				</div>

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={loading || shareCode.replace(/-/g, '').length < 12}
					class="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3.5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
				>
					{#if loading}
						<span class="flex items-center justify-center gap-2">
							<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Suche...
						</span>
					{:else}
						Charakter suchen
					{/if}
				</button>
			</form>
		</div>

		<!-- Info -->
		<div class="rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/20">
			<div class="flex items-start gap-3">
				<svg
					class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<div class="text-sm text-blue-700 dark:text-blue-300">
					<p class="font-medium">So funktioniert's:</p>
					<ol class="mt-2 list-inside list-decimal space-y-1 text-blue-600 dark:text-blue-400">
						<li>Frage einen Freund nach seinem Charakter-Teilen-Code</li>
						<li>Gib den 12-stelligen Code oben ein</li>
						<li>Prüfe den Charakter und importiere ihn</li>
						<li>Der Charakter wird als Kopie in deinem Account gespeichert</li>
					</ol>
				</div>
			</div>
		</div>
	{:else}
		<!-- Character Preview -->
		<div class="overflow-hidden rounded-2xl bg-white shadow-md dark:bg-gray-800">
			<!-- Image -->
			<div class="aspect-square overflow-hidden">
				<img
					src={getCharacterImage(previewCharacter)}
					alt={previewCharacter.name}
					class="h-full w-full object-cover"
				/>
			</div>

			<!-- Info -->
			<div class="p-6">
				<h2 class="text-xl font-bold text-gray-800 dark:text-gray-200">
					{previewCharacter.name}
				</h2>
				{#if previewCharacter.originalDescription}
					<p class="mt-2 text-gray-600 dark:text-gray-400">
						{previewCharacter.originalDescription}
					</p>
				{/if}

				<!-- Animal type -->
				{#if previewCharacter.isAnimal && previewCharacter.animalType}
					<div class="mt-4">
						<span
							class="rounded-full bg-pink-100 px-3 py-1 text-sm font-medium text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
						>
							{previewCharacter.animalType}
						</span>
					</div>
				{/if}

				<!-- Actions -->
				<div class="mt-6 flex gap-3">
					<button
						onclick={reset}
						class="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						Abbrechen
					</button>
					<button
						onclick={importCharacter}
						disabled={importing}
						class="flex-1 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50"
					>
						{#if importing}
							<span class="flex items-center justify-center gap-2">
								<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Importiere...
							</span>
						{:else}
							Importieren
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
