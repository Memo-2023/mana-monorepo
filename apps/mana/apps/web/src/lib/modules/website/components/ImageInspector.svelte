<script lang="ts">
	/**
	 * App-side image inspector with upload wired to mana-media. Replaces
	 * the URL-only fallback from @mana/website-blocks via the custom
	 * inspector registry (see inspector-overrides.ts).
	 */
	import { _ } from 'svelte-i18n';
	import type { BlockInspectorProps } from '@mana/website-blocks';
	import type { ImageProps } from '@mana/website-blocks';
	import { uploadImage, UploadError } from '../upload';

	let { block, onChange }: BlockInspectorProps<ImageProps> = $props();

	let uploading = $state(false);
	let uploadError = $state<string | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	async function handleFile(file: File) {
		uploading = true;
		uploadError = null;
		try {
			const result = await uploadImage(file);
			onChange({ url: result.url });
		} catch (err) {
			if (err instanceof UploadError) uploadError = err.message;
			else uploadError = err instanceof Error ? err.message : String(err);
		} finally {
			uploading = false;
		}
	}

	function onFileChange(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const file = target.files?.[0];
		if (file) void handleFile(file);
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		const file = e.dataTransfer?.files?.[0];
		if (file) void handleFile(file);
	}
</script>

<div class="wb-inspector">
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
			<span class="wb-dropzone__hint">{$_('website.image_inspector.uploading')}</span>
		{:else if block.props.url}
			<img src={block.props.url} alt={block.props.altText} class="wb-dropzone__preview" />
			<span class="wb-dropzone__hint">{$_('website.image_inspector.replace_hint')}</span>
		{:else}
			<span class="wb-dropzone__hint">{$_('website.image_inspector.drop_hint')}</span>
		{/if}
	</div>
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		style="display: none"
		onchange={onFileChange}
	/>

	{#if uploadError}
		<p class="wb-error">{uploadError}</p>
	{/if}

	<label class="wb-field">
		<span>{$_('website.image_inspector.label_url')}</span>
		<input
			type="url"
			value={block.props.url}
			oninput={(e) => onChange({ url: e.currentTarget.value })}
			placeholder="https://…"
		/>
	</label>

	<label class="wb-field">
		<span>{$_('website.image_inspector.label_alt')}</span>
		<input
			type="text"
			value={block.props.altText}
			oninput={(e) => onChange({ altText: e.currentTarget.value })}
			placeholder={$_('website.image_inspector.placeholder_alt')}
		/>
	</label>

	<label class="wb-field">
		<span>{$_('website.image_inspector.label_caption')}</span>
		<input
			type="text"
			value={block.props.caption}
			oninput={(e) => onChange({ caption: e.currentTarget.value })}
		/>
	</label>

	<div class="wb-row">
		<label class="wb-field">
			<span>{$_('website.image_inspector.label_aspect_ratio')}</span>
			<select
				value={block.props.aspectRatio}
				onchange={(e) =>
					onChange({ aspectRatio: e.currentTarget.value as ImageProps['aspectRatio'] })}
			>
				<option value="auto">{$_('website.image_inspector.aspect_auto')}</option>
				<option value="21:9">21:9</option>
				<option value="16:9">16:9</option>
				<option value="4:3">4:3</option>
				<option value="1:1">1:1</option>
			</select>
		</label>

		<label class="wb-field">
			<span>{$_('website.image_inspector.label_width')}</span>
			<select
				value={block.props.width}
				onchange={(e) => onChange({ width: e.currentTarget.value as ImageProps['width'] })}
			>
				<option value="narrow">{$_('website.image_inspector.width_narrow')}</option>
				<option value="container">{$_('website.image_inspector.width_container')}</option>
				<option value="full">{$_('website.image_inspector.width_full')}</option>
			</select>
		</label>
	</div>

	<label class="wb-field">
		<span>{$_('website.image_inspector.label_fit')}</span>
		<select
			value={block.props.fit}
			onchange={(e) => onChange({ fit: e.currentTarget.value as ImageProps['fit'] })}
		>
			<option value="cover">{$_('website.image_inspector.fit_cover')}</option>
			<option value="contain">{$_('website.image_inspector.fit_contain')}</option>
		</select>
	</label>
</div>

<style>
	.wb-inspector {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.wb-dropzone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1.5rem;
		border: 1px dashed rgba(255, 255, 255, 0.2);
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.02);
		cursor: pointer;
		min-height: 8rem;
	}
	.wb-dropzone:hover {
		background: rgba(99, 102, 241, 0.08);
		border-color: rgba(99, 102, 241, 0.4);
	}
	.wb-dropzone__hint {
		font-size: 0.8125rem;
		opacity: 0.6;
	}
	.wb-dropzone__preview {
		max-width: 100%;
		max-height: 8rem;
		object-fit: contain;
		border-radius: 0.25rem;
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
