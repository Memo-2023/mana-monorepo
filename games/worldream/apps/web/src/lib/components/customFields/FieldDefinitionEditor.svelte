<script lang="ts">
	import type { CustomFieldDefinition, FieldType, FieldConfig } from '$lib/types/customFields';
	import { createFieldDefinition, validateFieldKey } from '$lib/types/customFields';

	interface Props {
		field?: CustomFieldDefinition;
		onSave: (field: CustomFieldDefinition) => void;
		onCancel: () => void;
		existingKeys?: string[];
	}

	let { field, onSave, onCancel, existingKeys = [] }: Props = $props();

	// Initialize form values
	let editingField = $state<CustomFieldDefinition>(field || createFieldDefinition('', '', 'text'));

	let keyError = $state('');
	let labelError = $state('');

	// Field type options
	const fieldTypes: Array<{ value: FieldType; label: string; icon: string }> = [
		{ value: 'text', label: 'Text', icon: '📝' },
		{ value: 'number', label: 'Zahl', icon: '🔢' },
		{ value: 'range', label: 'Bereich', icon: '📊' },
		{ value: 'select', label: 'Auswahl', icon: '📋' },
		{ value: 'multiselect', label: 'Mehrfachauswahl', icon: '☑️' },
		{ value: 'boolean', label: 'Ja/Nein', icon: '✓' },
		{ value: 'date', label: 'Datum', icon: '📅' },
		{ value: 'formula', label: 'Formel', icon: '🧮' },
		{ value: 'reference', label: 'Referenz', icon: '🔗' },
		{ value: 'list', label: 'Liste', icon: '📚' },
		{ value: 'json', label: 'JSON', icon: '{}' },
	];

	// Choice management for select/multiselect
	let newChoiceLabel = $state('');
	let newChoiceValue = $state('');

	function addChoice() {
		if (!newChoiceLabel || !newChoiceValue) return;

		if (!editingField.config.choices) {
			editingField.config.choices = [];
		}

		editingField.config.choices = [
			...editingField.config.choices,
			{ label: newChoiceLabel, value: newChoiceValue },
		];

		newChoiceLabel = '';
		newChoiceValue = '';
	}

	function removeChoice(index: number) {
		if (editingField.config.choices) {
			editingField.config.choices = editingField.config.choices.filter((_, i) => i !== index);
		}
	}

	// Validation
	function validateField(): boolean {
		let isValid = true;

		// Validate key
		if (!editingField.key) {
			keyError = 'Schlüssel ist erforderlich';
			isValid = false;
		} else if (!validateFieldKey(editingField.key)) {
			keyError =
				'Schlüssel muss kleingeschrieben sein, mit Buchstaben beginnen und nur Buchstaben, Zahlen und Unterstriche enthalten';
			isValid = false;
		} else if (!field && existingKeys.includes(editingField.key)) {
			keyError = 'Dieser Schlüssel existiert bereits';
			isValid = false;
		} else {
			keyError = '';
		}

		// Validate label
		if (!editingField.label) {
			labelError = 'Bezeichnung ist erforderlich';
			isValid = false;
		} else {
			labelError = '';
		}

		// Type-specific validation
		if (editingField.type === 'select' || editingField.type === 'multiselect') {
			if (!editingField.config.choices || editingField.config.choices.length === 0) {
				isValid = false;
			}
		}

		if (editingField.type === 'formula' && !editingField.config.formula) {
			isValid = false;
		}

		return isValid;
	}

	function handleSave() {
		if (validateField()) {
			onSave(editingField);
		}
	}

	// Update config when type changes
	$effect(() => {
		// Reset config when type changes
		if (!field) {
			editingField.config = getDefaultConfig(editingField.type);
		}
	});

	function getDefaultConfig(type: FieldType): FieldConfig {
		switch (type) {
			case 'number':
			case 'range':
				return { min: 0, max: 100, default: 0 };
			case 'select':
			case 'multiselect':
				return { choices: [] };
			case 'text':
				return { multiline: false, maxLength: 255 };
			case 'formula':
				return { formula: '', dependencies: [] };
			case 'reference':
				return { reference_type: 'character', multiple: false };
			case 'list':
				return { item_type: 'text', max_items: 10 };
			default:
				return {};
		}
	}
</script>

