<script lang="ts">
	import { libraryStore } from '$lib/stores/library.svelte';
	import { MukkeEvents } from '@manacore/shared-utils/analytics';
	import { Check, DownloadSimple, Plus, X } from '@manacore/shared-icons';

	interface UploadFile {
		file: File;
		id: string;
		status: 'pending' | 'uploading' | 'uploaded' | 'error';
		progress: number;
		error?: string;
		songId?: string;
		metadata: {
			title: string;
			artist: string;
			album: string;
			genre: string;
			year: string;
			month: string;
			day: string;
		};
	}

	let files = $state<UploadFile[]>([]);
	let isDragOver = $state(false);
	let savingMetadata = $state<Set<string>>(new Set());

	function generateId(): string {
		return Math.random().toString(36).substring(2, 10);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
		const droppedFiles = e.dataTransfer?.files;
		if (droppedFiles) {
			addFiles(droppedFiles);
		}
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			addFiles(input.files);
		}
		input.value = '';
	}

	function addFiles(fileList: FileList) {
		const audioFiles = Array.from(fileList).filter((f) => f.type.startsWith('audio/'));
		const newFiles: UploadFile[] = audioFiles.map((file) => ({
			file,
			id: generateId(),
			status: 'pending',
			progress: 0,
			metadata: {
				title: file.name.replace(/\.[^.]+$/, ''),
				artist: '',
				album: '',
				genre: '',
				year: '',
				month: '',
				day: '',
			},
		}));
		files = [...files, ...newFiles];

		for (const uf of newFiles) {
			uploadFile(uf);
		}
	}

	async function uploadFile(uf: UploadFile) {
		const index = files.findIndex((f) => f.id === uf.id);
		if (index === -1) return;

		files[index].status = 'uploading';
		files[index].progress = 30;

		try {
			const song = await libraryStore.uploadSong(uf.file);
			files[index].status = 'uploaded';
			files[index].progress = 100;
			files[index].songId = song.id;
			MukkeEvents.songUploaded();

			// Auto-extract ID3 tags from the uploaded file
			try {
				const extracted = await libraryStore.extractMetadata(song.id);
				if (extracted.title) files[index].metadata.title = extracted.title;
				if (extracted.artist) files[index].metadata.artist = extracted.artist;
				if (extracted.album) files[index].metadata.album = extracted.album ?? '';
				if (extracted.genre) files[index].metadata.genre = extracted.genre ?? '';
				if (extracted.year) files[index].metadata.year = String(extracted.year);
				if (extracted.month) files[index].metadata.month = String(extracted.month);
				if (extracted.day) files[index].metadata.day = String(extracted.day);
			} catch {
				// Non-fatal: user can still edit metadata manually
			}
		} catch (e) {
			files[index].status = 'error';
			files[index].error = e instanceof Error ? e.message : 'Upload failed';
			MukkeEvents.songUploadFailed();
		}
	}

	async function saveMetadata(uf: UploadFile) {
		if (!uf.songId) return;

		savingMetadata = new Set([...savingMetadata, uf.id]);
		try {
			const data: Record<string, unknown> = {
				title: uf.metadata.title,
				artist: uf.metadata.artist || undefined,
				album: uf.metadata.album || undefined,
				genre: uf.metadata.genre || undefined,
				year: uf.metadata.year ? parseInt(uf.metadata.year) : undefined,
				month: uf.metadata.month ? parseInt(uf.metadata.month) : undefined,
				day: uf.metadata.day ? parseInt(uf.metadata.day) : undefined,
			};
			await libraryStore.updateSongMetadata(uf.songId, data);
		} catch (e) {
			console.error('Failed to save metadata:', e);
		} finally {
			const next = new Set(savingMetadata);
			next.delete(uf.id);
			savingMetadata = next;
		}
	}

	function removeFile(id: string) {
		files = files.filter((f) => f.id !== id);
	}
</script>

<svelte:head>
	<title>Upload - Mukke</title>
</svelte:head>

