<script lang="ts">
	import type { BlockRenderProps } from '../types';
	import type { ImageProps } from './schema';

	let { block, mode }: BlockRenderProps<ImageProps> = $props();

	const isEdit = $derived(mode === 'edit');

	const aspectStyle = $derived.by(() => {
		const a = block.props.aspectRatio;
		if (a === 'auto') return '';
		const [w, h] = a.split(':').map(Number);
		return `aspect-ratio: ${w} / ${h};`;
	});
</script>

<figure
	class="wb-image"
	class:wb-image--narrow={block.props.width === 'narrow'}
	class:wb-image--container={block.props.width === 'container'}
	class:wb-image--full={block.props.width === 'full'}
	data-mode={mode}
>
	{#if block.props.url}
		<div
			class="wb-image__frame"
			class:wb-image__frame--cover={block.props.fit === 'cover'}
			class:wb-image__frame--contain={block.props.fit === 'contain'}
			style={aspectStyle}
		>
			<img src={block.props.url} alt={block.props.altText} loading="lazy" />
		</div>
	{:else if isEdit}
		<div class="wb-image__placeholder">
			<span>Lade im Inspector ein Bild hoch oder setze eine URL.</span>
		</div>
	{/if}

	{#if block.props.caption}
		<figcaption>{block.props.caption}</figcaption>
	{/if}
</figure>

<style>
	.wb-image {
		margin: 0;
		padding: 1rem 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.wb-image--narrow .wb-image__frame {
		max-width: 32rem;
	}
	.wb-image--container .wb-image__frame {
		max-width: 64rem;
	}
	.wb-image--full {
		padding: 0;
	}
	.wb-image--full .wb-image__frame {
		max-width: 100%;
		width: 100%;
	}
	.wb-image__frame {
		width: 100%;
		overflow: hidden;
		background: rgba(0, 0, 0, 0.04);
	}
	.wb-image__frame img {
		width: 100%;
		height: 100%;
		display: block;
	}
	.wb-image__frame--cover img {
		object-fit: cover;
	}
	.wb-image__frame--contain img {
		object-fit: contain;
	}
	.wb-image__placeholder {
		width: 100%;
		max-width: 32rem;
		padding: 3rem 1rem;
		text-align: center;
		border: 1px dashed rgba(255, 255, 255, 0.15);
		border-radius: 0.5rem;
		color: inherit;
		opacity: 0.45;
		font-style: italic;
	}
	figcaption {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		opacity: 0.7;
		text-align: center;
	}
</style>
