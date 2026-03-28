<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { uploadMultipleImages } from '$lib/api/upload';
	import type { UploadProgress } from '$lib/api/upload';
	import { toastStore } from '@manacore/shared-ui';
	import { PageHeader } from '@manacore/shared-ui';
	import DropZone from '$lib/components/upload/DropZone.svelte';
	import { Check, Image, CloudArrowUp, CheckCircle } from '@manacore/shared-icons';

	let uploading = $state(false);
	let uploadProgress = $state<UploadProgress[]>([]);
	let successCount = $state(0);

	async function handleFilesSelected(files: File[]) {
		if (!authStore.user) {
			toastStore.show('Bitte melde dich an', 'error');
			return;
		}

		uploading = true;
		successCount = 0;

		try {
			const uploadedImages = await uploadMultipleImages(files, (progress) => {
				uploadProgress = progress;
			});

			successCount = uploadedImages.length;

			// Images will appear in gallery automatically via live query

			if (successCount === files.length) {
				toastStore.show(
					`${successCount} ${successCount === 1 ? 'Bild' : 'Bilder'} erfolgreich hochgeladen`,
					'success'
				);
			} else {
				toastStore.show(
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
			toastStore.show('Fehler beim Hochladen der Bilder', 'error');
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
		<PageHeader
			title="Bilder hochladen"
			description="Lade deine eigenen Bilder hoch und verwalte sie in deiner Galerie"
			size="lg"
		/>

		<!-- Upload Success Banner -->
		{#if successCount > 0 && !uploading}
			<div
				class="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20"
			>
				<Check size={24} class="flex-shrink-0 text-green-600 dark:text-green-400" />
				<div>
					<p class="font-medium text-green-900 dark:text-green-100">Upload erfolgreich!</p>
					<p class="text-sm text-green-700 dark:text-green-300">
						{successCount}
						{successCount === 1 ? 'Bild wurde' : 'Bilder wurden'} hochgeladen. Du wirst zur Galerie weitergeleitet...
					</p>
				</div>
			</div>
		{/if}

		<!-- Drop Zone -->
		<DropZone onFilesSelected={handleFilesSelected} {uploading} {uploadProgress} />

		<!-- Tips -->
		{#if !uploading && uploadProgress.length === 0}
			<div class="mt-8 grid gap-4 sm:grid-cols-3">
				<div
					class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
				>
					<div
						class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950"
					>
						<Image size={20} class="text-blue-600 dark:text-blue-400" />
					</div>
					<h3 class="mb-1 font-semibold text-gray-900 dark:text-white">Unterstützte Formate</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">
						JPG, PNG und WebP Bilder werden unterstützt
					</p>
				</div>

				<div
					class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
				>
					<div
						class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950"
					>
						<CloudArrowUp size={20} class="text-purple-600 dark:text-purple-400" />
					</div>
					<h3 class="mb-1 font-semibold text-gray-900 dark:text-white">Maximale Größe</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400">Bis zu 10MB pro Bild</p>
				</div>

				<div
					class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
				>
					<div
						class="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-950"
					>
						<CheckCircle size={20} class="text-green-600 dark:text-green-400" />
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
