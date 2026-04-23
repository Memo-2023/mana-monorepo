<script lang="ts">
	import type { BlockInspectorProps } from '../types';
	import type { CtaProps } from './schema';

	let { block, onChange }: BlockInspectorProps<CtaProps> = $props();
</script>

<div class="wb-inspector">
	<label class="wb-field">
		<span>Titel</span>
		<input
			type="text"
			value={block.props.title}
			oninput={(e) => onChange({ title: e.currentTarget.value })}
		/>
	</label>

	<label class="wb-field">
		<span>Beschreibung</span>
		<textarea
			rows="3"
			value={block.props.description}
			oninput={(e) => onChange({ description: e.currentTarget.value })}
		></textarea>
	</label>

	<div class="wb-row">
		<label class="wb-field">
			<span>Button-Label *</span>
			<input
				type="text"
				value={block.props.buttonLabel}
				oninput={(e) => onChange({ buttonLabel: e.currentTarget.value })}
			/>
		</label>
		<label class="wb-field">
			<span>Button-Link</span>
			<input
				type="text"
				value={block.props.buttonHref}
				oninput={(e) => onChange({ buttonHref: e.currentTarget.value })}
				placeholder="https://… oder /kontakt"
			/>
		</label>
	</div>

	<div class="wb-row">
		<label class="wb-field">
			<span>Variante</span>
			<select
				value={block.props.variant}
				onchange={(e) => onChange({ variant: e.currentTarget.value as CtaProps['variant'] })}
			>
				<option value="primary">Primär</option>
				<option value="secondary">Sekundär</option>
				<option value="ghost">Ghost</option>
			</select>
		</label>

		<label class="wb-field">
			<span>Ausrichtung</span>
			<select
				value={block.props.align}
				onchange={(e) => onChange({ align: e.currentTarget.value as CtaProps['align'] })}
			>
				<option value="center">Zentriert</option>
				<option value="left">Linksbündig</option>
			</select>
		</label>
	</div>

	<label class="wb-field">
		<span>Hintergrund</span>
		<select
			value={block.props.background}
			onchange={(e) => onChange({ background: e.currentTarget.value as CtaProps['background'] })}
		>
			<option value="none">Kein</option>
			<option value="subtle">Dezent</option>
			<option value="primary">Primärfarbe</option>
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
	}
	.wb-field input,
	.wb-field select,
	.wb-field textarea {
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
		min-height: 4.5rem;
	}
	.wb-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
</style>
