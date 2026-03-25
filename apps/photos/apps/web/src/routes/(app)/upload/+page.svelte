<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { uploadWithAuth } from '$lib/api/client';
	import { PhotosEvents } from '@manacore/shared-utils/analytics';
	import UploadDropzone from '$lib/components/upload/UploadDropzone.svelte';

	interface UploadFile {
		file: File;
		preview: string;
		progress: number;
		status: 'pending' | 'uploading' | 'success' | 'error';
		error?: string;
	}

	let files = $state<UploadFile[]>([]);
	let uploading = $state(false);

	function handleFilesSelected(selectedFiles: File[]) {
		const newFiles = selectedFiles
			.filter((file) => file.type.startsWith('image/'))
			.map((file) => ({
				file,
				preview: URL.createObjectURL(file),
				progress: 0,
				status: 'pending' as const,
			}));
		files = [...files, ...newFiles];
	}

	function removeFile(index: number) {
		URL.revokeObjectURL(files[index].preview);
		files = files.filter((_, i) => i !== index);
	}

	async function uploadAll() {
		if (files.length === 0 || uploading) return;

		uploading = true;

		for (let i = 0; i < files.length; i++) {
			if (files[i].status !== 'pending') continue;

			files[i].status = 'uploading';
			files[i].progress = 0;

			try {
				const formData = new FormData();
				formData.append('file', files[i].file);
				formData.append('app', 'photos');

				await uploadWithAuth('/photos/upload', formData);

				files[i].status = 'success';
				files[i].progress = 100;
				PhotosEvents.photoUploaded();
			} catch (e) {
				files[i].status = 'error';
				files[i].error = e instanceof Error ? e.message : 'Upload failed';
			}
		}

		uploading = false;

		// If all successful, redirect to gallery after a delay
		const allSuccess = files.every((f) => f.status === 'success');
		if (allSuccess) {
			setTimeout(() => goto('/'), 1500);
		}
	}

	function clearCompleted() {
		files.filter((f) => f.status === 'success').forEach((f) => URL.revokeObjectURL(f.preview));
		files = files.filter((f) => f.status !== 'success');
	}
</script>

<svelte:head>
	<title>{$_('upload.title')} | Photos</title>
</svelte:head>

<div class="upload-page">
	<header class="page-header">
		<h1 class="text-2xl font-bold">{$_('upload.title')}</h1>
	</header>

	<UploadDropzone onFilesSelected={handleFilesSelected} />

	{#if files.length > 0}
		<div class="upload-list">
			<div class="flex justify-between items-center mb-4">
				<span class="text-sm text-muted-foreground">
					{files.length}
					{files.length === 1 ? 'file' : 'files'}
				</span>
				<div class="flex gap-2">
					{#if files.some((f) => f.status === 'success')}
						<button class="btn btn-ghost" onclick={clearCompleted}> Clear completed </button>
					{/if}
					<button
						class="btn btn-primary"
						onclick={uploadAll}
						disabled={uploading || files.every((f) => f.status !== 'pending')}
					>
						{#if uploading}
							{$_('upload.uploading')}
						{:else}
							Upload All
						{/if}
					</button>
				</div>
			</div>

			<div class="file-grid">
				{#each files as file, index}
					<div
						class="file-item"
						class:success={file.status === 'success'}
						class:error={file.status === 'error'}
					>
						<img src={file.preview} alt="" class="file-preview" />
						<div class="file-overlay">
							{#if file.status === 'pending'}
								<button class="remove-btn" onclick={() => removeFile(index)}>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<path d="M18 6 6 18" />
										<path d="m6 6 12 12" />
									</svg>
								</button>
							{:else if file.status === 'uploading'}
								<div class="progress-ring">
									<svg viewBox="0 0 36 36">
										<path
											class="progress-bg"
											d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
										/>
										<path
											class="progress-bar"
											stroke-dasharray="{file.progress}, 100"
											d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
										/>
									</svg>
								</div>
							{:else if file.status === 'success'}
								<div class="status-icon success">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
								</div>
							{:else if file.status === 'error'}
								<div class="status-icon error" title={file.error}>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<path d="M18 6 6 18" />
										<path d="m6 6 12 12" />
									</svg>
								</div>
							{/if}
						</div>
						<div class="file-name">{file.file.name}</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.upload-page {
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 1.5rem;
	}

	.upload-list {
		margin-top: 2rem;
	}

	.file-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
	}

	.file-item {
		position: relative;
		aspect-ratio: 1;
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--color-muted);
	}

	.file-item.success {
		outline: 2px solid var(--color-success, #22c55e);
	}

	.file-item.error {
		outline: 2px solid var(--color-destructive);
	}

	.file-preview {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.file-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.3);
		opacity: 0;
		transition: opacity 150ms;
	}

	.file-item:hover .file-overlay {
		opacity: 1;
	}

	.file-item.success .file-overlay,
	.file-item.error .file-overlay {
		opacity: 1;
		background: rgba(0, 0, 0, 0.5);
	}

	.remove-btn {
		padding: 0.5rem;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.9);
		color: var(--color-foreground);
		border: none;
		cursor: pointer;
	}

	.progress-ring {
		width: 40px;
		height: 40px;
	}

	.progress-ring svg {
		transform: rotate(-90deg);
	}

	.progress-bg {
		fill: none;
		stroke: rgba(255, 255, 255, 0.3);
		stroke-width: 3;
	}

	.progress-bar {
		fill: none;
		stroke: white;
		stroke-width: 3;
		stroke-linecap: round;
		transition: stroke-dasharray 300ms;
	}

	.status-icon {
		padding: 0.5rem;
		border-radius: 50%;
		color: white;
	}

	.status-icon.success {
		background: var(--color-success, #22c55e);
	}

	.status-icon.error {
		background: var(--color-destructive);
	}

	.file-name {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 0.5rem;
		font-size: 0.75rem;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
		color: white;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
