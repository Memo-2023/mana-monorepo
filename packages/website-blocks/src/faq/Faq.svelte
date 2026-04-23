<script lang="ts">
	import type { BlockRenderProps } from '../types';
	import type { FaqProps } from './schema';

	let { block, mode }: BlockRenderProps<FaqProps> = $props();

	const isEdit = $derived(mode === 'edit');
</script>

<section class="wb-faq" data-mode={mode}>
	<div class="wb-faq__inner">
		{#if block.props.title}
			<h2>{block.props.title}</h2>
		{/if}

		{#if block.props.items.length === 0 && isEdit}
			<p class="wb-placeholder">Füge Fragen im Inspector hinzu.</p>
		{:else}
			<div class="wb-faq__list">
				{#each block.props.items as item, i (i)}
					<details open={block.props.defaultOpen}>
						<summary>{item.question}</summary>
						<div class="wb-faq__answer">
							{#each item.answer.split(/\n{2,}/) as paragraph, j (j)}
								<p>{paragraph}</p>
							{/each}
						</div>
					</details>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	.wb-faq {
		padding: 3rem 1.5rem;
		display: flex;
		justify-content: center;
	}
	.wb-faq__inner {
		max-width: 48rem;
		width: 100%;
	}
	.wb-faq h2 {
		margin: 0 0 1.5rem;
		font-size: 1.75rem;
		line-height: 1.2;
	}
	.wb-faq__list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	details {
		border: 1px solid rgba(127, 127, 127, 0.2);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.02);
	}
	summary {
		cursor: pointer;
		font-weight: 500;
		font-size: 1rem;
		list-style: none;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	summary::after {
		content: '+';
		font-size: 1.25rem;
		opacity: 0.5;
		transition: transform 0.2s;
	}
	details[open] summary::after {
		content: '–';
		transform: rotate(180deg);
	}
	.wb-faq__answer {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(127, 127, 127, 0.1);
		opacity: 0.85;
	}
	.wb-faq__answer p {
		margin: 0 0 0.5rem;
		line-height: 1.5;
	}
	.wb-faq__answer p:last-child {
		margin-bottom: 0;
	}
	.wb-placeholder {
		opacity: 0.4;
		font-style: italic;
	}
</style>
