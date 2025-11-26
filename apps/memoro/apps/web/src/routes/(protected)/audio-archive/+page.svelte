<script lang="ts">
	import { onMount } from 'svelte';
	import {
		audioStorageService,
		type AudioFileInfo,
		type AudioArchiveStats
	} from '$lib/services/audioStorageService';
	import ArchiveStatistics from '$lib/components/audio/ArchiveStatistics.svelte';
	import AudioFileList from '$lib/components/audio/AudioFileList.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let audioFiles = $state<AudioFileInfo[]>([]);
	let stats = $state<AudioArchiveStats>({
		totalCount: 0,
		totalDurationSeconds: 0,
		totalSizeBytes: 0
	});
	let isLoading = $state(false);
	let hasMore = $state(true);
	let offset = $state(0);
	const limit = 20;

	onMount(() => {
		loadAudioFiles();
		loadStats();
	});

	async function loadAudioFiles(loadMore = false) {
		try {
			isLoading = true;

			if (!loadMore) {
				offset = 0;
				audioFiles = [];
			}

			const newFiles = await audioStorageService.getAllAudioFiles(limit, offset);

			if (loadMore) {
				audioFiles = [...audioFiles, ...newFiles];
			} else {
				audioFiles = newFiles;
			}

			hasMore = newFiles.length === limit;
			offset += newFiles.length;
		} catch (error) {
			console.error('Error loading audio files:', error);
			// TODO: Show error toast
		} finally {
			isLoading = false;
		}
	}

	async function loadStats() {
		try {
			stats = await audioStorageService.getAudioArchiveStats();
		} catch (error) {
			console.error('Error loading stats:', error);
		}
	}

	function handleLoadMore() {
		loadAudioFiles(true);
	}

	async function handleDelete(file: AudioFileInfo) {
		try {
			await audioStorageService.deleteAudioFile(file.name);

			// Remove from list
			audioFiles = audioFiles.filter((f) => f.id !== file.id);

			// Reload stats
			await loadStats();

			// TODO: Show success toast
		} catch (error) {
			console.error('Error deleting file:', error);
			// TODO: Show error toast
		}
	}

	async function handleDownload(file: AudioFileInfo) {
		try {
			await audioStorageService.downloadAudioFile(file.url, file.name);
			// TODO: Show success toast
		} catch (error) {
			console.error('Error downloading file:', error);
			// TODO: Show error toast
		}
	}

	async function handleRefresh() {
		await Promise.all([loadAudioFiles(false), loadStats()]);
	}
</script>

<svelte:head>
	<title>Audio-Archiv | Memoro</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6 p-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-theme">Audio-Archiv</h1>
			<p class="mt-2 text-theme-secondary">
				Verwalten Sie alle Ihre Audio-Aufnahmen an einem zentralen Ort
			</p>
		</div>

		<button
			onclick={handleRefresh}
			disabled={isLoading}
			class="btn-secondary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
			title="Aktualisieren"
		>
			<Icon name="refresh" size={18} />
			<span>Aktualisieren</span>
		</button>
	</div>

	<!-- Statistics -->
	<ArchiveStatistics {stats} />

	<!-- Audio Files List -->
	<div>
		<AudioFileList
			{audioFiles}
			{isLoading}
			{hasMore}
			onLoadMore={handleLoadMore}
			onDelete={handleDelete}
			onDownload={handleDownload}
		/>
	</div>
</div>
