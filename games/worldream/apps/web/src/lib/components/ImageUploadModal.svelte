<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { loadingStore } from '$lib/stores/loadingStore';

	interface Props {
		show: boolean;
		nodeSlug: string;
		onClose: () => void;
		onUploadComplete: () => void;
	}

	let { show, nodeSlug, onClose, onUploadComplete }: Props = $props();

	let dragActive = $state(false);
	let selectedFiles = $state<File[]>([]);
	let uploadProgress = $state<number>(0);
	let uploading = $state(false);
	let fileInput: HTMLInputElement;
	let previews = $state<{ file: File; url: string }[]>([]);

	// Max file size: 10MB
	const MAX_FILE_SIZE = 10 * 1024 * 1024;
	const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();

		// Only set dragActive to false if we're leaving the drop zone entirely
		const target = e.target as HTMLElement;
		const relatedTarget = e.relatedTarget as HTMLElement;
		if (!target.closest('.drop-zone') || !relatedTarget?.closest('.drop-zone')) {
			dragActive = false;
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragActive = false;

		const files = Array.from(e.dataTransfer?.files || []);
		processFiles(files);
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const files = Array.from(target.files || []);
		processFiles(files);
	}

	function processFiles(files: File[]) {
		const validFiles = files.filter((file) => {
			if (!ALLOWED_TYPES.includes(file.type)) {
				alert(`${file.name} ist kein unterstütztes Bildformat`);
				return false;
			}
			if (file.size > MAX_FILE_SIZE) {
				alert(`${file.name} ist zu groß (max. 10MB)`);
				return false;
			}
			return true;
		});

		selectedFiles = [...selectedFiles, ...validFiles];

		// Create preview URLs
		validFiles.forEach((file) => {
			const url = URL.createObjectURL(file);
			previews = [...previews, { file, url }];
		});
	}

	function removeFile(index: number) {
		// Revoke the URL to free memory
		URL.revokeObjectURL(previews[index].url);

		selectedFiles = selectedFiles.filter((_, i) => i !== index);
		previews = previews.filter((_, i) => i !== index);
	}

	async function uploadFiles() {
		if (selectedFiles.length === 0) return;

		uploading = true;
		// Create upload steps based on number of files
		const steps = selectedFiles.map(
			(file, i) => `Lade Bild ${i + 1}/${selectedFiles.length}: ${file.name}`
		);
		loadingStore.start('Bilder werden hochgeladen', steps);
		uploadProgress = 0;

		try {
			for (let i = 0; i < selectedFiles.length; i++) {
				const file = selectedFiles[i];
				const formData = new FormData();
				formData.append('image', file);

				// Set first image as primary if no images exist yet
				formData.append('is_primary', i === 0 ? 'true' : 'false');

				const response = await fetch(`/api/nodes/${nodeSlug}/images/upload`, {
					method: 'POST',
					body: formData,
				});

				if (!response.ok) {
					const error = await response.text();
					throw new Error(`Upload fehlgeschlagen: ${error}`);
				}

				uploadProgress = ((i + 1) / selectedFiles.length) * 100;
				loadingStore.nextStep(`Bild ${i + 1} erfolgreich hochgeladen`);
			}

			// Clean up preview URLs
			previews.forEach((preview) => URL.revokeObjectURL(preview.url));

			// Reset state
			selectedFiles = [];
			previews = [];
			uploadProgress = 0;

			// Mark loading as complete
			loadingStore.complete('Alle Bilder erfolgreich hochgeladen');

			// Notify parent
			onUploadComplete();
			onClose();
		} catch (error) {
			console.error('Upload error:', error);
			loadingStore.setError(error instanceof Error ? error.message : 'Upload fehlgeschlagen');
			alert(error instanceof Error ? error.message : 'Upload fehlgeschlagen');
			// Reset loading after error
			setTimeout(() => loadingStore.reset(), 2000);
		} finally {
			uploading = false;
		}
	}

	function openFileDialog() {
		fileInput?.click();
	}

	// Clean up URLs when component is destroyed
	$effect(() => {
		return () => {
			previews.forEach((preview) => URL.revokeObjectURL(preview.url));
		};
	});
