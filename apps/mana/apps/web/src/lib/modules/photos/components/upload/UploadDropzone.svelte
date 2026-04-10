<script lang="ts">
	import { DownloadSimple } from '@mana/shared-icons';

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
	class="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed p-12 text-center transition-all {dragActive
		? 'border-primary bg-primary/5 border-solid'
		: 'border-border bg-background-card hover:border-primary'}"
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

	<div class="mb-4 text-foreground-secondary" class:text-primary={dragActive}>
		<DownloadSimple size={48} />
	</div>
	<p class="text-foreground-secondary">Fotos hierher ziehen oder klicken zum Auswählen</p>
	<button
		type="button"
		class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
		onclick={(e) => {
			e.stopPropagation();
			openFilePicker();
		}}
	>
		Dateien auswählen
	</button>
</div>
