<script lang="ts">
	/**
	 * App-side gallery inspector with multi-image upload via mana-media.
	 * Overrides the URL-only fallback from @mana/website-blocks.
	 */
	import { _ } from 'svelte-i18n';
	import type { BlockInspectorProps } from '@mana/website-blocks';
	import type { GalleryProps, GalleryImage } from '@mana/website-blocks';
	import { uploadImage, UploadError } from '../upload';

	let { block, onChange }: BlockInspectorProps<GalleryProps> = $props();

	let uploading = $state(false);
	let uploadError = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	async function handleFiles(files: FileList | File[]) {
		uploading = true;
		uploadError = null;
		const added: GalleryImage[] = [];
		try {
			for (const file of Array.from(files)) {
				const result = await uploadImage(file);
				added.push({ url: result.url, altText: '', caption: '' });
			}
			onChange({ images: [...block.props.images, ...added] });
		} catch (err) {
			if (err instanceof UploadError) uploadError = err.message;
			else uploadError = err instanceof Error ? err.message : String(err);
		} finally {
			uploading = false;
		}
	}

	function onFileChange(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		if (target.files?.length) void handleFiles(target.files);
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer?.files?.length) void handleFiles(e.dataTransfer.files);
	}

	function updateImage(index: number, patch: Partial<GalleryImage>) {
		const next = block.props.images.map((img, i) => (i === index ? { ...img, ...patch } : img));
		onChange({ images: next });
	}

	function removeImage(index: number) {
		onChange({ images: block.props.images.filter((_, i) => i !== index) });
	}

	function moveImage(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= block.props.images.length) return;
		const next = [...block.props.images];
		[next[index], next[target]] = [next[target], next[index]];
		onChange({ images: next });
	}
</script>

