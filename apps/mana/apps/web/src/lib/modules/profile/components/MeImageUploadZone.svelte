<!--
  Drop-zone / file picker for me-images. Decoupled from any Dexie
  logic — just hands back File[] when the user drops or picks. The
  parent decides what `kind` to stamp and whether to claim a primary
  slot with the result.
-->
<script lang="ts">
	import { UploadSimple } from '@mana/shared-icons';

	interface Props {
		variant?: 'large' | 'compact';
		label?: string;
		hint?: string;
		disabled?: boolean;
		onFiles: (files: File[]) => void;
	}

	let {
		variant = 'compact',
		label = 'Bilder hochladen',
		hint = 'Ziehe Dateien hierher oder klicke',
		disabled = false,
		onFiles,
	}: Props = $props();

	let dragActive = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);

	function isFileDrag(e: DragEvent): boolean {
		return Array.from(e.dataTransfer?.types ?? []).includes('Files');
	}

	function handleDrop(e: DragEvent) {
		if (disabled || !isFileDrag(e)) return;
		e.preventDefault();
		dragActive = false;
		const files = Array.from(e.dataTransfer?.files ?? []).filter((f) =>
			f.type.startsWith('image/')
		);
		if (files.length > 0) onFiles(files);
	}

	function handleDragOver(e: DragEvent) {
		if (disabled || !isFileDrag(e)) return;
		e.preventDefault();
		dragActive = true;
	}

	function handleDragLeave() {
		dragActive = false;
	}

	function handlePick(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const files = Array.from(input.files ?? []).filter((f) => f.type.startsWith('image/'));
		if (files.length > 0) onFiles(files);
		input.value = '';
	}
</script>

<button
	type="button"
	{disabled}
	onclick={() => fileInput?.click()}
	ondrop={handleDrop}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	class="group relative flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors
    {variant === 'large' ? 'min-h-[220px] p-6' : 'min-h-[120px] p-4'}
    {dragActive
		? 'border-primary bg-primary/5 text-primary'
		: 'border-border text-muted-foreground hover:border-primary/60 hover:text-foreground'}
    {disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
>
	<UploadSimple size={variant === 'large' ? 32 : 22} weight="regular" />
	<span class="text-sm font-medium">{label}</span>
	{#if hint}
		<span class="text-xs opacity-70">{hint}</span>
	{/if}
</button>

<input
	bind:this={fileInput}
	type="file"
	accept="image/*"
	multiple
	class="hidden"
	onchange={handlePick}
/>