</script>

{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		transition:fade={{ duration: 200 }}
		onclick={onClose}
		onkeydown={(e) => e.key === 'Enter' && onClose()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div
			class="relative w-full max-w-3xl rounded-lg bg-theme-surface p-6 shadow-xl"
			transition:scale={{ duration: 200, start: 0.95 }}
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Header -->
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-2xl font-bold text-theme-text-primary">Bilder hochladen</h2>
				<button
					onclick={onClose}
					class="rounded-lg p-2 text-theme-text-secondary hover:bg-theme-interactive-hover hover:text-theme-text-primary"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Drop Zone -->
			<div
				class="drop-zone mb-6 rounded-lg border-2 border-dashed p-8 text-center transition-colors
					{dragActive
					? 'border-theme-primary-600 bg-theme-primary-100/10'
					: 'border-theme-border-subtle hover:border-theme-border-default'}"
				ondragenter={handleDragEnter}
				ondragleave={handleDragLeave}
				ondragover={handleDragOver}
				ondrop={handleDrop}
				role="region"
				aria-label="Datei-Upload-Bereich"
			>
				<svg
					class="mx-auto mb-4 h-12 w-12 text-theme-text-secondary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
					/>
				</svg>
				<p class="mb-2 text-lg text-theme-text-primary">
					Bilder hier ablegen oder
					<button onclick={openFileDialog} class="text-theme-primary-600 hover:underline">
						durchsuchen
					</button>
				</p>
				<p class="text-sm text-theme-text-secondary">
					JPG, PNG, WebP oder GIF • Max. 10MB pro Bild
				</p>
				<input
					bind:this={fileInput}
					type="file"
					accept="image/*"
					multiple
					onchange={handleFileSelect}
					class="hidden"
				/>
			</div>

			<!-- Preview Grid -->
			{#if previews.length > 0}
				<div class="mb-6">
					<h3 class="mb-3 text-sm font-medium text-theme-text-primary">
						Ausgewählte Bilder ({previews.length})
					</h3>
					<div class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
						{#each previews as preview, index}
							<div class="group relative">
								<img
									src={preview.url}
									alt="Vorschau"
									class="aspect-square w-full rounded-lg object-cover"
								/>
								<button
									onclick={() => removeFile(index)}
									class="absolute right-1 top-1 rounded-full bg-red-600 p-1 opacity-0 transition-opacity group-hover:opacity-100"
									title="Entfernen"
								>
									<svg
										class="h-4 w-4 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
								{#if index === 0}
									<span
										class="absolute bottom-1 left-1 rounded bg-yellow-500 px-1.5 py-0.5 text-xs font-semibold text-white"
									>
										Hauptbild
									</span>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Upload Progress -->
			{#if uploading}
				<div class="mb-6">
					<div class="mb-1 flex justify-between text-sm">
						<span class="text-theme-text-secondary">Hochladen...</span>
						<span class="text-theme-text-primary">{Math.round(uploadProgress)}%</span>
					</div>
					<div class="h-2 overflow-hidden rounded-full bg-theme-elevated">
						<div
							class="h-full bg-theme-primary-600 transition-all duration-300"
							style="width: {uploadProgress}%"
						/>
					</div>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex justify-end gap-3">
				<button
					onclick={onClose}
					disabled={uploading}
					class="rounded-lg px-4 py-2 text-theme-text-secondary hover:bg-theme-interactive-hover hover:text-theme-text-primary disabled:opacity-50"
				>
					Abbrechen
				</button>
				<button
					onclick={uploadFiles}
					disabled={selectedFiles.length === 0 || uploading}
					class="rounded-lg bg-theme-primary-600 px-4 py-2 text-white hover:bg-theme-primary-700 disabled:opacity-50"
				>
					{uploading
						? 'Wird hochgeladen...'
						: `${selectedFiles.length} Bild${selectedFiles.length !== 1 ? 'er' : ''} hochladen`}
				</button>
			</div>
		</div>
	</div>
{/if}
