<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { CloudArrowUp, File, Table } from '@manacore/shared-icons';

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
			<CloudArrowUp size={32} />
		</div>

		<div>
			<p class="text-lg font-medium text-foreground">{$_('import.dropzone.title')}</p>
			<p class="text-sm text-muted-foreground mt-1">{$_('import.dropzone.subtitle')}</p>
		</div>

		<div class="flex items-center gap-4 text-sm text-muted-foreground">
			<span class="flex items-center gap-1">
				<File size={16} />
				vCard (.vcf)
			</span>
			<span class="flex items-center gap-1">
				<Table size={16} />
				CSV (.csv)
			</span>
		</div>
	</div>
</div>
