<script lang="ts">
	import type { AudioFileInfo } from '$lib/services/audioStorageService';
	import AudioFileCard from './AudioFileCard.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { Text } from '@manacore/shared-ui';

	interface Props {
		audioFiles: AudioFileInfo[];
		isLoading?: boolean;
		hasMore?: boolean;
		onLoadMore?: () => void;
		onDelete?: (file: AudioFileInfo) => void;
		onDownload?: (file: AudioFileInfo) => void;
	}

	let { audioFiles, isLoading = false, hasMore = false, onLoadMore, onDelete, onDownload }: Props =
		$props();
</script>

{#if isLoading && audioFiles.length === 0}
	<!-- Loading State -->
	<div class="flex flex-col items-center justify-center py-16">
		<div class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
		<Text variant="body-secondary">Lade Aufnahmen...</Text>
	</div>
{:else if audioFiles.length === 0}
	<!-- Empty State -->
	<div class="flex flex-col items-center justify-center py-16">
		<div class="mb-4 rounded-full bg-menu p-6">
			<Icon name="music" size={48} class="text-theme-secondary" />
		</div>
		<Text variant="large" weight="semibold" class="mb-2">Keine Aufnahmen</Text>
		<Text variant="body-secondary" class="text-center">
			Sie haben noch keine Audio-Aufnahmen im Archiv.
			<br />
			Erstellen Sie Ihre erste Aufnahme, um sie hier zu sehen.
		</Text>
	</div>
{:else}
	<!-- Audio Files Grid -->
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
		{#each audioFiles as audioFile (audioFile.id)}
			<AudioFileCard {audioFile} {onDelete} {onDownload} />
		{/each}
	</div>

	<!-- Load More Button -->
	{#if hasMore}
		<div class="mt-6 flex justify-center">
			<button
				onclick={onLoadMore}
				disabled={isLoading}
				class="btn-secondary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if isLoading}
					<div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
					<Text variant="small">Lädt...</Text>
				{:else}
					<Icon name="arrow-down" size={16} />
					<Text variant="small">Mehr laden</Text>
				{/if}
			</button>
		</div>
	{/if}
{/if}
