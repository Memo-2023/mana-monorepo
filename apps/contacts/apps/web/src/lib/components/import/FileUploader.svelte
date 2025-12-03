<script lang="ts">
	import { _ } from 'svelte-i18n';

	interface Props {
		onFileSelect: (file: File) => void;
		accept?: string;
		disabled?: boolean;
	}

	let { onFileSelect, accept = '.vcf,.vcard,.csv', disabled = false }: Props = $props();

	let isDragging = $state(false);
	let fileInput: HTMLInputElement;

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (!disabled) {
			isDragging = true;
		}
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		if (disabled) return;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			onFileSelect(files[0]);
		}
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			onFileSelect(target.files[0]);
			target.value = '';
		}
	}

	function handleClick() {
		if (!disabled) {
			fileInput.click();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}
</script>

<div
	role="button"
	tabindex="0"
	class="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
		{isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
		{disabled ? 'opacity-50 cursor-not-allowed' : ''}"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	onclick={handleClick}
	onkeydown={handleKeydown}
>
	<input
		bind:this={fileInput}
		type="file"
		{accept}
		class="hidden"
		onchange={handleFileSelect}
		{disabled}
	/>

	<div class="flex flex-col items-center gap-4">
		<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
			<svg
				class="w-8 h-8"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
				/>
			</svg>
		</div>

		<div>
			<p class="text-lg font-medium text-foreground">{$_('import.dropzone.title')}</p>
			<p class="text-sm text-muted-foreground mt-1">{$_('import.dropzone.subtitle')}</p>
		</div>

		<div class="flex items-center gap-4 text-sm text-muted-foreground">
			<span class="flex items-center gap-1">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				vCard (.vcf)
			</span>
			<span class="flex items-center gap-1">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
					/>
				</svg>
				CSV (.csv)
			</span>
		</div>
	</div>
</div>
