<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { uploadMultipleImages, type UploadProgress } from '$lib/api/upload';
	import { showToast } from '$lib/stores/toast';
	import DropZone from '$lib/components/upload/DropZone.svelte';
	import { images } from '$lib/stores/images';

	let uploading = $state(false);
	let uploadProgress = $state<UploadProgress[]>([]);
	let successCount = $state(0);

	async function handleFilesSelected(files: File[]) {
		if (!$user) {
			showToast('Bitte melde dich an', 'error');
			return;
		}

		uploading = true;
		successCount = 0;

		try {
			const uploadedImages = await uploadMultipleImages(files, $user.id, (progress) => {
				uploadProgress = progress;
			});

			successCount = uploadedImages.length;

			// Add uploaded images to store
			images.update((current) => [...uploadedImages, ...current]);

			if (successCount === files.length) {
				showToast(
					`${successCount} ${successCount === 1 ? 'Bild' : 'Bilder'} erfolgreich hochgeladen`,
					'success'
				);
			} else {
				showToast(
					`${successCount} von ${files.length} Bildern erfolgreich hochgeladen`,
					'warning'
				);
			}

			// Redirect to gallery after successful upload
			setTimeout(() => {
				goto('/app/gallery');
			}, 2000);
		} catch (error) {
			console.error('Upload error:', error);
			showToast('Fehler beim Hochladen der Bilder', 'error');
		} finally {
			uploading = false;
		}
	}
</script>

<svelte:head>
	<title>Upload - Picture</title>
</svelte:head>

<div class="min-h-screen px-4 py-8">
	<div class="mx-auto max-w-5xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Bilder hochladen</h1>
			<p class="text-gray-600 dark:text-gray-400">
				Lade deine eigenen Bilder hoch und verwalte sie in deiner Galerie
			</p>
		</div>

		<!-- Upload Success Banner -->
		{#if successCount > 0 && !uploading}
			<div
				class="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20"
			>
				<svg class="h-6 w-6 flex-shrink-0 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<div>
					<p class="font-medium text-green-900 dark:text-green-100">
						Upload erfolgreich!
					</p>
					<p class="text-sm text-green-700 dark:text-green-300">
						{successCount} {successCount === 1 ? 'Bild wurde' : 'Bilder wurden'} hochgeladen.
						Du wirst zur Galerie weitergeleitet...
					</p>
				</div>
			</div>
		{/if}

		<!-- Drop Zone -->
		<DropZone onFilesSelected={handleFilesSelected} {uploading} {uploadProgress} />

		<!-- Tips -->
		{#if !uploading && uploadProgress.length === 0}
			<div class="mt-8 grid gap-4 sm:grid-cols-3">
				<div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
					<div class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
						<svg class="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<h3 class="mb-1 font-semibold text-gray-900 dark:text-white">Unterstützte Formate</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						JPG, PNG und WebP Bilder werden unterstützt
					</p>
				</div>

				<div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
					<div class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950">
						<svg class="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							/>
						</svg>
					</div>
					<h3 class="mb-1 font-semibold text-gray-900 dark:text-white">Maximale Größe</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Bis zu 10MB pro Bild
					</p>
				</div>

				<div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
					<div class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
						<svg class="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<h3 class="mb-1 font-semibold text-gray-900 dark:text-white">Batch Upload</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Lade mehrere Bilder gleichzeitig hoch
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>
