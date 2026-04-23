<script lang="ts">
	import type { BlockInspectorProps } from '../types';
	import type { FormProps, FormField } from './schema';

	let { block, onChange }: BlockInspectorProps<FormProps> = $props();

	const TYPE_LABELS: Record<FormField['type'], string> = {
		text: 'Text',
		email: 'E-Mail',
		tel: 'Telefon',
		url: 'URL',
		number: 'Zahl',
		textarea: 'Mehrzeilig',
	};

	function updateField(index: number, patch: Partial<FormField>) {
		const next = block.props.fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
		onChange({ fields: next });
	}

	function addField() {
		const existingNames = new Set(block.props.fields.map((f) => f.name));
		let counter = 1;
		let name = `feld_${counter}`;
		while (existingNames.has(name)) name = `feld_${++counter}`;
		const newField: FormField = {
			name,
			label: 'Neues Feld',
			type: 'text',
			required: false,
			placeholder: '',
			helpText: '',
			maxLength: 500,
		};
		onChange({ fields: [...block.props.fields, newField] });
	}

	function removeField(index: number) {
		onChange({ fields: block.props.fields.filter((_, i) => i !== index) });
	}

	function moveField(index: number, direction: -1 | 1) {
		const target = index + direction;
		if (target < 0 || target >= block.props.fields.length) return;
		const next = [...block.props.fields];
		[next[index], next[target]] = [next[target], next[index]];
		onChange({ fields: next });
	}
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
			<span>Submit-Button</span>
			<input
				type="text"
				value={block.props.submitLabel}
				oninput={(e) => onChange({ submitLabel: e.currentTarget.value })}
			/>
		</label>
		<label class="wb-field">
			<span>Ziel</span>
			<select disabled>
				<option>Inbox (Owner)</option>
			</select>
		</label>
	</div>

	<label class="wb-field">
		<span>Erfolgs-Nachricht</span>
		<input
			type="text"
			value={block.props.successMessage}
			oninput={(e) => onChange({ successMessage: e.currentTarget.value })}
		/>
	</label>

	<div class="wb-fields">
		<div class="wb-fields__head">
			<span>Felder ({block.props.fields.length})</span>
			<button class="wb-btn wb-btn--primary" onclick={addField}>+ Feld</button>
		</div>

		{#each block.props.fields as field, i (i)}
			<div class="wb-form-field">
				<div class="wb-form-field__head">
					<span class="wb-form-field__idx">#{i + 1}</span>
					<div class="wb-form-field__actions">
						<button class="wb-btn wb-btn--icon" onclick={() => moveField(i, -1)} disabled={i === 0}
							>↑</button
						>
						<button
							class="wb-btn wb-btn--icon"
							onclick={() => moveField(i, 1)}
							disabled={i === block.props.fields.length - 1}>↓</button
						>
						<button class="wb-btn wb-btn--icon wb-btn--danger" onclick={() => removeField(i)}>
							×
						</button>
					</div>
				</div>

				<div class="wb-row">
					<label class="wb-field">
						<span>Label</span>
						<input
							type="text"
							value={field.label}
							oninput={(e) => updateField(i, { label: e.currentTarget.value })}
						/>
					</label>
					<label class="wb-field">
						<span>Typ</span>
						<select
							value={field.type}
							onchange={(e) => updateField(i, { type: e.currentTarget.value as FormField['type'] })}
						>
							{#each Object.entries(TYPE_LABELS) as [value, label] (value)}
								<option {value}>{label}</option>
							{/each}
						</select>
					</label>
				</div>

				<div class="wb-row">
					<label class="wb-field">
						<span>Feld-Name (intern)</span>
						<input
							type="text"
							value={field.name}
							oninput={(e) => updateField(i, { name: e.currentTarget.value })}
							pattern="^[a-z][a-z0-9_]*$"
						/>
					</label>
					<label class="wb-checkbox">
						<input
							type="checkbox"
							checked={field.required}
							onchange={(e) => updateField(i, { required: e.currentTarget.checked })}
						/>
						<span>Pflicht</span>
					</label>
				</div>

				<label class="wb-field">
					<span>Placeholder</span>
					<input
						type="text"
						value={field.placeholder}
						oninput={(e) => updateField(i, { placeholder: e.currentTarget.value })}
					/>
				</label>
			</div>
		{/each}
	</div>
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
	.wb-field input,
	.wb-field select,
	.wb-field textarea {
		width: 100%;
		padding: 0.4rem 0.6rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: inherit;
		font-size: 0.8125rem;
		font-family: inherit;
	}
	.wb-field textarea {
		resize: vertical;
		min-height: 3.5rem;
	}
	.wb-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}
	.wb-fields {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.wb-fields__head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
		font-weight: 500;
		opacity: 0.7;
	}
	.wb-form-field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 0.5rem;
	}
	.wb-form-field__head {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.wb-form-field__idx {
		font-size: 0.7rem;
		opacity: 0.5;
	}
	.wb-form-field__actions {
		display: flex;
		gap: 0.25rem;
	}
	.wb-btn {
		padding: 0.3rem 0.65rem;
		border-radius: 0.375rem;
		border: none;
		font-size: 0.75rem;
		cursor: pointer;
		font-weight: 500;
	}
	.wb-btn--primary {
		background: rgba(99, 102, 241, 0.85);
		color: white;
	}
	.wb-btn--icon {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: inherit;
		width: 1.75rem;
		padding: 0;
		line-height: 1.3;
	}
	.wb-btn--icon:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.06);
	}
	.wb-btn--danger:hover:not(:disabled) {
		background: rgba(248, 113, 113, 0.15);
		border-color: rgba(248, 113, 113, 0.4);
		color: rgb(248, 113, 113);
	}
	.wb-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
</style>
