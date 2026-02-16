<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { projectStore } from '$lib/stores/project.svelte';
	import { audioStore } from '$lib/stores/audio.svelte';
	import { editorStore } from '$lib/stores/editor.svelte';
	import WaveformEditor from '$lib/components/WaveformEditor.svelte';
	import PlaybackControls from '$lib/components/PlaybackControls.svelte';
	import LyricsEditor from '$lib/components/LyricsEditor.svelte';
	import MarkerTimeline from '$lib/components/MarkerTimeline.svelte';
	import KaraokePreview from '$lib/components/KaraokePreview.svelte';
	import BeatUploader from '$lib/components/BeatUploader.svelte';

	let waveformEditor: WaveformEditor;
	let showExportMenu = $state(false);
	let isExporting = $state(false);

	$effect(() => {
		const id = $page.params.id;
		if (id && authStore.isAuthenticated) {
			loadProject(id);
		}
	});

	async function loadProject(id: string) {
		await projectStore.loadProject(id);

		// Load audio URL if beat exists
		if (projectStore.currentBeat) {
			const url = await projectStore.getBeatDownloadUrl(projectStore.currentBeat.id);
			audioStore.setAudioUrl(url);
			audioStore.setBpm(projectStore.currentBeat.bpm ?? null);
		}
	}

	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/');
		}
	});

	onDestroy(() => {
		projectStore.clearCurrent();
		audioStore.reset();
		editorStore.reset();
	});

	function handlePlay() {
		waveformEditor?.play();
	}

	function handlePause() {
		waveformEditor?.pause();
	}

	function handleSeek(time: number) {
		waveformEditor?.seekTo(time);
	}

	function handleZoomIn() {
		editorStore.zoomIn();
		waveformEditor?.zoom(editorStore.zoom);
	}

	function handleZoomOut() {
		editorStore.zoomOut();
		waveformEditor?.zoom(editorStore.zoom);
	}

	function handleMarkerClick(markerId: string) {
		editorStore.selectMarker(markerId);
		const marker = projectStore.currentMarkers.find((m) => m.id === markerId);
		if (marker) {
			handleSeek(marker.startTime);
		}
	}

	function handleLineClick(lineIndex: number, line: { startTime?: number | null }) {
		editorStore.selectLine(lineIndex);
		if (line.startTime !== null && line.startTime !== undefined) {
			handleSeek(line.startTime);
		}
	}

	async function handleSyncLine(lineIndex: number) {
		const line = projectStore.currentLines[lineIndex];
		if (line) {
			await projectStore.updateLineTimestamp(line.id, audioStore.currentTime);
		}
	}

	async function handleBeatUploadComplete() {
		const id = $page.params.id;
		if (id) {
			await loadProject(id);
		}
	}

	async function handleExport(format: 'lrc' | 'srt' | 'json') {
		if (!projectStore.currentProject) return;

		isExporting = true;
		showExportMenu = false;

		try {
			const backendUrl =
				(typeof window !== 'undefined' &&
					(window as unknown as { __PUBLIC_BACKEND_URL__: string }).__PUBLIC_BACKEND_URL__) ||
				'http://localhost:3010';
			const response = await fetch(
				`${backendUrl}/export/${projectStore.currentProject.id}?format=${format}`,
				{
					headers: authStore.getAuthHeaders(),
				}
			);

			if (!response.ok) throw new Error('Export failed');

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download =
				response.headers.get('Content-Disposition')?.split('filename="')[1]?.replace('"', '') ||
				`export.${format}`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Export error:', err);
			alert('Failed to export. Please try again.');
		} finally {
			isExporting = false;
		}
	}

	async function handleDeleteBeat() {
		if (!projectStore.currentBeat) return;
		if (!confirm('Are you sure you want to delete this beat?')) return;

		await projectStore.deleteBeat(projectStore.currentBeat.id);
		audioStore.reset();
	}
</script>

<svelte:head>
	<title>{projectStore.currentProject?.title || 'Editor'} - LightWrite</title>
</svelte:head>

