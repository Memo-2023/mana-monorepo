<script lang="ts">
	import { getAllBlockSpecs } from '@mana/website-blocks';

	interface Props {
		onInsert: (type: string) => void;
	}

	let { onInsert }: Props = $props();

	const specs = getAllBlockSpecs();
</script>

<div class="wb-palette">
	<p class="wb-palette__label">Block einfügen</p>
	<div class="wb-palette__grid">
		{#each specs as spec (spec.type)}
			<button class="wb-palette__btn" onclick={() => onInsert(spec.type)} title={spec.label}>
				<span class="wb-palette__name">{spec.label}</span>
				<span class="wb-palette__category">{spec.category}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.wb-palette {
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.5rem;
	}
	.wb-palette__label {
		margin: 0 0 0.5rem;
		font-size: 0.7rem;
		font-weight: 500;
		opacity: 0.6;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.wb-palette__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr));
		gap: 0.5rem;
	}
	.wb-palette__btn {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.125rem;
		padding: 0.5rem 0.625rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.375rem;
		color: inherit;
		cursor: pointer;
		text-align: left;
		transition:
			background 0.12s,
			border-color 0.12s;
	}
	.wb-palette__btn:hover {
		background: rgba(99, 102, 241, 0.15);
		border-color: rgba(99, 102, 241, 0.4);
	}
	.wb-palette__name {
		font-size: 0.8125rem;
		font-weight: 500;
	}
	.wb-palette__category {
		font-size: 0.65rem;
		opacity: 0.5;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
</style>
