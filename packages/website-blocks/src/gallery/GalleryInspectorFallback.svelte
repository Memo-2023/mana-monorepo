<script lang="ts">
	/**
	 * URL-only fallback. The app-side inspector (with upload) overrides
	 * this via the custom-inspector registry — see
	 * apps/mana/apps/web/src/lib/modules/website/components/GalleryInspector.svelte
	 */
	import type { BlockInspectorProps } from '../types';
	import type { GalleryProps, GalleryImage } from './schema';

	let { block, onChange }: BlockInspectorProps<GalleryProps> = $props();

	function updateImage(index: number, patch: Partial<GalleryImage>) {
		const next = block.props.images.map((img, i) => (i === index ? { ...img, ...patch } : img));
		onChange({ images: next });
	}

	function addImage() {
		onChange({ images: [...block.props.images, { url: '', altText: '', caption: '' }] });
	}

	function removeImage(index: number) {
		onChange({ images: block.props.images.filter((_, i) => i !== index) });
	}
</script>

<div class="wb-inspector">
	<label class="wb-field">
		<span>Überschrift</span>
		<input
			type="text"
			value={block.props.title}
			oninput={(e) => onChange({ title: e.currentTarget.value })}
		/>
	</label>

	<div class="wb-row">
		<label class="wb-field">
			<span>Layout</span>
			<select
				value={block.props.layout}
				onchange={(e) => onChange({ layout: e.currentTarget.value as GalleryProps['layout'] })}
			>
				<option value="grid">Grid</option>
				<option value="masonry">Masonry</option>
			</select>
		</label>
		<label class="wb-field">
			<span>Spalten</span>
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

	<div class="wb-images">
		<div class="wb-images__head">
			<span>Bilder ({block.props.images.length})</span>
			<button class="wb-btn wb-btn--primary" onclick={addImage}>+ Bild</button>
		</div>

		{#each block.props.images as img, i (i)}
			<div class="wb-image-row">
				<input
					type="url"
					placeholder="https://…"
					value={img.url}
					oninput={(e) => updateImage(i, { url: e.currentTarget.value })}
				/>
				<input
					type="text"
					placeholder="Alt-Text"
					value={img.altText}
					oninput={(e) => updateImage(i, { altText: e.currentTarget.value })}
				/>
				<button class="wb-btn wb-btn--icon wb-btn--danger" onclick={() => removeImage(i)}>×</button>
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
	.wb-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.wb-field > span {
		font-size: 0.75rem;
		font-weight: 500;
		opacity: 0.7;
	}
	.wb-field input,
	.wb-field select {
		width: 100%;
		padding: 0.5rem 0.625rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: inherit;
		font-size: 0.875rem;
	}
	.wb-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.wb-images {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.wb-images__head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
		font-weight: 500;
		opacity: 0.7;
	}
	.wb-image-row {
		display: grid;
		grid-template-columns: 1fr 1fr auto;
		gap: 0.375rem;
	}
	.wb-image-row input {
		padding: 0.3rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: inherit;
		font-size: 0.8125rem;
	}
	.wb-btn {
		padding: 0.3rem 0.65rem;
		border-radius: 0.375rem;
		border: none;
		font-size: 0.75rem;
		cursor: pointer;
		font-weight: 500;
	}
	.wb-btn--primary {
		background: rgba(99, 102, 241, 0.85);
		color: white;
	}
	.wb-btn--icon {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: inherit;
		width: 1.75rem;
		padding: 0;
	}
	.wb-btn--danger:hover {
		background: rgba(248, 113, 113, 0.15);
		border-color: rgba(248, 113, 113, 0.4);
		color: rgb(248, 113, 113);
	}
</style>