<div class="p-6 max-w-4xl mx-auto">
	<h1 class="text-2xl font-bold mb-6">Upload Songs</h1>

	<!-- Drop Zone -->
	<div
		class="border-2 border-dashed rounded-lg p-12 text-center transition-colors {isDragOver
			? 'border-primary bg-primary/5'
			: 'border-border hover:border-foreground-secondary'}"
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		role="region"
	>
		<DownloadSimple size={48} class="mx-auto mb-4 text-foreground-secondary" />
		<p class="text-foreground-secondary mb-2">Drag and drop audio files here</p>
		<p class="text-sm text-foreground-secondary mb-4">or</p>
		<label
			class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium cursor-pointer"
		>
			<Plus size={20} />
			Browse Files
			<input type="file" accept="audio/*" multiple class="hidden" onchange={handleFileInput} />
		</label>
	</div>

	<!-- File List -->
	{#if files.length > 0}
		<div class="mt-8 space-y-4">
			{#each files as uf (uf.id)}
				<div class="bg-surface rounded-lg p-4 border border-border">
					<!-- File header -->
					<div class="flex items-center justify-between mb-3">
						<div class="flex items-center gap-3 min-w-0">
							{#if uf.status === 'uploading'}
								<div
									class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0"
								></div>
							{:else if uf.status === 'uploaded'}
								<Check size={20} class="text-green-500" />
							{:else if uf.status === 'error'}
								<svg
									class="w-5 h-5 text-red-500 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							{:else}
								<div class="w-5 h-5 rounded-full bg-foreground-secondary/20 flex-shrink-0"></div>
							{/if}
							<span class="font-medium truncate">{uf.file.name}</span>
						</div>
						<button
							onclick={() => removeFile(uf.id)}
							class="p-1 text-foreground-secondary hover:text-foreground flex-shrink-0"
						>
							<X size={16} />
						</button>
					</div>

					<!-- Progress bar -->
					{#if uf.status === 'uploading'}
						<div class="w-full bg-background rounded-full h-1.5 mb-3">
							<div
								class="bg-primary h-1.5 rounded-full transition-all duration-300"
								style="width: {uf.progress}%"
							></div>
						</div>
					{/if}

					<!-- Error message -->
					{#if uf.status === 'error'}
						<p class="text-sm text-red-500 mb-2">{uf.error}</p>
					{/if}

					<!-- Metadata form (after upload) -->
					{#if uf.status === 'uploaded'}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-border">
							<div>
								<label
									for="title-{uf.id}"
									class="block text-xs font-medium text-foreground-secondary mb-1">Title</label
								>
								<input
									id="title-{uf.id}"
									type="text"
									bind:value={uf.metadata.title}
									class="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
								/>
							</div>
							<div>
								<label
									for="artist-{uf.id}"
									class="block text-xs font-medium text-foreground-secondary mb-1">Artist</label
								>
								<input
									id="artist-{uf.id}"
									type="text"
									bind:value={uf.metadata.artist}
									class="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
									placeholder="Artist name"
								/>
							</div>
							<div>
								<label
									for="album-{uf.id}"
									class="block text-xs font-medium text-foreground-secondary mb-1">Album</label
								>
								<input
									id="album-{uf.id}"
									type="text"
									bind:value={uf.metadata.album}
									class="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
									placeholder="Album name"
								/>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div>
									<label
										for="genre-{uf.id}"
										class="block text-xs font-medium text-foreground-secondary mb-1">Genre</label
									>
									<input
										id="genre-{uf.id}"
										type="text"
										bind:value={uf.metadata.genre}
										class="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
										placeholder="Genre"
									/>
								</div>
								<div>
									<label
										for="year-{uf.id}"
										class="block text-xs font-medium text-foreground-secondary mb-1">Date</label
									>
									<div class="grid grid-cols-3 gap-1">
										<input
											id="year-{uf.id}"
											type="text"
											bind:value={uf.metadata.year}
											class="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
											placeholder="Year"
										/>
										<input
											type="text"
											bind:value={uf.metadata.month}
											class="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
											placeholder="Mo"
										/>
										<input
											type="text"
											bind:value={uf.metadata.day}
											class="w-full px-2 py-1.5 text-sm bg-background border border-border rounded-lg focus:border-primary focus:outline-none"
											placeholder="Day"
										/>
									</div>
								</div>
							</div>
						</div>
						<div class="flex justify-end mt-3">
							<button
								onclick={() => saveMetadata(uf)}
								disabled={savingMetadata.has(uf.id)}
								class="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
							>
								{savingMetadata.has(uf.id) ? 'Saving...' : 'Save Metadata'}
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
