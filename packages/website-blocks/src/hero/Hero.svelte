<script lang="ts">
	import type { BlockRenderProps } from '../types';
	import type { HeroProps } from './schema';

	let { block, mode }: BlockRenderProps<HeroProps> = $props();

	const isEdit = $derived(mode === 'edit');
</script>

<section
	class="wb-hero"
	class:wb-hero--left={block.props.align === 'left'}
	class:wb-hero--center={block.props.align === 'center'}
	class:wb-hero--bg-subtle={block.props.background === 'subtle'}
	class:wb-hero--bg-gradient={block.props.background === 'gradient'}
	data-mode={mode}
>
	<div class="wb-hero__inner">
		{#if block.props.eyebrow}
			<p class="wb-hero__eyebrow">{block.props.eyebrow}</p>
		{:else if isEdit}
			<p class="wb-hero__eyebrow wb-placeholder">Eyebrow (optional)</p>
		{/if}

		<h1 class="wb-hero__title">
			{block.props.title || (isEdit ? 'Klick in den Inspector, um den Titel zu setzen' : '')}
		</h1>

		{#if block.props.subtitle}
			<p class="wb-hero__subtitle">{block.props.subtitle}</p>
		{:else if isEdit}
			<p class="wb-hero__subtitle wb-placeholder">Untertitel (optional)</p>
		{/if}

		{#if block.props.ctaLabel && block.props.ctaHref}
			<a class="wb-hero__cta" href={block.props.ctaHref}>{block.props.ctaLabel}</a>
		{:else if isEdit && (block.props.ctaLabel || block.props.ctaHref)}
			<span class="wb-hero__cta wb-placeholder" aria-disabled="true">
				{block.props.ctaLabel || 'Call-to-Action Label fehlt'}
			</span>
		{/if}
	</div>
</section>

<style>
	.wb-hero {
		padding: 4rem 1.5rem;
		display: flex;
		justify-content: center;
	}
	.wb-hero--bg-subtle {
		background: rgba(255, 255, 255, 0.04);
	}
	.wb-hero--bg-gradient {
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(168, 85, 247, 0.18));
	}
	.wb-hero__inner {
		max-width: 64rem;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.wb-hero--center .wb-hero__inner {
		align-items: center;
		text-align: center;
	}
	.wb-hero--left .wb-hero__inner {
		align-items: flex-start;
		text-align: left;
	}
	.wb-hero__eyebrow {
		font-size: 0.875rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.7;
		margin: 0;
	}
	.wb-hero__title {
		font-size: clamp(2rem, 5vw, 3.5rem);
		line-height: 1.1;
		margin: 0;
	}
	.wb-hero__subtitle {
		font-size: 1.125rem;
		line-height: 1.5;
		opacity: 0.8;
		max-width: 48rem;
		margin: 0;
	}
	.wb-hero__cta {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		border-radius: 9999px;
		background: rgba(99, 102, 241, 0.9);
		color: white;
		text-decoration: none;
		font-weight: 500;
		margin-top: 0.5rem;
	}
	.wb-placeholder {
		opacity: 0.35;
		font-style: italic;
	}
</style>