<div class="wb-inspector">
	<label class="wb-field">
		<span>{$_('website.gallery_inspector.label_title')}</span>
		<input
			type="text"
			value={block.props.title}
			oninput={(e) => onChange({ title: e.currentTarget.value })}
			placeholder={$_('website.gallery_inspector.placeholder_title')}
		/>
	</label>

	<div
		class="wb-dropzone"
		role="button"
		tabindex="0"
		ondragover={(e) => e.preventDefault()}
		ondrop={onDrop}
		onclick={() => fileInput?.click()}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				fileInput?.click();
			}
		}}
	>
		{#if uploading}
			<span>{$_('website.gallery_inspector.uploading')}</span>
		{:else}
			<span>{$_('website.gallery_inspector.drop_hint')}</span>
		{/if}
	</div>
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		multiple
		style="display: none"
		onchange={onFileChange}
	/>

	{#if uploadError}
		<p class="wb-error">{uploadError}</p>
	{/if}

	<div class="wb-row">
		<label class="wb-field">
			<span>{$_('website.gallery_inspector.label_layout')}</span>
			<select
				value={block.props.layout}
				onchange={(e) => onChange({ layout: e.currentTarget.value as GalleryProps['layout'] })}
			>
				<option value="grid">{$_('website.gallery_inspector.layout_grid')}</option>
				<option value="masonry">{$_('website.gallery_inspector.layout_masonry')}</option>
			</select>
		</label>
		<label class="wb-field">
			<span>{$_('website.gallery_inspector.label_columns')}</span>
			<select
				value={String(block.props.columns)}
				onchange={(e) =>
					onChange({ columns: Number(e.currentTarget.value) as GalleryProps['columns'] })}
			>
				<option value="2">2</option>
				<option value="3">3</option>
				<option value="4">4</option>
			</select>
		</label>
	</div>

	<div class="wb-row">
		<label class="wb-field">
			<span>{$_('website.gallery_inspector.label_gap')}</span>
			<select
				value={block.props.gap}
				onchange={(e) => onChange({ gap: e.currentTarget.value as GalleryProps['gap'] })}
			>
				<option value="sm">{$_('website.gallery_inspector.gap_sm')}</option>
				<option value="md">{$_('website.gallery_inspector.gap_md')}</option>
				<option value="lg">{$_('website.gallery_inspector.gap_lg')}</option>
			</select>
		</label>
		<label class="wb-checkbox">
			<input
				type="checkbox"
				checked={block.props.lightbox}
				onchange={(e) => onChange({ lightbox: e.currentTarget.checked })}
			/>
			<span>{$_('website.gallery_inspector.label_lightbox')}</span>
		</label>
	</div>

	<div class="wb-images">
		<div class="wb-images__head">
			{$_('website.gallery_inspector.images_count', {
				values: { count: block.props.images.length },
			})}
		</div>
		{#each block.props.images as img, i (i)}
			<div class="wb-image-row">
				<img src={img.url} alt={img.altText} class="wb-image-row__thumb" />
				<div class="wb-image-row__fields">
					<input
						type="text"
						value={img.altText}
						oninput={(e) => updateImage(i, { altText: e.currentTarget.value })}
						placeholder={$_('website.gallery_inspector.placeholder_alt')}
					/>
					<input
						type="text"
						value={img.caption}
						oninput={(e) => updateImage(i, { caption: e.currentTarget.value })}
						placeholder={$_('website.gallery_inspector.placeholder_caption')}
					/>
				</div>
				<div class="wb-image-row__actions">
					<button class="wb-btn wb-btn--icon" onclick={() => moveImage(i, -1)} disabled={i === 0}>
						↑
					</button>
					<button
						class="wb-btn wb-btn--icon"
						onclick={() => moveImage(i, 1)}
						disabled={i === block.props.images.length - 1}>↓</button
					>
					<button class="wb-btn wb-btn--icon wb-btn--danger" onclick={() => removeImage(i)}
						>×</button
					>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.wb-inspector {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.wb-field,
	.wb-checkbox {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.wb-checkbox {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
	}
	.wb-field > span {
		font-size: 0.75rem;
		font-weight: 500;
		opacity: 0.7;
	}
	.wb-field input,
	.wb-field select,
	.wb-image-row input {
		width: 100%;
		padding: 0.4rem 0.55rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: inherit;
		font-size: 0.8125rem;
	}
	.wb-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.wb-dropzone {
		padding: 1rem;
		text-align: center;
		border: 1px dashed rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		cursor: pointer;
		opacity: 0.75;
	}
	.wb-dropzone:hover {
		background: rgba(99, 102, 241, 0.08);
		border-color: rgba(99, 102, 241, 0.4);
		opacity: 1;
	}
	.wb-images {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.wb-images__head {
		font-size: 0.75rem;
		font-weight: 500;
		opacity: 0.7;
	}
	.wb-image-row {
		display: grid;
		grid-template-columns: 3rem 1fr auto;
		gap: 0.5rem;
		align-items: start;
	}
	.wb-image-row__thumb {
		width: 3rem;
		height: 3rem;
		object-fit: cover;
		border-radius: 0.25rem;
		background: rgba(0, 0, 0, 0.2);
	}
	.wb-image-row__fields {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.wb-image-row__actions {
		display: flex;
		gap: 0.25rem;
	}
	.wb-btn {
		padding: 0.3rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		cursor: pointer;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: transparent;
		color: inherit;
		font-weight: 500;
	}
	.wb-btn--icon {
		width: 1.5rem;
		padding: 0;
		line-height: 1.3;
	}
	.wb-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.wb-btn--danger:hover:not(:disabled) {
		background: rgba(248, 113, 113, 0.15);
		border-color: rgba(248, 113, 113, 0.4);
		color: rgb(248, 113, 113);
	}
	.wb-error {
		margin: 0;
		padding: 0.4rem 0.6rem;
		background: rgba(248, 113, 113, 0.1);
		border: 1px solid rgba(248, 113, 113, 0.3);
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		color: rgb(248, 113, 113);
	}
</style>
