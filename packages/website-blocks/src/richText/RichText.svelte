<script lang="ts">
	import type { BlockRenderProps } from '../types';
	import type { RichTextProps } from './schema';

	let { block, mode }: BlockRenderProps<RichTextProps> = $props();

	const paragraphs = $derived(
		block.props.content
			.split(/\n{2,}/)
			.map((p) => p.trim())
			.filter((p) => p.length > 0)
	);

	const isEdit = $derived(mode === 'edit');
</script>

<section
	class="wb-richtext"
	class:wb-richtext--left={block.props.align === 'left'}
	class:wb-richtext--center={block.props.align === 'center'}
	class:wb-richtext--sm={block.props.size === 'sm'}
	class:wb-richtext--md={block.props.size === 'md'}
	class:wb-richtext--lg={block.props.size === 'lg'}
	data-mode={mode}
>
	<div class="wb-richtext__inner">
		{#if paragraphs.length === 0 && isEdit}
			<p class="wb-placeholder">Leerer Text — öffne den Inspector und fang an zu schreiben.</p>
		{:else}
			{#each paragraphs as paragraph, i (i)}
				<p>{paragraph}</p>
			{/each}
		{/if}
	</div>
</section>

<style>
	.wb-richtext {
		padding: 2rem 1.5rem;
		display: flex;
		justify-content: center;
	}
	.wb-richtext__inner {
		max-width: 48rem;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.wb-richtext--left .wb-richtext__inner {
		text-align: left;
	}
	.wb-richtext--center .wb-richtext__inner {
		text-align: center;
	}
	.wb-richtext p {
		margin: 0;
		line-height: 1.65;
	}
	.wb-richtext--sm p {
		font-size: 0.9375rem;
	}
	.wb-richtext--md p {
		font-size: 1.0625rem;
	}
	.wb-richtext--lg p {
		font-size: 1.25rem;
	}
	.wb-placeholder {
		opacity: 0.35;
		font-style: italic;
	}
</style>
