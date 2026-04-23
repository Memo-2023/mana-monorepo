<script lang="ts">
	import type { BlockRenderProps } from '../types';
	import type { CtaProps } from './schema';

	let { block, mode }: BlockRenderProps<CtaProps> = $props();

	const isEdit = $derived(mode === 'edit');
</script>

<section
	class="wb-cta"
	class:wb-cta--left={block.props.align === 'left'}
	class:wb-cta--center={block.props.align === 'center'}
	class:wb-cta--bg-subtle={block.props.background === 'subtle'}
	class:wb-cta--bg-primary={block.props.background === 'primary'}
	data-mode={mode}
>
	<div class="wb-cta__inner">
		{#if block.props.title}
			<h2>{block.props.title}</h2>
		{:else if isEdit}
			<h2 class="wb-placeholder">Titel im Inspector setzen</h2>
		{/if}

		{#if block.props.description}
			<p class="wb-cta__description">{block.props.description}</p>
		{/if}

		<a
			class="wb-cta__button wb-cta__button--{block.props.variant}"
			href={block.props.buttonHref || '#'}
		>
			{block.props.buttonLabel || (isEdit ? 'Button-Label fehlt' : '')}
		</a>
	</div>
</section>

<style>
	.wb-cta {
		padding: 3rem 1.5rem;
		display: flex;
		justify-content: center;
	}
	.wb-cta--bg-subtle {
		background: rgba(255, 255, 255, 0.04);
	}
	.wb-cta--bg-primary {
		background: var(--wb-primary, rgba(99, 102, 241, 0.9));
		color: white;
	}
	.wb-cta__inner {
		max-width: 42rem;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.wb-cta--center .wb-cta__inner {
		align-items: center;
		text-align: center;
	}
	.wb-cta--left .wb-cta__inner {
		align-items: flex-start;
		text-align: left;
	}
	.wb-cta h2 {
		margin: 0;
		font-size: 1.75rem;
		line-height: 1.2;
	}
	.wb-cta__description {
		margin: 0;
		font-size: 1rem;
		line-height: 1.5;
		opacity: 0.8;
	}
	.wb-cta__button {
		display: inline-block;
		padding: 0.625rem 1.25rem;
		border-radius: 9999px;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.9375rem;
		margin-top: 0.5rem;
	}
	.wb-cta__button--primary {
		background: var(--wb-primary, rgba(99, 102, 241, 0.9));
		color: white;
	}
	.wb-cta__button--secondary {
		background: rgba(255, 255, 255, 0.1);
		color: inherit;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}
	.wb-cta__button--ghost {
		background: transparent;
		color: inherit;
		border: 1px solid currentColor;
	}
	.wb-cta--bg-primary .wb-cta__button--primary {
		background: white;
		color: var(--wb-primary, rgb(99, 102, 241));
	}
	.wb-placeholder {
		opacity: 0.35;
		font-style: italic;
	}
</style>
