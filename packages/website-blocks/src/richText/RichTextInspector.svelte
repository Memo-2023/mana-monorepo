<script lang="ts">
	import type { BlockInspectorProps } from '../types';
	import type { RichTextProps } from './schema';

	let { block, onChange }: BlockInspectorProps<RichTextProps> = $props();
</script>

<div class="wb-inspector">
	<label class="wb-field">
		<span>Text</span>
		<textarea
			rows="10"
			value={block.props.content}
			oninput={(e) => onChange({ content: e.currentTarget.value })}
			placeholder="Leere Zeile = neuer Absatz. Markdown folgt in M3."
		></textarea>
	</label>

	<div class="wb-row">
		<label class="wb-field">
			<span>Ausrichtung</span>
			<select
				value={block.props.align}
				onchange={(e) => onChange({ align: e.currentTarget.value as RichTextProps['align'] })}
			>
				<option value="left">Linksbündig</option>
				<option value="center">Zentriert</option>
			</select>
		</label>

		<label class="wb-field">
			<span>Schriftgröße</span>
			<select
				value={block.props.size}
				onchange={(e) => onChange({ size: e.currentTarget.value as RichTextProps['size'] })}
			>
				<option value="sm">Klein</option>
				<option value="md">Normal</option>
				<option value="lg">Groß</option>
			</select>
		</label>
	</div>
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
	.wb-field textarea,
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
	.wb-field textarea {
		resize: vertical;
		min-height: 6rem;
	}
	.wb-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
</style>
