<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { user } from '$lib/stores/auth';
	import { uploadAndProcessAudio } from '$lib/services/audioUploadService';
	import { createAuthClient } from '$lib/supabaseClient';
	import { UploadPageSkeleton } from '$lib/components/skeletons';
	import { Text } from '@manacore/shared-ui';

	// Upload state
	let uploading = $state(false);
	let uploadProgress = $state(0);
	let uploadError = $state<string | null>(null);
	let uploadSuccess = $state(false);

	// File upload state
	let selectedFile = $state<File | null>(null);
	let isDragging = $state(false);

	// Get current date and time
	const now = new Date();
	const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
	const currentTime = now.toTimeString().slice(0, 5); // HH:MM

	// Form state
	let title = $state('');
	let selectedBlueprint = $state<string | null>(null);
	let recordingDate = $state(currentDate);
	let recordingTime = $state(currentTime);
	let recordingLanguages = $state<string[]>(['de']);
	let enableDiarization = $state(false);

	// Options data
	let blueprints = $state<any[]>([]);
	let loadingOptions = $state(true);

	const availableLanguages = [
		{ code: 'de', name: 'Deutsch' },
		{ code: 'en', name: 'English' },
		{ code: 'es', name: 'Español' },
		{ code: 'fr', name: 'Français' },
		{ code: 'it', name: 'Italiano' }
	];

	// Load blueprints
	onMount(async () => {
		try {
			const supabase = await createAuthClient();

			// Load blueprints
			const { data: blueprintsData } = await supabase
				.from('blueprints')
				.select('id, name')
				.eq('is_public', true)
				.order('name');

			if (blueprintsData) {
				blueprints = blueprintsData;
			}
		} catch (error) {
			console.error('Error loading options:', error);
		} finally {
			loadingOptions = false;
		}
	});

	// File upload handlers
	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			if (file.type.startsWith('audio/')) {
				selectedFile = file;
				uploadError = null;
			} else {
				uploadError = 'Please select an audio file';
			}
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;

		const files = event.dataTransfer?.files;
		if (files && files[0]) {
			const file = files[0];
			if (file.type.startsWith('audio/')) {
				selectedFile = file;
				uploadError = null;
			} else {
				uploadError = 'Please drop an audio file';
			}
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function removeFile() {
		selectedFile = null;
	}

	// Upload file
	async function handleUpload() {
		if (!selectedFile || !$user) return;

		try {
			uploading = true;
			uploadError = null;
			uploadProgress = 0;

			// Get audio duration
			const duration = await getAudioDuration(selectedFile);

			// Upload and process
			const result = await uploadAndProcessAudio({
				audioBlob: selectedFile,
				userId: $user.id,
				title: title || 'Uploaded Recording',
				duration,
				blueprintId: selectedBlueprint,
				recordingLanguages,
				enableDiarization,
				recordingDate: recordingDate || undefined,
				recordingTime: recordingTime || undefined
			});

			if (result.success) {
				uploadSuccess = true;
				uploadProgress = 100;

				// Redirect to dashboard after 2 seconds
				setTimeout(() => {
					goto('/dashboard');
				}, 2000);
			} else {
				uploadError = result.error || 'Upload failed';
			}
		} catch (error) {
			console.error('Upload error:', error);
			uploadError = error instanceof Error ? error.message : 'Upload failed';
		} finally {
			uploading = false;
		}
	}

	// Get audio duration
	function getAudioDuration(file: File): Promise<number> {
		return new Promise((resolve) => {
			const audio = new Audio();
			audio.onloadedmetadata = () => {
				resolve(Math.floor(audio.duration));
			};
			audio.onerror = () => {
				resolve(0);
			};
			audio.src = URL.createObjectURL(file);
		});
	}

	// Format file size
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
</script>

<svelte:head>
	<title>Upload - Memoro</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex-1 overflow-y-auto">
		<div class="mx-auto max-w-5xl px-4 py-4">
			<!-- Header -->
			<div class="mb-4">
				<Text variant="large" weight="bold" class="mb-1 text-2xl">Audio hochladen</Text>
				<Text variant="small" class="text-theme-secondary">
					Lade eine Audiodatei hoch und verarbeite sie mit AI
				</Text>
			</div>

		{#if loadingOptions}
			<UploadPageSkeleton />
		{:else}

			<!-- File Upload -->
			<div class="mb-4">
				<div class="rounded-xl border border-theme bg-menu p-4">
					<Text variant="large" weight="semibold" class="mb-3">Datei hochladen</Text>

					<!-- Drag & Drop Area -->
					<div
						class="rounded-lg border-2 border-dashed p-6 text-center transition-all {isDragging
							? 'border-mana bg-mana/5'
							: 'border-theme bg-content'}"
						ondrop={handleDrop}
						ondragover={handleDragOver}
						ondragleave={handleDragLeave}
					>
						{#if selectedFile}
							<!-- Selected File -->
							<div class="flex items-center justify-between rounded-lg border border-theme bg-menu p-3">
								<div class="flex items-center gap-3">
									<svg class="h-6 w-6 text-mana" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
										/>
									</svg>
									<div class="text-left">
										<Text variant="body" weight="medium">{selectedFile.name}</Text>
										<Text variant="small" class="text-theme-secondary">{formatFileSize(selectedFile.size)}</Text>
									</div>
								</div>
								<button
									onclick={removeFile}
									class="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
								>
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
						{:else}
							<!-- Upload Prompt -->
							<svg
								class="mx-auto mb-3 h-10 w-10 text-theme-secondary"
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
							<Text variant="small" class="mb-2">Datei hierher ziehen oder</Text>
							<label class="btn-primary cursor-pointer inline-block">
								Durchsuchen
								<input
									type="file"
									accept="audio/*"
									class="hidden"
									onchange={handleFileSelect}
								/>
							</label>
							<Text variant="muted" class="mt-2 text-xs">MP3, M4A, WAV, WEBM</Text>
						{/if}
					</div>
				</div>
			</div>

			<!-- Upload Options -->
			<div class="mb-4 rounded-xl border border-theme bg-menu p-4">
				<Text variant="large" weight="semibold" class="mb-4">Optionen</Text>

				<div class="space-y-4">
					<!-- Title -->
					<div>
						<label for="title" class="mb-1.5 block text-sm font-medium text-theme">Titel (optional)</label>
						<input
							type="text"
							id="title"
							bind:value={title}
							placeholder="Memo-Titel"
							class="w-full rounded-lg border border-theme bg-content px-3 py-1.5 text-sm text-theme focus:border-mana focus:outline-none focus:ring-2 focus:ring-mana/20"
						/>
					</div>

					<!-- Blueprint -->
					<div>
						<label for="blueprint" class="mb-1.5 block text-sm font-medium text-theme">Blueprint (optional)</label>
						<select
							id="blueprint"
							bind:value={selectedBlueprint}
							class="w-full rounded-lg border border-theme bg-content px-3 py-1.5 text-sm text-theme focus:border-mana focus:outline-none focus:ring-2 focus:ring-mana/20"
						>
							<option value={null}>Kein Blueprint</option>
							{#each blueprints as blueprint}
								<option value={blueprint.id}>{blueprint.name?.de || blueprint.name?.en || blueprint.id}</option>
							{/each}
						</select>
					</div>

					<!-- Date and Time -->
					<div class="grid grid-cols-2 gap-3">
						<!-- Date -->
						<div>
							<label for="date" class="mb-1.5 block text-sm font-medium text-theme">Datum (optional)</label>
							<input
								type="date"
								id="date"
								bind:value={recordingDate}
								class="w-full rounded-lg border border-theme bg-content px-3 py-1.5 text-sm text-theme focus:border-mana focus:outline-none focus:ring-2 focus:ring-mana/20"
							/>
						</div>

						<!-- Time -->
						<div>
							<label for="time" class="mb-1.5 block text-sm font-medium text-theme">Uhrzeit (optional)</label>
							<input
								type="time"
								id="time"
								bind:value={recordingTime}
								class="w-full rounded-lg border border-theme bg-content px-3 py-1.5 text-sm text-theme focus:border-mana focus:outline-none focus:ring-2 focus:ring-mana/20"
							/>
						</div>
					</div>

					<!-- Language -->
					<div>
						<label class="mb-1.5 block text-sm font-medium text-theme">Sprache</label>
						<div class="flex flex-wrap gap-2">
							{#each availableLanguages as lang}
								<button
									type="button"
									onclick={() => {
										if (recordingLanguages.includes(lang.code)) {
											recordingLanguages = recordingLanguages.filter(l => l !== lang.code);
										} else {
											recordingLanguages = [...recordingLanguages, lang.code];
										}
									}}
									class="rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-all {recordingLanguages.includes(lang.code)
										? 'border-primary bg-primary text-primary-button-text'
										: 'border-theme bg-content text-theme hover:bg-menu'}"
								>
									{lang.name}
								</button>
							{/each}
						</div>
					</div>

					<!-- Diarization -->
					<div class="flex items-center justify-between">
						<div>
							<label for="diarization" class="text-sm font-medium text-theme">Sprechererkennung</label>
							<p class="text-xs text-theme-secondary">Erkennt verschiedene Sprecher im Audio</p>
						</div>
						<button
							type="button"
							id="diarization"
							onclick={() => enableDiarization = !enableDiarization}
							class="relative inline-flex h-7 w-12 items-center rounded-full transition-colors {enableDiarization ? 'bg-mana' : 'bg-gray-300 dark:bg-gray-600'}"
						>
							<span
								class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform {enableDiarization ? 'translate-x-6' : 'translate-x-1'}"
							></span>
						</button>
					</div>
				</div>
			</div>

			<!-- Upload Button -->
			<div class="flex justify-end gap-3">
				<button
					onclick={() => goto('/dashboard')}
					class="btn-secondary"
				>
					Abbrechen
				</button>
				<button
					onclick={handleUpload}
					disabled={!selectedFile || uploading}
					class="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if uploading}
						Lädt hoch...
					{:else}
						Hochladen & Verarbeiten
					{/if}
				</button>
			</div>

			<!-- Upload Status -->
			{#if uploading}
				<div class="mt-6 rounded-2xl border border-theme bg-menu p-6">
					<div class="mb-2 flex items-center justify-between">
						<span class="font-medium text-theme">Wird hochgeladen...</span>
						<span class="text-sm text-theme-secondary">{uploadProgress}%</span>
					</div>
					<div class="h-2 overflow-hidden rounded-full bg-content">
						<div
							class="h-full bg-mana transition-all duration-300"
							style="width: {uploadProgress}%"
						></div>
					</div>
				</div>
			{/if}

			{#if uploadSuccess}
				<div class="mt-6 rounded-2xl border border-green-500/20 bg-green-500/5 p-6">
					<div class="flex items-center gap-3">
						<svg class="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<p class="font-medium text-green-500">Upload erfolgreich! Wird verarbeitet...</p>
					</div>
				</div>
			{/if}

			{#if uploadError}
				<div class="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
					<div class="flex items-center gap-3">
						<svg class="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<p class="font-medium text-red-500">{uploadError}</p>
					</div>
				</div>
			{/if}
		{/if}

		</div>
	</div>
</div>