<div class="h-screen flex flex-col">
	<!-- Header -->
	<header class="border-b border-border bg-surface shrink-0">
		<div class="px-4 py-3 flex items-center justify-between">
			<div class="flex items-center gap-4">
				<a href="/" class="text-foreground-secondary hover:text-foreground transition-colors">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						/>
					</svg>
				</a>
				<div>
					<h1 class="font-semibold">
						{projectStore.currentProject?.title || 'Loading...'}
					</h1>
					{#if projectStore.currentProject?.description}
						<p class="text-sm text-foreground-secondary">
							{projectStore.currentProject.description}
						</p>
					{/if}
				</div>
			</div>

			<div class="flex items-center gap-3">
				<!-- Export dropdown -->
				<div class="relative">
					<button
						onclick={() => (showExportMenu = !showExportMenu)}
						disabled={isExporting || !projectStore.currentLyrics}
						class="px-4 py-2 bg-surface-hover hover:bg-surface-active rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
					>
						{#if isExporting}
							<div
								class="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin"
							></div>
						{:else}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/>
							</svg>
						{/if}
						Export
					</button>

					{#if showExportMenu}
						<div
							class="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[150px] z-10"
						>
							<button
								onclick={() => handleExport('lrc')}
								class="w-full px-4 py-2 text-left hover:bg-surface-hover transition-colors"
							>
								LRC (Lyrics)
							</button>
							<button
								onclick={() => handleExport('srt')}
								class="w-full px-4 py-2 text-left hover:bg-surface-hover transition-colors"
							>
								SRT (Subtitles)
							</button>
							<button
								onclick={() => handleExport('json')}
								class="w-full px-4 py-2 text-left hover:bg-surface-hover transition-colors"
							>
								JSON
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</header>

	{#if projectStore.isLoading}
		<div class="flex-1 flex items-center justify-center">
			<div
				class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
			></div>
		</div>
	{:else if projectStore.error}
		<div class="flex-1 flex items-center justify-center">
			<div class="text-center">
				<p class="text-red-500 mb-4">{projectStore.error}</p>
				<a href="/" class="text-primary hover:underline">Go back</a>
			</div>
		</div>
	{:else}
		<!-- Main editor layout -->
		<div class="flex-1 flex flex-col min-h-0">
			<!-- Waveform section -->
			<div class="shrink-0 p-4 border-b border-border">
				{#if projectStore.currentBeat}
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2 text-sm text-foreground-secondary">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
									/>
								</svg>
								{projectStore.currentBeat.filename}
							</div>
							<button onclick={handleDeleteBeat} class="text-sm text-red-500 hover:text-red-600">
								Remove Beat
							</button>
						</div>

						<WaveformEditor
							bind:this={waveformEditor}
							audioUrl={audioStore.audioUrl}
							onSeek={handleSeek}
						/>

						<MarkerTimeline onMarkerClick={handleMarkerClick} onSeek={handleSeek} />

						<PlaybackControls
							onPlay={handlePlay}
							onPause={handlePause}
							onSeek={handleSeek}
							onZoomIn={handleZoomIn}
							onZoomOut={handleZoomOut}
						/>
					</div>
				{:else}
					<BeatUploader
						projectId={projectStore.currentProject?.id || ''}
						onUploadComplete={handleBeatUploadComplete}
					/>
				{/if}
			</div>

			<!-- Lyrics and preview section -->
			<div class="flex-1 flex min-h-0">
				<!-- Lyrics editor -->
				<div class="w-1/2 border-r border-border overflow-hidden">
					<LyricsEditor onLineClick={handleLineClick} onSyncLine={handleSyncLine} />
				</div>

				<!-- Karaoke preview -->
				<div class="w-1/2 overflow-hidden">
					{#if editorStore.mode === 'preview'}
						<KaraokePreview />
					{:else}
						<div class="h-full flex items-center justify-center text-foreground-secondary">
							<div class="text-center">
								<p>Switch to Preview mode to see karaoke animation</p>
								<button
									onclick={() => editorStore.setMode('preview')}
									class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
								>
									Preview Mode
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Click outside handler for export menu -->
{#if showExportMenu}
	<button class="fixed inset-0 z-0" onclick={() => (showExportMenu = false)} aria-label="Close menu"
	></button>
{/if}