<div class="field-editor bg-theme-elevated rounded-lg p-6">
	<h3 class="text-lg font-semibold mb-4">
		{field ? 'Feld bearbeiten' : 'Neues Feld erstellen'}
	</h3>

	<div class="space-y-4">
		<!-- Field Key -->
		<div>
			<label for="field-key" class="block text-sm font-medium mb-1">
				Schlüssel <span class="text-theme-error">*</span>
			</label>
			<input
				id="field-key"
				type="text"
				bind:value={editingField.key}
				disabled={!!field}
				placeholder="z.B. strength, health_points"
				class="w-full px-3 py-2 border rounded-md {keyError
					? 'border-theme-error'
					: 'border-theme-border-default'} 
					bg-theme-surface disabled:opacity-50"
			/>
			{#if keyError}
				<p class="text-sm text-theme-error mt-1">{keyError}</p>
			{/if}
			<p class="text-xs text-theme-text-secondary mt-1">
				Eindeutiger Bezeichner für das Feld (kann nicht geändert werden)
			</p>
		</div>

		<!-- Field Label -->
		<div>
			<label for="field-label" class="block text-sm font-medium mb-1">
				Bezeichnung <span class="text-theme-error">*</span>
			</label>
			<input
				id="field-label"
				type="text"
				bind:value={editingField.label}
				placeholder="z.B. Stärke, Lebenspunkte"
				class="w-full px-3 py-2 border rounded-md {labelError
					? 'border-theme-error'
					: 'border-theme-border-default'} 
					bg-theme-surface"
			/>
			{#if labelError}
				<p class="text-sm text-theme-error mt-1">{labelError}</p>
			{/if}
		</div>

		<!-- Field Type -->
		<div>
			<label for="field-type" class="block text-sm font-medium mb-1">
				Typ <span class="text-theme-error">*</span>
			</label>
			<select
				id="field-type"
				bind:value={editingField.type}
				disabled={!!field}
				class="w-full px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface disabled:opacity-50"
			>
				{#each fieldTypes as type}
					<option value={type.value}>
						{type.icon}
						{type.label}
					</option>
				{/each}
			</select>
		</div>

		<!-- Description -->
		<div>
			<label for="field-description" class="block text-sm font-medium mb-1"> Beschreibung </label>
			<textarea
				id="field-description"
				bind:value={editingField.description}
				placeholder="Optionale Beschreibung des Feldes"
				rows="2"
				class="w-full px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface"
			></textarea>
		</div>

		<!-- Category -->
		<div>
			<label for="field-category" class="block text-sm font-medium mb-1"> Kategorie </label>
			<input
				id="field-category"
				type="text"
				bind:value={editingField.category}
				placeholder="z.B. Attribute, Ressourcen, Kampf"
				class="w-full px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface"
			/>
		</div>

		<!-- Required -->
		<div class="flex items-center">
			<input
				id="field-required"
				type="checkbox"
				bind:checked={editingField.required}
				class="mr-2"
			/>
			<label for="field-required" class="text-sm"> Pflichtfeld </label>
		</div>

		<!-- Type-specific configuration -->
		{#if editingField.type === 'number' || editingField.type === 'range'}
			<div class="border-t pt-4 space-y-3">
				<h4 class="font-medium">Zahlen-Konfiguration</h4>
				<div class="grid grid-cols-3 gap-3">
					<div>
						<label class="block text-sm mb-1">Min</label>
						<input
							type="number"
							bind:value={editingField.config.min}
							class="w-full px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface"
						/>
					</div>
					<div>
						<label class="block text-sm mb-1">Max</label>
						<input
							type="number"
							bind:value={editingField.config.max}
							class="w-full px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface"
						/>
					</div>
					<div>
						<label class="block text-sm mb-1">Standard</label>
						<input
							type="number"
							bind:value={editingField.config.default}
							class="w-full px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface"
						/>
					</div>
				</div>
				<div>
					<label class="block text-sm mb-1">Einheit</label>
					<input
						type="text"
						bind:value={editingField.config.unit}
						placeholder="z.B. kg, km, %"
						class="w-full px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface"
					/>
				</div>
			</div>
		{/if}

		{#if editingField.type === 'text'}
			<div class="border-t pt-4 space-y-3">
				<h4 class="font-medium">Text-Konfiguration</h4>
				<div class="flex items-center">
					<input
						id="text-multiline"
						type="checkbox"
						bind:checked={editingField.config.multiline}
						class="mr-2"
					/>
					<label for="text-multiline" class="text-sm"> Mehrzeiliger Text </label>
				</div>
				<div>
					<label class="block text-sm mb-1">Max. Länge</label>
					<input
						type="number"
						bind:value={editingField.config.maxLength}
						placeholder="255"
						class="w-full px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface"
					/>
				</div>
			</div>
		{/if}

		{#if editingField.type === 'select' || editingField.type === 'multiselect'}
			<div class="border-t pt-4 space-y-3">
				<h4 class="font-medium">Auswahloptionen</h4>

				<!-- Add choice -->
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={newChoiceLabel}
						placeholder="Bezeichnung"
						class="flex-1 px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface"
					/>
					<input
						type="text"
						bind:value={newChoiceValue}
						placeholder="Wert"
						class="flex-1 px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface"
					/>
					<button
						onclick={addChoice}
						class="px-4 py-2 bg-theme-primary-600 text-white rounded-md hover:bg-theme-primary-700"
					>
						Hinzufügen
					</button>
				</div>

				<!-- Choice list -->
				{#if editingField.config.choices && editingField.config.choices.length > 0}
					<div class="space-y-2">
						{#each editingField.config.choices as choice, i}
							<div class="flex items-center justify-between p-2 bg-theme-surface rounded">
								<span>{choice.label} ({choice.value})</span>
								<button
									onclick={() => removeChoice(i)}
									class="text-theme-error hover:text-theme-error/80"
								>
									🗑️
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-theme-text-secondary">Noch keine Optionen hinzugefügt</p>
				{/if}
			</div>
		{/if}

		{#if editingField.type === 'formula'}
			<div class="border-t pt-4 space-y-3">
				<h4 class="font-medium">Formel-Konfiguration</h4>
				<div>
					<label class="block text-sm mb-1">Formel</label>
					<textarea
						bind:value={editingField.config.formula}
						placeholder="z.B. (strength + dexterity) / 2"
						rows="3"
						class="w-full px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface font-mono text-sm"
					></textarea>
					<p class="text-xs text-theme-text-secondary mt-1">
						Verwende andere Feldnamen in der Formel, z.B. strength, dexterity
					</p>
				</div>
			</div>
		{/if}

		{#if editingField.type === 'reference'}
			<div class="border-t pt-4 space-y-3">
				<h4 class="font-medium">Referenz-Konfiguration</h4>
				<div>
					<label class="block text-sm mb-1">Referenz-Typ</label>
					<select
						bind:value={editingField.config.reference_type}
						class="w-full px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface"
					>
						<option value="character">Charakter</option>
						<option value="object">Objekt</option>
						<option value="place">Ort</option>
						<option value="story">Geschichte</option>
						<option value="world">Welt</option>
					</select>
				</div>
				<div class="flex items-center">
					<input
						id="ref-multiple"
						type="checkbox"
						bind:checked={editingField.config.multiple}
						class="mr-2"
					/>
					<label for="ref-multiple" class="text-sm"> Mehrere Referenzen erlauben </label>
				</div>
			</div>
		{/if}

		{#if editingField.type === 'list'}
			<div class="border-t pt-4 space-y-3">
				<h4 class="font-medium">Listen-Konfiguration</h4>
				<div>
					<label class="block text-sm mb-1">Element-Typ</label>
					<select
						bind:value={editingField.config.item_type}
						class="w-full px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface"
					>
						<option value="text">Text</option>
						<option value="number">Zahl</option>
						<option value="boolean">Ja/Nein</option>
						<option value="date">Datum</option>
					</select>
				</div>
				<div>
					<label class="block text-sm mb-1">Max. Elemente</label>
					<input
						type="number"
						bind:value={editingField.config.max_items}
						placeholder="10"
						class="w-full px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface"
					/>
				</div>
			</div>
		{/if}
	</div>

	<!-- Actions -->
	<div class="flex justify-end gap-3 mt-6 pt-4 border-t">
		<button
			onclick={onCancel}
			class="px-4 py-2 border border-theme-border-default rounded-md hover:bg-theme-elevated"
		>
			Abbrechen
		</button>
		<button
			onclick={handleSave}
			class="px-4 py-2 bg-theme-primary-600 text-white rounded-md hover:bg-theme-primary-700"
		>
			{field ? 'Speichern' : 'Feld hinzufügen'}
		</button>
	</div>
</div>
