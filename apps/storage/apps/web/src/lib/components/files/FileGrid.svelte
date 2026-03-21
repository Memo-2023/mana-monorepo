<script lang="ts">
	import type { StorageFile, StorageFolder } from '$lib/api/client';
	import FileCard from './FileCard.svelte';
	import FolderCard from './FolderCard.svelte';

	interface Props {
		files: StorageFile[];
		folders: StorageFolder[];
		onFileClick?: (file: StorageFile) => void;
		onFolderClick?: (folder: StorageFolder) => void;
		onFileAction?: (action: string, file: StorageFile) => void;
		onFolderAction?: (action: string, folder: StorageFolder) => void;
		onMoveToFolder?: (itemType: 'file' | 'folder', itemId: string, targetFolderId: string) => void;
	}

	let {
		files,
		folders,
		onFileClick,
		onFolderClick,
		onFileAction,
		onFolderAction,
		onMoveToFolder,
	}: Props = $props();
</script>

<div class="file-grid">
	{#each folders as folder, i (folder.id)}
		<div class="grid-item" style="--delay: {i * 30}ms">
			<FolderCard
				{folder}
				onClick={() => onFolderClick?.(folder)}
				onAction={(action) => onFolderAction?.(action, folder)}
				onDrop={(data) => onMoveToFolder?.(data.type, data.id, folder.id)}
			/>
		</div>
	{/each}
	{#each files as file, i (file.id)}
		<div class="grid-item" style="--delay: {(folders.length + i) * 30}ms">
			<FileCard
				{file}
				onClick={() => onFileClick?.(file)}
				onAction={(action) => onFileAction?.(action, file)}
			/>
		</div>
	{/each}
</div>

<style>
	.file-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 1rem;
	}

	.grid-item {
		animation: fadeSlideIn 0.3s ease-out both;
		animation-delay: var(--delay, 0ms);
	}

	@keyframes fadeSlideIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 640px) {
		.file-grid {
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
			gap: 0.75rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.grid-item {
			animation: none;
		}
	}
</style>
