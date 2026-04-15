<script lang="ts">
	import { Plus, Trash } from '@mana/shared-icons';

	type FieldType = 'text' | 'number' | 'date' | 'select' | 'tags' | 'checkbox' | 'url' | 'currency';

	interface FieldDefinition {
		id: string;
		name: string;
		type: FieldType;
		required?: boolean;
		defaultValue?: unknown;
		options?: string[];
		currencyCode?: string;
		placeholder?: string;
		order: number;
	}

	interface Props {
		fields: FieldDefinition[];
		onchange: (fields: FieldDefinition[]) => void;
	}

	let { fields, onchange }: Props = $props();

	const fieldTypes: { value: FieldType; label: string }[] = [
		{ value: 'text', label: 'Text' },
		{ value: 'number', label: 'Zahl' },
		{ value: 'date', label: 'Datum' },
		{ value: 'select', label: 'Auswahl' },
		{ value: 'tags', label: 'Tags' },
		{ value: 'checkbox', label: 'Checkbox' },
		{ value: 'url', label: 'URL' },
		{ value: 'currency', label: 'Wahrung' },
	];

	function addField() {
		const newField: FieldDefinition = {
			id: crypto.randomUUID(),
			name: '',
			type: 'text',
			order: fields.length,
		};
		onchange([...fields, newField]);
	}

	function updateField(id: string, updates: Partial<FieldDefinition>) {
		onchange(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
	}

	function removeField(id: string) {
		onchange(fields.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i })));
	}

	function moveField(id: string, direction: 'up' | 'down') {
		const index = fields.findIndex((f) => f.id === id);
		if (index === -1) return;
		const newIndex = direction === 'up' ? index - 1 : index + 1;
		if (newIndex < 0 || newIndex >= fields.length) return;
		const newFields = [...fields];
		[newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
		onchange(newFields.map((f, i) => ({ ...f, order: i })));
	}

	let newOption = $state('');

	function addOption(fieldId: string) {
		if (!newOption.trim()) return;
		const field = fields.find((f) => f.id === fieldId);
		if (!field) return;
		updateField(fieldId, { options: [...(field.options || []), newOption.trim()] });
		newOption = '';
	}

	function removeOption(fieldId: string, index: number) {
		const field = fields.find((f) => f.id === fieldId);
		if (!field) return;
		updateField(fieldId, { options: field.options?.filter((_, i) => i !== index) });
	}

	const inputClass =
		'w-full rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-input))] px-3 py-2 text-sm text-[hsl(var(--color-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))]';
</script>

<div class="space-y-3">
	{#each fields.sort((a, b) => a.order - b.order) as field, index (field.id)}
		<div
			class="rounded-lg border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-3"
		>
			<div class="flex items-start gap-2">
				<!-- Reorder buttons -->
				<div class="flex flex-col gap-0.5 pt-1">
					<button
						type="button"
						onclick={() => moveField(field.id, 'up')}
						disabled={index === 0}
						class="text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))] disabled:opacity-30"
						>&#9650;</button
					>
					<button
						type="button"
						onclick={() => moveField(field.id, 'down')}
						disabled={index === fields.length - 1}
						class="text-[hsl(var(--color-muted-foreground))] hover:text-[hsl(var(--color-foreground))] disabled:opacity-30"
						>&#9660;</button
					>
				</div>

				<!-- Field config -->
				<div class="flex-1 space-y-2">
					<div class="flex gap-2">
						<input
							type="text"
							value={field.name}
							placeholder="Feldname"
							class="{inputClass} flex-1"
							oninput={(e) => updateField(field.id, { name: (e.target as HTMLInputElement).value })}
						/>
						<select
							value={field.type}
							class="{inputClass} w-32"
							onchange={(e) =>
								updateField(field.id, { type: (e.target as HTMLSelectElement).value as FieldType })}
						>
							{#each fieldTypes as ft}
								<option value={ft.value}>{ft.label}</option>
							{/each}
						</select>
					</div>

					<div class="flex items-center gap-4">
						<label
							class="flex items-center gap-1 text-xs text-[hsl(var(--color-muted-foreground))]"
						>
							<input
								type="checkbox"
								checked={field.required || false}
								onchange={(e) =>
									updateField(field.id, { required: (e.target as HTMLInputElement).checked })}
								class="h-3 w-3"
							/>
							Pflichtfeld
						</label>

						<input
							type="text"
							value={field.placeholder || ''}
							placeholder="Platzhalter (optional)"
							class="{inputClass} flex-1 text-xs"
							oninput={(e) =>
								updateField(field.id, {
									placeholder: (e.target as HTMLInputElement).value || undefined,
								})}
						/>
					</div>

					<!-- Currency code for currency fields -->
					{#if field.type === 'currency'}
						<input
							type="text"
							value={field.currencyCode || 'EUR'}
							placeholder="Wahrungscode (z.B. EUR)"
							class="{inputClass} text-xs"
							oninput={(e) =>
								updateField(field.id, { currencyCode: (e.target as HTMLInputElement).value })}
						/>
					{/if}

					<!-- Options for select fields -->
					{#if field.type === 'select'}
						<div class="space-y-1">
							<div class="flex flex-wrap gap-1">
								{#each field.options || [] as option, i}
									<span
										class="inline-flex items-center gap-1 rounded bg-[hsl(var(--color-muted))] px-2 py-0.5 text-xs"
									>
										{option}
										<button
											type="button"
											onclick={() => removeOption(field.id, i)}
											class="text-[hsl(var(--color-muted-foreground))] hover:text-red-500">x</button
										>
									</span>
								{/each}
							</div>
							<div class="flex gap-1">
								<input
									type="text"
									bind:value={newOption}
									placeholder="Neue Option"
									class="{inputClass} flex-1 text-xs"
									onkeydown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											addOption(field.id);
										}
									}}
								/>
								<button
									type="button"
									onclick={() => addOption(field.id)}
									class="rounded bg-[hsl(var(--color-primary))] px-2 py-1 text-xs text-[hsl(var(--color-primary-foreground))]"
									>+</button
								>
							</div>
						</div>
					{/if}
				</div>

				<!-- Delete button -->
				<button
					type="button"
					onclick={() => removeField(field.id)}
					class="mt-1 text-[hsl(var(--color-muted-foreground))] hover:text-red-500"
					title="Feld entfernen"
				>
					<Trash size={20} />
				</button>
			</div>
		</div>
	{/each}

	<button
		type="button"
		onclick={addField}
		class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[hsl(var(--color-border))] py-3 text-sm text-[hsl(var(--color-muted-foreground))] transition-colors hover:border-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-primary))]"
	>
		<Plus size={20} />
		Feld hinzufugen
	</button>
</div>
