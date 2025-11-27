<script lang="ts">
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/auth';
	import { uploadMealPhoto, resizeImage } from '$lib/services/uploadService';
	import type { MealType } from '$lib/types/meal';

	let isDragging = $state(false);
	let selectedFile = $state<File | null>(null);
	let previewUrl = $state<string | null>(null);
	let mealType = $state<MealType>('lunch');
	let isUploading = $state(false);
	let uploadProgress = $state(0);
	let uploadMessage = $state('');
	let error = $state('');

	const mealTypes: { value: MealType; label: string }[] = [
		{ value: 'breakfast', label: 'Frühstück' },
		{ value: 'lunch', label: 'Mittagessen' },
		{ value: 'dinner', label: 'Abendessen' },
		{ value: 'snack', label: 'Snack' },
	];

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			handleFile(input.files[0]);
		}
	}

	function handleFile(file: File) {
		if (!file.type.startsWith('image/')) {
			error = 'Bitte wähle ein Bild aus';
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			error = 'Das Bild darf maximal 10MB groß sein';
			return;
		}

		error = '';
		selectedFile = file;
		previewUrl = URL.createObjectURL(file);
	}

	function clearSelection() {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
		selectedFile = null;
		previewUrl = null;
		error = '';
		uploadProgress = 0;
		uploadMessage = '';
	}

	async function handleUpload() {
		if (!selectedFile || !$user?.id) return;

		isUploading = true;
		uploadProgress = 0;
		uploadMessage = '';
		error = '';

		try {
			// Resize large images
			let fileToUpload = selectedFile;
			if (selectedFile.size > 2 * 1024 * 1024) {
				uploadMessage = 'Bild wird optimiert...';
				fileToUpload = await resizeImage(selectedFile);
			}

			// Upload with progress tracking
			const result = await uploadMealPhoto(fileToUpload, $user.id, mealType, (progress) => {
				uploadProgress = progress.progress;
				uploadMessage = progress.message || '';
			});

			if (result.success) {
				// Navigate to meals after successful upload
				setTimeout(() => {
					goto('/meals');
				}, 500);
			} else {
				error = result.error || 'Upload fehlgeschlagen';
				isUploading = false;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
			isUploading = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<!-- Header -->
	<div class="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
		<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mahlzeit hochladen</h1>
		<p class="text-gray-600 dark:text-gray-400">
			Lade ein Foto deiner Mahlzeit hoch und erhalte automatisch eine Nährwertanalyse
		</p>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-auto p-6">
		<div class="mx-auto max-w-2xl">
			{#if error}
				<div
					class="mb-4 rounded-lg bg-red-100 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-400"
				>
					{error}
				</div>
			{/if}

			{#if !selectedFile}
				<!-- Drop Zone -->
				<div
					class="rounded-2xl border-2 border-dashed p-12 text-center transition-colors {isDragging
						? 'border-green-500 bg-green-50 dark:bg-green-900/20'
						: 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'}"
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
					role="button"
					tabindex="0"
				>
					<div class="mb-4 text-6xl">📸</div>
					<p class="mb-2 text-lg font-medium text-gray-900 dark:text-white">Foto hierher ziehen</p>
					<p class="mb-4 text-gray-600 dark:text-gray-400">oder klicken zum Auswählen</p>
					<label
						class="inline-block cursor-pointer rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700"
					>
						Foto auswählen
						<input type="file" accept="image/*" class="hidden" onchange={handleFileInput} />
					</label>
					<p class="mt-4 text-sm text-gray-500">Unterstützte Formate: JPG, PNG, HEIC (max. 10MB)</p>
				</div>
			{:else}
				<!-- Preview -->
				<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
					<div class="relative mb-6 overflow-hidden rounded-xl">
						<img src={previewUrl} alt="Preview" class="h-64 w-full object-cover" />
						<button
							onclick={clearSelection}
							class="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
						>
							✕
						</button>
					</div>

					<!-- Meal Type Selection -->
					<div class="mb-6">
						<label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
							Art der Mahlzeit
						</label>
						<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
							{#each mealTypes as type}
								<button
									onclick={() => (mealType = type.value)}
									class="rounded-xl px-4 py-3 text-sm font-medium transition-colors {mealType ===
									type.value
										? 'bg-green-500 text-white'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
								>
									{type.label}
								</button>
							{/each}
						</div>
					</div>

					<!-- Upload Progress -->
					{#if isUploading}
						<div class="mb-6">
							<div class="mb-2 flex justify-between text-sm">
								<span class="text-gray-600 dark:text-gray-400">
									{uploadMessage || 'Wird hochgeladen...'}
								</span>
								<span class="font-medium text-green-600">{uploadProgress}%</span>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
								<div
									class="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-300"
									style="width: {uploadProgress}%"
								></div>
							</div>
						</div>
					{/if}

					<!-- Actions -->
					<div class="flex gap-4">
						<button
							onclick={clearSelection}
							disabled={isUploading}
							class="flex-1 rounded-xl border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							Abbrechen
						</button>
						<button
							onclick={handleUpload}
							disabled={isUploading}
							class="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isUploading ? 'Wird hochgeladen...' : 'Analysieren'}
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
