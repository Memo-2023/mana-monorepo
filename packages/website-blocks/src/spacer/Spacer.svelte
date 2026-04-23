<script lang="ts">
	import type { BlockRenderProps } from '../types';
	import type { SpacerProps } from './schema';

	let { block, mode }: BlockRenderProps<SpacerProps> = $props();

	const isEdit = $derived(mode === 'edit');
</script>

<div
	class="wb-spacer"
	class:wb-spacer--sm={block.props.size === 'sm'}
	class:wb-spacer--md={block.props.size === 'md'}
	class:wb-spacer--lg={block.props.size === 'lg'}
	class:wb-spacer--xl={block.props.size === 'xl'}
	data-mode={mode}
>
	{#if isEdit}
		<span class="wb-spacer__label">Spacer ({block.props.size})</span>
	{/if}
</div>

<style>
	.wb-spacer {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.wb-spacer--sm {
		height: 1.5rem;
	}
	.wb-spacer--md {
		height: 3rem;
	}
	.wb-spacer--lg {
		height: 6rem;
	}
	.wb-spacer--xl {
		height: 9rem;
	}
	.wb-spacer[data-mode='edit'] {
		border: 1px dashed rgba(255, 255, 255, 0.1);
	}
	.wb-spacer__label {
		font-size: 0.75rem;
		opacity: 0.35;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}
</style>
