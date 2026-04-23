<script lang="ts">
	/**
	 * URL-only fallback inspector — shipped with the block so it works
	 * when consumers import the registry without wiring upload. The
	 * main Mana editor replaces this via registry override with an
	 * upload-enabled version.
	 */
	import type { BlockInspectorProps } from '../types';
	import type { ImageProps } from './schema';

	let { block, onChange }: BlockInspectorProps<ImageProps> = $props();
</script>

<div class="wb-inspector">
	<label class="wb-field">
		<span>Bild-URL</span>
		<input
			type="url"
			value={block.props.url}
			oninput={(e) => onChange({ url: e.currentTarget.value })}
			placeholder="https://…"
		/>
	</label>

	<label class="wb-field">
		<span>Alt-Text</span>
		<input
			type="text"
			value={block.props.altText}
			oninput={(e) => onChange({ altText: e.currentTarget.value })}
			placeholder="Beschreibung für Screenreader"
		/>
	</label>

	<label class="wb-field">
		<span>Bildunterschrift</span>
		<input
			type="text"
			value={block.props.caption}
			oninput={(e) => onChange({ caption: e.currentTarget.value })}
		/>
	</label>

	<div class="wb-row">
		<label class="wb-field">
			<span>Seitenverhältnis</span>
			<select
				value={block.props.aspectRatio}
				onchange={(e) =>
					onChange({ aspectRatio: e.currentTarget.value as ImageProps['aspectRatio'] })}
			>
				<option value="auto">Auto</option>
				<option value="21:9">21:9</option>
				<option value="16:9">16:9</option>
				<option value="4:3">4:3</option>
				<option value="1:1">1:1</option>
			</select>
		</label>

		<label class="wb-field">
			<span>Breite</span>
			<select
				value={block.props.width}
				onchange={(e) => onChange({ width: e.currentTarget.value as ImageProps['width'] })}
			>
				<option value="narrow">Schmal</option>
				<option value="container">Container</option>
				<option value="full">Vollbreit</option>
			</select>
		</label>
	</div>

	<label class="wb-field">
		<span>Füllung</span>
		<select
			value={block.props.fit}
			onchange={(e) => onChange({ fit: e.currentTarget.value as ImageProps['fit'] })}
		>
			<option value="cover">Zuschneiden</option>
			<option value="contain">Einpassen</option>
		</select>
	</label>
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
		letter-spacing: 0.02em;
	}
	.wb-field input,
	.wb-field select {
		width: 100%;
		padding: 0.5rem 0.625rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: inherit;
		font-family: inherit;
		font-size: 0.875rem;
	}
	.wb-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
</style>
