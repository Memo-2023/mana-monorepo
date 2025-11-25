<script lang="ts">
	import { goto } from '$app/navigation';
	import { fetchWithAuth } from '$lib/api/client';
	import { dataService } from '$lib/api';

	interface GeneratedImage {
		imageUrl: string;
		description: string;
	}

	// Form state
	let characterName = $state('');
	let characterDescription = $state('');

	// Creation mode
	let mode = $state<'description' | 'photo'>('description');

	// Photo upload state
	let uploadedFile = $state<File | null>(null);
	let uploadedPreview = $state<string | null>(null);

	// Generation state
	let generating = $state(false);
	let generatedImages = $state<GeneratedImage[]>([]);
	let selectedImage = $state<GeneratedImage | null>(null);
	let characterId = $state<string | null>(null);

	// Final save state
	let saving = $state(false);
	let error = $state<string | null>(null);

	// Handle file selection
	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (file) {
			uploadedFile = file;
			// Create preview URL
			uploadedPreview = URL.createObjectURL(file);
		}
	}

	// Generate character images from description
	async function handleGenerateFromDescription() {
		if (!characterName.trim() || !characterDescription.trim()) {
			error = 'Bitte gib einen Namen und eine Beschreibung ein.';
			return;
		}

		generating = true;
		error = null;
		generatedImages = [];
		selectedImage = null;

		try {
			const response = await fetchWithAuth('/character/generate-animal', {
				method: 'POST',
				body: JSON.stringify({
					name: characterName,
					description: characterDescription,
				}),
			});

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			if (!result.data?.images || !Array.isArray(result.data.images)) {
				throw new Error('Keine Bilder vom Server erhalten');
			}

			characterId = result.data.characterId;
			generatedImages = result.data.images.filter(
				(img: GeneratedImage) => img && typeof img.imageUrl === 'string'
			);
		} catch (err) {
			console.error('[CreateCharacter] Failed to generate:', err);
			error = err instanceof Error ? err.message : 'Charakter konnte nicht generiert werden';
		} finally {
			generating = false;
		}
	}

	// Generate character images from photo
	async function handleGenerateFromPhoto() {
		if (!characterName.trim() || !uploadedFile) {
			error = 'Bitte gib einen Namen ein und lade ein Foto hoch.';
			return;
		}

		generating = true;
		error = null;
		generatedImages = [];
		selectedImage = null;

		try {
			const formData = new FormData();
			formData.append('name', characterName);
			formData.append('image', uploadedFile);

			const response = await fetchWithAuth('/character/generate-animal-from-image', {
				method: 'POST',
				body: formData,
			});

			const result = await response.json();

			if (result.error) {
				throw new Error(result.error);
			}

			if (!result.data?.images || !Array.isArray(result.data.images)) {
				throw new Error('Keine Bilder vom Server erhalten');
			}

			characterId = result.data.characterId;
			generatedImages = result.data.images.filter(
				(img: GeneratedImage) => img && typeof img.imageUrl === 'string'
			);
		} catch (err) {
			console.error('[CreateCharacter] Failed to generate from photo:', err);
			error = err instanceof Error ? err.message : 'Charakter konnte nicht generiert werden';
		} finally {
			generating = false;
		}
	}

	// Save the character with selected image
	async function handleSaveCharacter() {
		if (!characterId || !selectedImage) {
			error = 'Bitte wähle ein Bild aus.';
			return;
		}

		saving = true;
		error = null;

		try {
			await dataService.updateCharacter(characterId, {
				characterDescriptionPrompt: selectedImage.description,
				imageUrl: selectedImage.imageUrl,
			} as any);

			goto(`/characters/${characterId}`);
		} catch (err) {
			console.error('[CreateCharacter] Failed to save:', err);
			error = err instanceof Error ? err.message : 'Charakter konnte nicht gespeichert werden';
			saving = false;
		}
	}

	// Select an image
	function selectImage(image: GeneratedImage) {
		selectedImage = image;
	}

	// Clear uploaded photo
	function clearPhoto() {
		uploadedFile = null;
		if (uploadedPreview) {
			URL.revokeObjectURL(uploadedPreview);
			uploadedPreview = null;
		}
	}
