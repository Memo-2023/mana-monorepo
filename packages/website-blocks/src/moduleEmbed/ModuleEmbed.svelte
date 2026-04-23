<script lang="ts">
	import type { BlockRenderProps } from '../types';
	import type { ModuleEmbedProps } from './schema';

	let { block, mode }: BlockRenderProps<ModuleEmbedProps> = $props();

	const isEdit = $derived(mode === 'edit');
	const resolved = $derived(block.props.resolved);
	const items = $derived(resolved?.items ?? []);
</script>

<section
	class="wb-embed wb-embed--{block.props.layout}"
	data-source={block.props.source}
	data-mode={mode}
>
	<div class="wb-embed__inner">
		{#if block.props.title}
			<h2>{block.props.title}</h2>
		{/if}

		{#if !resolved && isEdit}
			<div class="wb-embed__placeholder">
				Nicht aufgelöst. Quelle: {block.props.source}
				{#if block.props.sourceId}
					({block.props.sourceId})
				{/if}. Beim Veröffentlichen werden die Inhalte gezogen.
			</div>
		{:else if resolved?.error}
			<div class="wb-embed__error">Einbettung fehlgeschlagen: {resolved.error}</div>
		{:else if items.length === 0}
			<div class="wb-embed__empty">Keine Inhalte gefunden.</div>
		{:else if block.props.layout === 'grid'}
			<div class="wb-embed__grid">
				{#each items as item, i (i)}
					<a class="wb-embed-card" href={item.href ?? '#'} class:is-static={!item.href}>
						{#if item.imageUrl}
							<img src={item.imageUrl} alt={item.title} loading="lazy" />
						{/if}
						<div class="wb-embed-card__body">
							<p class="wb-embed-card__title">{item.title}</p>
							{#if item.subtitle}
								<p class="wb-embed-card__subtitle">{item.subtitle}</p>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<ul class="wb-embed__list">
				{#each items as item, i (i)}
					<li class="wb-embed-row">
						{#if item.imageUrl}
							<img src={item.imageUrl} alt={item.title} loading="lazy" />
						{/if}
						<div>
							<a class="wb-embed-row__title" href={item.href ?? '#'}>{item.title}</a>
							{#if item.subtitle}
								<p>{item.subtitle}</p>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<style>
	.wb-embed {
		padding: 2rem 1.5rem;
		max-width: 72rem;
		margin: 0 auto;
	}
	.wb-embed__inner {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.wb-embed h2 {
		margin: 0;
		font-size: 1.5rem;
	}
	.wb-embed__placeholder,
	.wb-embed__error,
	.wb-embed__empty {
		padding: 2rem 1rem;
		text-align: center;
		border: 1px dashed rgba(127, 127, 127, 0.25);
		border-radius: 0.5rem;
		font-size: 0.9375rem;
	}
	.wb-embed__placeholder {
		opacity: 0.55;
		font-style: italic;
	}
	.wb-embed__error {
		border-color: rgba(248, 113, 113, 0.3);
		color: rgb(248, 113, 113);
	}
	.wb-embed__empty {
		opacity: 0.4;
	}

	.wb-embed__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
		gap: 1rem;
	}
	.wb-embed-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background: var(--wb-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--wb-border, rgba(127, 127, 127, 0.15));
		border-radius: var(--wb-radius, 0.5rem);
		color: inherit;
		text-decoration: none;
		overflow: hidden;
	}
	.wb-embed-card.is-static {
		pointer-events: none;
	}
	.wb-embed-card img {
		width: 100%;
		aspect-ratio: 4 / 3;
		object-fit: cover;
	}
	.wb-embed-card__body {
		padding: 0.5rem 0.75rem 0.875rem;
	}
	.wb-embed-card__title {
		margin: 0;
		font-weight: 500;
	}
	.wb-embed-card__subtitle {
		margin: 0.125rem 0 0;
		font-size: 0.8125rem;
		opacity: 0.7;
	}

	.wb-embed__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.wb-embed-row {
		display: grid;
		grid-template-columns: 4rem 1fr;
		gap: 0.75rem;
		padding: 0.625rem;
		background: var(--wb-surface, rgba(255, 255, 255, 0.04));
		border-radius: var(--wb-radius, 0.5rem);
	}
	.wb-embed-row img {
		width: 4rem;
		height: 4rem;
		object-fit: cover;
		border-radius: 0.25rem;
	}
	.wb-embed-row__title {
		color: inherit;
		font-weight: 500;
		text-decoration: none;
	}
	.wb-embed-row p {
		margin: 0.125rem 0 0;
		font-size: 0.8125rem;
		opacity: 0.7;
	}
</style>
