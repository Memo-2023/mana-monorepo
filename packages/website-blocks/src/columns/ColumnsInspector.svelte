<script lang="ts">
	import type { BlockInspectorProps } from '../types';
	import type { ColumnsProps } from './schema';

	let { block, onChange }: BlockInspectorProps<ColumnsProps> = $props();
</script>

<div class="wb-inspector">
	<label class="wb-field">
		<span>Spalten-Anzahl</span>
		<select
			value={String(block.props.count)}
			onchange={(e) => onChange({ count: Number(e.currentTarget.value) as ColumnsProps['count'] })}
		>
			<option value="2">2 Spalten</option>
			<option value="3">3 Spalten</option>
		</select>
	</label>

	<div class="wb-row">
		<label class="wb-field">
			<span>Abstand</span>
			<select
				value={block.props.gap}
				onchange={(e) => onChange({ gap: e.currentTarget.value as ColumnsProps['gap'] })}
			>
				<option value="sm">Klein</option>
				<option value="md">Mittel</option>
				<option value="lg">Groß</option>
			</select>
		</label>

		<label class="wb-field">
			<span>Vertikale Ausrichtung</span>
			<select
				value={block.props.align}
				onchange={(e) => onChange({ align: e.currentTarget.value as ColumnsProps['align'] })}
			>
				<option value="start">Oben</option>
				<option value="center">Mittig</option>
				<option value="stretch">Gestreckt</option>
			</select>
		</label>
	</div>

	<label class="wb-checkbox">
		<input
			type="checkbox"
			checked={block.props.stackOnMobile}
			onchange={(e) => onChange({ stackOnMobile: e.currentTarget.checked })}
		/>
		<span>Auf Mobile untereinander stapeln</span>
	</label>

	<p class="wb-hint">
		Blöcke in eine Spalte hinzufügen: wähle oben die "+" Palette und füge Block ein — neue Blöcke
		werden der zuletzt aktiven Spalte zugewiesen. (In M4 kommt pro-Spalte-Insert-UI.)
	</p>
</div>

<style>
	.wb-inspector {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.wb-field,
	.wb-checkbox {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.wb-checkbox {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8125rem;
	}
	.wb-field > span {
		font-size: 0.75rem;
		font-weight: 500;
		opacity: 0.7;
	}
	.wb-field select {
		width: 100%;
		padding: 0.5rem 0.625rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: inherit;
		font-size: 0.875rem;
	}
	.wb-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.wb-hint {
		margin: 0;
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 0.375rem;
		font-size: 0.75rem;
		opacity: 0.6;
		line-height: 1.4;
	}
</style>