</script>

<svelte:head>
	<title>Neuer Charakter | Märchenzauber</title>
</svelte:head>

<!-- Generating Overlay -->
{#if generating}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur">
		<div class="flex flex-col items-center gap-6 p-8 text-center">
			<div class="relative">
				<div class="h-24 w-24 animate-spin rounded-full border-4 border-pink-500/30 border-t-pink-500"></div>
				<div class="absolute inset-0 flex items-center justify-center">
					<svg class="h-10 w-10 animate-pulse text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
				</div>
			</div>
			<div>
				<h2 class="mb-2 text-xl font-bold text-white">
					{mode === 'photo' ? 'Kuscheltier wird analysiert...' : 'Charakter wird generiert...'}
				</h2>
				<p class="text-white/70">Die Magie arbeitet! Dies kann bis zu einer Minute dauern.</p>
			</div>
		</div>
	</div>
{/if}

<div class="mx-auto max-w-2xl space-y-8">
	<!-- Header -->
	<div class="text-center">
		<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200 sm:text-3xl">
			Neuer Charakter
		</h1>
		<p class="mt-2 text-gray-500 dark:text-gray-400">
			Erstelle einen einzigartigen Charakter für deine Geschichten
		</p>
	</div>

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

	{#if generatedImages.length === 0}
		<!-- Step 1: Name -->
		<section class="space-y-4">
			<h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
				1. Name deines Charakters
			</h2>
			<input
				type="text"
				bind:value={characterName}
				placeholder="z.B. Luna die Mondprinzessin, Max der mutige Ritter..."
				class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
			/>
		</section>

		<!-- Step 2: Mode Selection -->
		<section class="space-y-4">
			<h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
				2. Wie möchtest du deinen Charakter erstellen?
			</h2>

			<!-- Mode Tabs -->
			<div class="flex gap-2">
				<button
					onclick={() => (mode = 'photo')}
					class="flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all"
					class:bg-pink-500={mode === 'photo'}
					class:text-white={mode === 'photo'}
					class:bg-gray-100={mode !== 'photo'}
					class:text-gray-600={mode !== 'photo'}
					class:dark:bg-gray-700={mode !== 'photo'}
					class:dark:text-gray-300={mode !== 'photo'}
				>
					<div class="flex items-center justify-center gap-2">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						Foto hochladen
					</div>
				</button>
				<button
					onclick={() => (mode = 'description')}
					class="flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-all"
					class:bg-pink-500={mode === 'description'}
					class:text-white={mode === 'description'}
					class:bg-gray-100={mode !== 'description'}
					class:text-gray-600={mode !== 'description'}
					class:dark:bg-gray-700={mode !== 'description'}
					class:dark:text-gray-300={mode !== 'description'}
				>
					<div class="flex items-center justify-center gap-2">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
						Beschreibung
					</div>
				</button>
			</div>

			<!-- Photo Upload Mode -->
			{#if mode === 'photo'}
				<div class="space-y-4">
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Lade ein Foto von einem Kuscheltier hoch, um daraus einen einzigartigen Charakter zu erstellen.
					</p>

					{#if uploadedPreview}
						<!-- Photo Preview -->
						<div class="relative mx-auto w-fit">
							<div class="h-48 w-48 overflow-hidden rounded-2xl border-4 border-amber-400 shadow-lg">
								<img
									src={uploadedPreview}
									alt="Hochgeladenes Foto"
									class="h-full w-full object-cover"
								/>
							</div>
							<button
								onclick={clearPhoto}
								class="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					{:else}
						<!-- Upload Area -->
						<label class="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/50 p-8 transition-colors hover:bg-amber-50 dark:bg-amber-900/10 dark:hover:bg-amber-900/20">
							<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
								<svg class="h-8 w-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
							</div>
							<span class="font-medium text-amber-600 dark:text-amber-400">Foto hochladen</span>
							<span class="mt-1 text-sm text-gray-500">Klicken oder Bild hierher ziehen</span>
							<input
								type="file"
								accept="image/*"
								onchange={handleFileSelect}
								class="hidden"
							/>
						</label>
					{/if}

					<button
						onclick={handleGenerateFromPhoto}
						disabled={generating || !characterName.trim() || !uploadedFile}
						class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 font-semibold text-white shadow-md transition-all hover:from-amber-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
						</svg>
						Charakter erstellen
					</button>
				</div>
			{/if}

			<!-- Description Mode -->
			{#if mode === 'description'}
				<div class="space-y-4">
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Beschreibe deinen Charakter mit eigenen Worten. Die KI generiert daraus ein einzigartiges Bild.
					</p>

					<textarea
						bind:value={characterDescription}
						placeholder="z.B. Ein kleiner Drache mit glitzernden blauen Schuppen, der gerne Abenteuer erlebt und immer fröhlich ist. Er trägt einen goldenen Schal und kann kleine Funken spucken..."
						rows={5}
						class="w-full resize-none rounded-xl border border-gray-200 bg-white p-4 text-gray-800 placeholder:text-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
					></textarea>

					<button
						onclick={handleGenerateFromDescription}
						disabled={generating || !characterName.trim() || !characterDescription.trim()}
						class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:from-pink-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
						</svg>
						Charakter erstellen
					</button>
				</div>
			{/if}
		</section>
	{:else}
		<!-- Step 3: Select Generated Image -->
		<section class="space-y-6">
			<div class="text-center">
				<h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
					Wähle ein Profilbild für {characterName}
				</h2>
				<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
					Klicke auf das Bild, das dir am besten gefällt
				</p>
			</div>

			<!-- Generated Images Grid -->
			<div class="flex flex-wrap justify-center gap-4">
				{#each generatedImages as image (image.imageUrl)}
					<button
						onclick={() => selectImage(image)}
						class="relative overflow-hidden rounded-full transition-all"
						class:ring-4={selectedImage?.imageUrl === image.imageUrl}
						class:ring-pink-500={selectedImage?.imageUrl === image.imageUrl}
						class:scale-105={selectedImage?.imageUrl === image.imageUrl}
					>
						<div class="h-32 w-32 overflow-hidden rounded-full border-3 border-white shadow-lg dark:border-gray-700 sm:h-40 sm:w-40">
							<img
								src={image.imageUrl}
								alt="Generiertes Charakterbild"
								class="h-full w-full object-cover"
							/>
						</div>
						{#if selectedImage?.imageUrl === image.imageUrl}
							<div class="absolute inset-0 flex items-center justify-center rounded-full bg-pink-500/20">
								<div class="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 text-white">
									<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
								</div>
							</div>
						{/if}
					</button>
				{/each}
			</div>

			<!-- Regenerate Button -->
			<div class="flex justify-center">
				<button
					onclick={mode === 'photo' ? handleGenerateFromPhoto : handleGenerateFromDescription}
					disabled={generating}
					class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					Neu generieren
				</button>
			</div>

			<!-- Save Button -->
			<button
				onclick={handleSaveCharacter}
				disabled={saving || !selectedImage}
				class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-pink-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if saving}
					<div class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
					Speichern...
				{:else}
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
					</svg>
					Charakter erstellen
				{/if}
			</button>
		</section>
	{/if}

	<!-- Credit Info -->
	<p class="text-center text-sm text-gray-500 dark:text-gray-400">
		Das Erstellen eines Charakters kostet 10 Mana.
	</p>
</div>
