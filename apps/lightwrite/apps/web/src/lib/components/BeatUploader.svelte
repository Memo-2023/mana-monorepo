<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import { audioStore } from '$lib/stores/audio.svelte';
	import { detectBpmFromFile } from '$lib/utils/bpm-detector';
	import BeatLibrary from './BeatLibrary.svelte';

	interface Props {
		projectId: string;
		onUploadComplete?: () => void;
		onLyricsUpdate?: (lyrics: string) => void;
	}

	let { projectId, onUploadComplete, onLyricsUpdate }: Props = $props();

	type Tab = 'upload' | 'library';
	let activeTab = $state<Tab>('upload');

	let isUploading = $state(false);
	let isDetectingBpm = $state(false);
	let isTranscribing = $state(false);
	let uploadProgress = $state(0);
	let errorMessage = $state<string | null>(null);
	let transcriptionError = $state<string | null>(null);
	let currentBeatId = $state<string | null>(null);
	let fileInputRef: HTMLInputElement;

	const acceptedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav'];
	const acceptedExtensions = '.mp3,.wav,.ogg';

	async function startTranscription(beatId: string) {
		isTranscribing = true;
		transcriptionError = null;
		currentBeatId = beatId;

		try {
			const result = await projectStore.transcribeBeat(beatId);
			if (result.lyrics) {
				onLyricsUpdate?.(result.lyrics);
			}
		} catch (err) {
			transcriptionError = err instanceof Error ? err.message : 'Transcription failed';
		} finally {
			isTranscribing = false;
		}
	}

	async function retryTranscription() {
		if (currentBeatId) {
			await startTranscription(currentBeatId);
		}
	}

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// Validate file type
		if (!acceptedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg)$/i)) {
			errorMessage = 'Please select an audio file (MP3, WAV, or OGG)';
			return;
		}

		errorMessage = null;
		transcriptionError = null;
		isUploading = true;
		uploadProgress = 0;

		try {
			// Upload the file
			uploadProgress = 30;
			const beat = await projectStore.uploadBeat(projectId, file);
			currentBeatId = beat.id;
			uploadProgress = 60;

			// Detect BPM
			isDetectingBpm = true;
			const bpmResult = await detectBpmFromFile(file);
			uploadProgress = 80;

			// Get audio duration
			const audioContext = new AudioContext();
			const arrayBuffer = await file.arrayBuffer();
			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
			const duration = audioBuffer.duration;
			await audioContext.close();

			// Update beat metadata
			await projectStore.updateBeatMetadata(beat.id, {
				duration,
				bpm: bpmResult.bpm,
				bpmConfidence: bpmResult.confidence,
			});

			audioStore.setBpm(bpmResult.bpm);
			uploadProgress = 100;

			onUploadComplete?.();

			// Auto-start transcription
			startTranscription(beat.id);
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Failed to upload beat';
		} finally {
			isUploading = false;
			isDetectingBpm = false;
			// Reset file input
			if (fileInputRef) fileInputRef.value = '';
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'copy';
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const file = e.dataTransfer?.files[0];
		if (file && fileInputRef) {
			const dt = new DataTransfer();
			dt.items.add(file);
			fileInputRef.files = dt.files;
			handleFileSelect({ target: fileInputRef } as unknown as Event);
		}
	}
</script>

<div class="space-y-4">
	<!-- Tab Switcher -->
	<div class="flex border-b border-border">
		<button
			onclick={() => (activeTab = 'upload')}
			class="flex-1 py-3 px-4 text-sm font-medium transition-colors relative {activeTab === 'upload'
				? 'text-primary'
				: 'text-foreground-secondary hover:text-foreground'}"
		>
			<span class="flex items-center justify-center gap-2">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
					/>
				</svg>
				Upload
			</span>
			{#if activeTab === 'upload'}
				<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
			{/if}
		</button>
		<button
			onclick={() => (activeTab = 'library')}
			class="flex-1 py-3 px-4 text-sm font-medium transition-colors relative {activeTab ===
			'library'
				? 'text-primary'
				: 'text-foreground-secondary hover:text-foreground'}"
		>
			<span class="flex items-center justify-center gap-2">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
					/>
				</svg>
				Library
			</span>
			{#if activeTab === 'library'}
				<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
			{/if}
		</button>
	</div>

	<!-- Tab Content -->
	{#if activeTab === 'upload'}
		<div
			class="border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors hover:border-primary"
			ondragover={handleDragOver}
			ondrop={handleDrop}
			role="button"
			tabindex="0"
		>
			<input
				bind:this={fileInputRef}
				type="file"
				accept={acceptedExtensions}
				onchange={handleFileSelect}
				class="hidden"
				id="beat-upload"
			/>

			{#if isUploading}
				<div class="space-y-4">
					<div class="w-16 h-16 mx-auto">
						{#if isDetectingBpm}
							<svg
								class="w-full h-full text-primary animate-pulse"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
								/>
							</svg>
						{:else}
							<div
								class="w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin"
							></div>
						{/if}
					</div>
					<p class="text-foreground-secondary">
						{isDetectingBpm ? 'Detecting BPM...' : 'Uploading...'}
					</p>
					<div class="w-full max-w-xs mx-auto h-2 bg-surface-hover rounded-full overflow-hidden">
						<div
							class="h-full bg-primary transition-all duration-300"
							style="width: {uploadProgress}%"
						></div>
					</div>
				</div>
			{:else}
				<label for="beat-upload" class="cursor-pointer block">
					<div class="w-16 h-16 mx-auto mb-4 text-foreground-secondary">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-full h-full">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							/>
						</svg>
					</div>
					<p class="text-lg font-medium mb-2">Upload a Beat</p>
					<p class="text-foreground-secondary text-sm">
						Drag & drop or click to select an audio file
					</p>
					<p class="text-foreground-secondary text-xs mt-2">Supported formats: MP3, WAV, OGG</p>
				</label>
			{/if}

			{#if errorMessage}
				<p class="text-red-500 mt-4 text-sm">{errorMessage}</p>
			{/if}
		</div>

		<!-- Transcription Status -->
		{#if isTranscribing}
			<div
				class="flex items-center gap-3 p-4 bg-surface-hover rounded-lg border border-border animate-pulse"
			>
				<div
					class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"
				></div>
				<div class="flex-1">
					<p class="text-sm font-medium">Transcribing lyrics...</p>
					<p class="text-xs text-foreground-secondary">
						Analyzing audio to extract lyrics automatically
					</p>
				</div>
			</div>
		{:else if transcriptionError}
			<div class="flex items-center gap-3 p-4 bg-red-500/10 rounded-lg border border-red-500/30">
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
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<div class="flex-1">
					<p class="text-sm font-medium text-red-500">Transcription failed</p>
					<p class="text-xs text-foreground-secondary">{transcriptionError}</p>
				</div>
				<button
					onclick={retryTranscription}
					class="px-3 py-1.5 text-sm font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
				>
					Retry
				</button>
			</div>
		{/if}
	{:else}
		<BeatLibrary {projectId} onSelectBeat={onUploadComplete} />
	{/if}
</div>
