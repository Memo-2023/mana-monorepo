<script lang="ts">
	import type { BlockInspectorProps } from '../types';
	import type { HeroProps } from './schema';

	let { block, onChange }: BlockInspectorProps<HeroProps> = $props();
</script>

<div class="wb-inspector">
	<label class="wb-field">
		<span>Eyebrow</span>
		<input
			type="text"
			value={block.props.eyebrow}
			oninput={(e) => onChange({ eyebrow: e.currentTarget.value })}
			placeholder="Optional — kleiner Text über dem Titel"
		/>
	</label>

	<label class="wb-field">
		<span>Titel *</span>
		<input
			type="text"
			value={block.props.title}
			oninput={(e) => onChange({ title: e.currentTarget.value })}
			required
		/>
	</label>

	<label class="wb-field">
		<span>Untertitel</span>
		<textarea
			rows="3"
			value={block.props.subtitle}
			oninput={(e) => onChange({ subtitle: e.currentTarget.value })}
		></textarea>
	</label>

	<div class="wb-row">
		<label class="wb-field">
			<span>CTA Label</span>
			<input
				type="text"
				value={block.props.ctaLabel}
				oninput={(e) => onChange({ ctaLabel: e.currentTarget.value })}
				placeholder="z.B. Los geht's"
			/>
		</label>
		<label class="wb-field">
			<span>CTA Link</span>
			<input
				type="url"
				value={block.props.ctaHref}
				oninput={(e) => onChange({ ctaHref: e.currentTarget.value })}
				placeholder="https://…"
			/>
		</label>
	</div>

	<div class="wb-row">
		<label class="wb-field">
			<span>Ausrichtung</span>
			<select
				value={block.props.align}
				onchange={(e) => onChange({ align: e.currentTarget.value as HeroProps['align'] })}
			>
				<option value="center">Zentriert</option>
				<option value="left">Linksbündig</option>
			</select>
		</label>

		<label class="wb-field">
			<span>Hintergrund</span>
			<select
				value={block.props.background}
				onchange={(e) => onChange({ background: e.currentTarget.value as HeroProps['background'] })}
			>
				<option value="none">Kein</option>
				<option value="subtle">Dezent</option>
				<option value="gradient">Gradient</option>
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
	.wb-field input,
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
		min-height: 4.5rem;
	}
	.wb-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
</style>
