<script lang="ts">
	import { projectStore } from '$lib/stores/project.svelte';
	import { audioStore } from '$lib/stores/audio.svelte';
	import { detectBpmFromFile } from '$lib/utils/bpm-detector';

	interface Props {
		projectId: string;
		onUploadComplete?: () => void;
	}

	let { projectId, onUploadComplete }: Props = $props();

	let isUploading = $state(false);
	let isDetectingBpm = $state(false);
	let uploadProgress = $state(0);
	let errorMessage = $state<string | null>(null);
	let fileInputRef: HTMLInputElement;

	const acceptedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav'];
	const acceptedExtensions = '.mp3,.wav,.ogg';

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
		isUploading = true;
		uploadProgress = 0;

		try {
			// Upload the file
			uploadProgress = 30;
			const beat = await projectStore.uploadBeat(projectId, file);
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
			<p class="text-foreground-secondary text-sm">Drag & drop or click to select an audio file</p>
			<p class="text-foreground-secondary text-xs mt-2">Supported formats: MP3, WAV, OGG</p>
		</label>
	{/if}

	{#if errorMessage}
		<p class="text-red-500 mt-4 text-sm">{errorMessage}</p>
	{/if}
</div>
