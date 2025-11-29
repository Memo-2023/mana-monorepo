<script lang="ts">
	import { validateImage } from '$lib/api/upload';
	import type { UploadProgress } from '$lib/api/upload';
	import { CloudArrowUp, X } from '@manacore/shared-icons';

	interface Props {
		onFilesSelected: (files: File[]) => void;
		uploading?: boolean;
		uploadProgress?: UploadProgress[];
	}

	let { onFilesSelected, uploading = false, uploadProgress = [] }: Props = $props();

	let isDragging = $state(false);
	let fileInput: HTMLInputElement | null = $state(null);
	let selectedFiles = $state<File[]>([]);
	let previews = $state<{ file: File; url: string; error?: string }[]>([]);

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		const files = Array.from(e.dataTransfer?.files || []);
		handleFiles(files);
	}

	function handleFileInputChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const files = Array.from(input.files || []);
		handleFiles(files);
	}

	function handleFiles(files: File[]) {
		// Filter only image files
		const imageFiles = files.filter((file) => file.type.startsWith('image/'));

		// Validate each file
		const validatedFiles = imageFiles.map((file) => {
			const validation = validateImage(file);
			const url = URL.createObjectURL(file);

			return {
				file,
				url,
				error: validation.valid ? undefined : validation.error,
			};
		});

		previews = validatedFiles;
		selectedFiles = validatedFiles.filter((f) => !f.error).map((f) => f.file);
	}

	function removeFile(index: number) {
		URL.revokeObjectURL(previews[index].url);
		previews = previews.filter((_, i) => i !== index);
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
	}

	function handleUpload() {
		if (selectedFiles.length > 0) {
			onFilesSelected(selectedFiles);
		}
	}

	function clearAll() {
		previews.forEach((p) => URL.revokeObjectURL(p.url));
		previews = [];
		selectedFiles = [];
		if (fileInput) fileInput.value = '';
	}

	function getProgressForFile(filename: string): UploadProgress | undefined {
		return uploadProgress.find((p) => p.filename === filename);
	}

	// Cleanup on unmount
	$effect(() => {
		return () => {
			previews.forEach((p) => URL.revokeObjectURL(p.url));
		};
	});
</script>

<div class="space-y-6">
	<!-- Drop Zone -->
	{#if !uploading && previews.length === 0}
		<div
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			onclick={() => fileInput?.click()}
			class="flex min-h-[400px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all {isDragging
				? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
				: 'border-gray-300 bg-gray-50/50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600'}"
			role="button"
			tabindex="0"
		>
			<CloudArrowUp
				size={64}
				weight="regular"
				class="mb-4 {isDragging ? 'text-blue-500' : 'text-gray-400 dark:text-gray-600'}"
			/>

			<h3 class="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
				{isDragging ? 'Loslassen zum Hochladen' : 'Bilder hochladen'}
			</h3>
			<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
				Ziehe deine Bilder hierher oder klicke zum Auswählen
			</p>
			<p class="text-xs text-gray-500 dark:text-gray-500">
				JPG, PNG oder WebP • Max. 10MB pro Bild
			</p>

			<input
				bind:this={fileInput}
				type="file"
				accept="image/jpeg,image/jpg,image/png,image/webp"
				multiple
				onchange={handleFileInputChange}
				class="hidden"
			/>
		</div>
	{/if}

	<!-- Preview Grid -->
	{#if previews.length > 0}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
					{previews.length}
					{previews.length === 1 ? 'Bild' : 'Bilder'} ausgewählt
				</h3>
				{#if !uploading}
					<button
						onclick={clearAll}
						class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
					>
						Alle entfernen
					</button>
				{/if}
			</div>

			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each previews as preview, index (preview.file.name)}
					{@const progress = getProgressForFile(preview.file.name)}
					<div
						class="group relative overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
					>
						<!-- Image Preview -->
						<div class="aspect-square w-full">
							<img src={preview.url} alt={preview.file.name} class="h-full w-full object-cover" />
						</div>

						<!-- Overlay -->
						<div
							class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
						>
							<!-- Remove Button (only when not uploading) -->
							{#if !uploading}
								<button
									onclick={() => removeFile(index)}
									class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-900 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
								>
									<X size={16} weight="bold" />
								</button>
							{/if}

							<!-- File Info -->
							<div class="absolute bottom-0 left-0 right-0 p-3">
								<p class="truncate text-sm font-medium text-white">
									{preview.file.name}
								</p>
								<p class="text-xs text-white/80">
									{(preview.file.size / 1024 / 1024).toFixed(2)} MB
								</p>

								<!-- Error -->
								{#if preview.error}
									<div class="mt-2 rounded bg-red-500/90 px-2 py-1 text-xs text-white">
										{preview.error}
									</div>
								{/if}

								<!-- Progress -->
								{#if progress}
									<div class="mt-2 space-y-1">
										<div class="flex items-center justify-between text-xs text-white">
											<span>
												{#if progress.status === 'uploading'}
													Hochladen...
												{:else if progress.status === 'success'}
													✓ Fertig
												{:else if progress.status === 'error'}
													✗ Fehler
												{:else}
													Warten...
												{/if}
											</span>
											{#if progress.status === 'uploading' || progress.status === 'success'}
												<span>{Math.round(progress.progress)}%</span>
											{/if}
										</div>

										{#if progress.status === 'uploading' || progress.status === 'success'}
											<div class="h-1 w-full overflow-hidden rounded-full bg-white/20">
												<div
													class="h-full bg-white transition-all duration-300 {progress.status ===
													'success'
														? 'bg-green-500'
														: ''}"
													style="width: {progress.progress}%"
												></div>
											</div>
										{/if}

										{#if progress.error}
											<p class="text-xs text-red-300">{progress.error}</p>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Upload Button -->
			{#if !uploading && selectedFiles.length > 0}
				<div class="flex justify-center pt-4">
					<button
						onclick={handleUpload}
						class="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-all hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
					>
						<CloudArrowUp size={20} weight="bold" />
						{selectedFiles.length}
						{selectedFiles.length === 1 ? 'Bild' : 'Bilder'} hochladen
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
