<script lang="ts">
	import type { AudioFileInfo } from '$lib/services/audioStorageService';
	import { audioStorageService } from '$lib/services/audioStorageService';
	import { formatDistanceToNow } from 'date-fns';
	import { de } from 'date-fns/locale';
	import Icon from '$lib/components/Icon.svelte';
	import Text from '$lib/components/atoms/Text.svelte';

	interface Props {
		audioFile: AudioFileInfo;
		onDelete?: (file: AudioFileInfo) => void;
		onDownload?: (file: AudioFileInfo) => void;
	}

	let { audioFile, onDelete, onDownload }: Props = $props();

	let isPlaying = $state(false);
	let audioElement: HTMLAudioElement;

	function handlePlayPause() {
		if (isPlaying) {
			audioElement.pause();
		} else {
			audioElement.play();
		}
		isPlaying = !isPlaying;
	}

	function handleAudioEnded() {
		isPlaying = false;
	}

	function handleDelete() {
		if (
			confirm(
				`Möchten Sie die Aufnahme "${audioFile.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
			)
		) {
			onDelete?.(audioFile);
		}
	}

	function handleDownload() {
		onDownload?.(audioFile);
	}

	function formatFileSize(bytes: number): string {
		return audioStorageService.formatFileSize(bytes);
	}

	function formatDuration(seconds: number | undefined): string {
		if (!seconds) return '—';
		return audioStorageService.formatDuration(seconds);
	}

	function getFormatColor(format: string): string {
		const colors: Record<string, string> = {
			M4A: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
			MP3: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
			WAV: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
			OGG: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
			AAC: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
			FLAC: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
			WEBM: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200'
		};
		return colors[format.toUpperCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
	}
</script>

<div class="rounded-lg border border-theme bg-menu p-4 transition-all hover:shadow-md">
	<!-- Header -->
	<div class="mb-3 flex items-start justify-between gap-3">
		<div class="flex-1 min-w-0">
			<Text variant="body" weight="semibold" class="truncate" title={audioFile.name}>
				{audioFile.name}
			</Text>
			{#if audioFile.metadata?.memo_title}
				<a
					href="/dashboard?memoId={audioFile.metadata.memo_id}"
					class="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
				>
					<Icon name="link" size={14} />
					<Text variant="small" class="truncate">{audioFile.metadata.memo_title}</Text>
				</a>
			{/if}
		</div>

		<!-- Format Badge -->
		{#if audioFile.metadata?.format}
			<Text
				variant="muted"
				weight="semibold"
				class="rounded-full px-2.5 py-1 {getFormatColor(audioFile.metadata.format)}"
			>
				{audioFile.metadata.format}
			</Text>
		{/if}
	</div>

	<!-- Audio Player -->
	<div class="mb-3">
		<audio
			bind:this={audioElement}
			src={audioFile.url}
			onended={handleAudioEnded}
			class="w-full"
			controls
		>
			Ihr Browser unterstützt keine Audio-Wiedergabe.
		</audio>
	</div>

	<!-- Metadata Row -->
	<div class="mb-3 flex flex-wrap items-center gap-4">
		<!-- Duration -->
		<div class="flex items-center gap-1.5">
			<Icon name="clock" size={16} class="text-theme-secondary" />
			<Text variant="small">{formatDuration(audioFile.metadata?.duration)}</Text>
		</div>

		<!-- Size -->
		<div class="flex items-center gap-1.5">
			<Icon name="folder" size={16} class="text-theme-secondary" />
			<Text variant="small">{formatFileSize(audioFile.size)}</Text>
		</div>

		<!-- Created Date -->
		<div class="flex items-center gap-1.5">
			<Icon name="calendar" size={16} class="text-theme-secondary" />
			<Text variant="small">{formatDistanceToNow(new Date(audioFile.created_at), { addSuffix: true, locale: de })}</Text>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex gap-2">
		<button onclick={handleDownload} class="btn-secondary flex-1 flex items-center justify-center gap-2">
			<Icon name="download" size={16} />
			<Text variant="small">Herunterladen</Text>
		</button>

		<button onclick={handleDelete} class="btn-danger flex-1 flex items-center justify-center gap-2">
			<Icon name="trash" size={16} />
			<Text variant="small">Löschen</Text>
		</button>
	</div>
</div>
