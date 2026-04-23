<script lang="ts">
	import type { BlockInspectorProps } from '../types';
	import type { SpacerProps } from './schema';

	let { block, onChange }: BlockInspectorProps<SpacerProps> = $props();
</script>

<div class="wb-inspector">
	<label class="wb-field">
		<span>Größe</span>
		<select
			value={block.props.size}
			onchange={(e) => onChange({ size: e.currentTarget.value as SpacerProps['size'] })}
		>
			<option value="sm">Klein (1.5rem)</option>
			<option value="md">Mittel (3rem)</option>
			<option value="lg">Groß (6rem)</option>
			<option value="xl">Sehr groß (9rem)</option>
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
</style>
