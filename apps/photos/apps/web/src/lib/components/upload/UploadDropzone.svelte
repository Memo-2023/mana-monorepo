<script lang="ts">
	import { _ } from 'svelte-i18n';

	interface Props {
		onFilesSelected: (files: File[]) => void;
	}

	let { onFilesSelected }: Props = $props();

	let dragActive = $state(false);
	let fileInput: HTMLInputElement;

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragActive = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		dragActive = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragActive = false;

		if (e.dataTransfer?.files) {
			const files = Array.from(e.dataTransfer.files);
			onFilesSelected(files);
		}
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			const files = Array.from(input.files);
			onFilesSelected(files);
			input.value = '';
		}
	}

	function openFilePicker() {
		fileInput?.click();
	}
</script>

<div
	class="dropzone"
	class:active={dragActive}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	role="button"
	tabindex="0"
	onclick={openFilePicker}
	onkeydown={(e) => e.key === 'Enter' && openFilePicker()}
>
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		multiple
		class="hidden"
		onchange={handleFileSelect}
	/>

	<div class="dropzone-content">
		<div class="dropzone-icon">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="48"
				height="48"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
				<polyline points="17 8 12 3 7 8" />
				<line x1="12" x2="12" y1="3" y2="15" />
			</svg>
		</div>
		<p class="dropzone-text">{$_('upload.dropzone')}</p>
		<button type="button" class="btn btn-primary mt-4" onclick|stopPropagation={openFilePicker}>
			{$_('upload.selectFiles')}
		</button>
	</div>
</div>

<style>
	.dropzone {
		border: 2px dashed var(--color-border);
		border-radius: var(--radius-xl);
		padding: 3rem;
		text-align: center;
		background-color: var(--color-card);
		transition: all 200ms ease;
		cursor: pointer;
	}

	.dropzone:hover {
		border-color: var(--color-primary);
		background-color: var(--color-accent);
	}

	.dropzone.active {
		border-color: var(--color-primary);
		background-color: var(--color-accent);
		border-style: solid;
	}

	.dropzone-content {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.dropzone-icon {
		color: var(--color-muted-foreground);
		margin-bottom: 1rem;
	}

	.dropzone.active .dropzone-icon {
		color: var(--color-primary);
	}

	.dropzone-text {
		color: var(--color-muted-foreground);
		font-size: 1rem;
	}

	.hidden {
		display: none;
	}
</style>
