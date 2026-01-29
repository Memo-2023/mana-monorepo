<script lang="ts">
	import { UploadSimple } from '@manacore/shared-icons';

	interface Props {
		onUpload: (files: FileList) => void;
		uploading?: boolean;
		progress?: number;
	}

	let { onUpload, uploading = false, progress = 0 }: Props = $props();

	let isDragging = $state(false);
	let fileInput: HTMLInputElement;

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			onUpload(e.dataTransfer.files);
		}
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			onUpload(target.files);
			target.value = '';
		}
	}

	function openFileDialog() {
		fileInput?.click();
	}
</script>

<div
	class="upload-zone"
	class:dragging={isDragging}
	class:uploading
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	role="button"
	tabindex="0"
	onclick={openFileDialog}
	onkeydown={(e) => e.key === 'Enter' && openFileDialog()}
>
	<input
		type="file"
		multiple
		bind:this={fileInput}
		onchange={handleFileSelect}
		class="file-input"
		aria-label="Dateien auswählen"
	/>

	{#if uploading}
		<div class="upload-progress">
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progress}%"></div>
			</div>
			<span class="progress-text">Hochladen... {progress}%</span>
		</div>
	{:else}
		<div class="upload-content">
			<UploadSimple size={32} />
			<span class="upload-text">
				Dateien hierher ziehen oder <strong>klicken</strong> zum Auswählen
			</span>
		</div>
	{/if}
</div>

<style>
	.upload-zone {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		border: 2px dashed rgb(var(--color-border));
		border-radius: var(--radius-lg);
		background: rgb(var(--color-surface));
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.upload-zone:hover,
	.upload-zone.dragging {
		border-color: rgb(var(--color-primary));
		background: rgba(var(--color-primary), 0.05);
	}

	.upload-zone.uploading {
		cursor: default;
	}

	.file-input {
		display: none;
	}

	.upload-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		color: rgb(var(--color-text-secondary));
	}

	.upload-text {
		font-size: 0.875rem;
		text-align: center;
	}

	.upload-text strong {
		color: rgb(var(--color-primary));
	}

	.upload-progress {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		max-width: 300px;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: rgb(var(--color-surface-elevated));
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: rgb(var(--color-primary));
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.progress-text {
		font-size: 0.875rem;
		color: rgb(var(--color-text-secondary));
	}
</style>
