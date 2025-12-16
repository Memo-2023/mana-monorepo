<script lang="ts">
	import type {
		CustomFieldSchema,
		CustomFieldData,
		CustomFieldDefinition,
	} from '$lib/types/customFields';
	import { getDefaultValueForType } from '$lib/types/customFields';

	interface Props {
		schema: CustomFieldSchema;
		data?: CustomFieldData;
		readonly?: boolean;
		onChange?: (data: CustomFieldData) => void;
		onSave?: (data: CustomFieldData) => void;
	}

	let { schema, data = {}, readonly = false, onChange, onSave }: Props = $props();

	// Initialize form data with defaults
	let formData = $state<CustomFieldData>({ ...data });
	let isDirty = $state(false);
	let errors = $state<Record<string, string>>({});

	// Group fields by category
	let fieldsByCategory = $derived(() => {
		const categories = new Map<string, CustomFieldDefinition[]>();

		// Add uncategorized fields first
		const uncategorized = schema.fields.filter((f) => !f.category);
		if (uncategorized.length > 0) {
			categories.set('_uncategorized', uncategorized);
		}

		// Group by category
		for (const field of schema.fields) {
			if (field.category) {
				if (!categories.has(field.category)) {
					categories.set(field.category, []);
				}
				categories.get(field.category)!.push(field);
			}
		}

		return categories;
	});

	// Initialize missing fields with defaults
	$effect(() => {
		for (const field of schema.fields) {
			if (!(field.key in formData)) {
				formData[field.key] = getDefaultValueForType(field.type, field.config);
			}
		}
	});

	// Track changes
	function handleFieldChange(key: string, value: any) {
		formData = { ...formData, [key]: value };
		isDirty = true;
		errors = { ...errors, [key]: '' }; // Clear error on change

		if (onChange) {
			onChange(formData);
		}

		// Handle formula dependencies
		updateDependentFormulas(key);
	}

	// Update formulas that depend on changed field
	function updateDependentFormulas(changedKey: string) {
		for (const field of schema.fields) {
			if (field.type === 'formula' && field.config.dependencies?.includes(changedKey)) {
				// TODO: Recalculate formula
				// For now, just mark as needs recalculation
				formData[field.key] = `[Recalculating...]`;
			}
		}
	}

	// Validate field
	function validateField(field: CustomFieldDefinition, value: any): string | null {
		// Required validation
		if (field.required && (value === null || value === undefined || value === '')) {
			return `${field.label} ist erforderlich`;
		}

		// Type-specific validation
		switch (field.type) {
			case 'number':
			case 'range':
				if (value !== null && value !== undefined) {
					if (field.config.min !== undefined && value < field.config.min) {
						return `Mindestwert ist ${field.config.min}`;
					}
					if (field.config.max !== undefined && value > field.config.max) {
						return `Maximalwert ist ${field.config.max}`;
					}
				}
				break;

			case 'text':
				if (value && field.config.maxLength && value.length > field.config.maxLength) {
					return `Maximal ${field.config.maxLength} Zeichen`;
				}
				if (value && field.config.pattern) {
					const regex = new RegExp(field.config.pattern);
					if (!regex.test(value)) {
						return 'Ungültiges Format';
					}
				}
				break;

			case 'list':
				if (Array.isArray(value)) {
					if (field.config.min_items && value.length < field.config.min_items) {
						return `Mindestens ${field.config.min_items} Elemente erforderlich`;
					}
					if (field.config.max_items && value.length > field.config.max_items) {
						return `Maximal ${field.config.max_items} Elemente erlaubt`;
					}
				}
				break;
		}

		return null;
	}

	// Validate all fields
	function validateAll(): boolean {
		let isValid = true;
		const newErrors: Record<string, string> = {};

		for (const field of schema.fields) {
			const error = validateField(field, formData[field.key]);
			if (error) {
				newErrors[field.key] = error;
				isValid = false;
			}
		}

		errors = newErrors;
		return isValid;
	}

	// Handle save
	function handleSave() {
		if (validateAll() && onSave) {
			onSave(formData);
			isDirty = false;
		}
	}

	// Render field based on type
	function getFieldComponent(field: CustomFieldDefinition) {
		const value = formData[field.key];
		const error = errors[field.key];

		switch (field.type) {
			case 'text':
				return renderTextField(field, value, error);
			case 'number':
				return renderNumberField(field, value, error);
			case 'range':
				return renderRangeField(field, value, error);
			case 'select':
				return renderSelectField(field, value, error);
			case 'multiselect':
				return renderMultiselectField(field, value, error);
			case 'boolean':
				return renderBooleanField(field, value, error);
			case 'date':
				return renderDateField(field, value, error);
			case 'formula':
				return renderFormulaField(field, value, error);
			case 'list':
				return renderListField(field, value, error);
			case 'json':
				return renderJsonField(field, value, error);
			case 'reference':
				return renderReferenceField(field, value, error);
			default:
				return null;
		}
	}

	// Field renderers
	function renderTextField(field: CustomFieldDefinition, value: any, error: string | undefined) {
		if (field.config.multiline) {
			return `
				<textarea
					value="${value || ''}"
					onchange="this.dispatchEvent(new CustomEvent('fieldchange', { detail: this.value }))"
					${readonly ? 'disabled' : ''}
					placeholder="${field.config.placeholder || ''}"
					rows="3"
					class="w-full px-3 py-2 border ${error ? 'border-theme-error' : 'border-theme-border-default'} 
						rounded-md bg-theme-surface disabled:opacity-50"
				></textarea>
			`;
		}
		return `
			<input
				type="text"
				value="${value || ''}"
				onchange="this.dispatchEvent(new CustomEvent('fieldchange', { detail: this.value }))"
				${readonly ? 'disabled' : ''}
				placeholder="${field.config.placeholder || ''}"
				class="w-full px-3 py-2 border ${error ? 'border-theme-error' : 'border-theme-border-default'} 
					rounded-md bg-theme-surface disabled:opacity-50"
			/>
		`;
	}

	function renderNumberField(field: CustomFieldDefinition, value: any, error: string | undefined) {
		return `
			<div class="flex items-center gap-2">
				${field.display?.prefix ? `<span class="text-sm text-theme-text-secondary">${field.display.prefix}</span>` : ''}
				<input
					type="number"
					value="${value ?? field.config.default ?? ''}"
					min="${field.config.min ?? ''}"
					max="${field.config.max ?? ''}"
					step="${field.config.step ?? 1}"
					onchange="this.dispatchEvent(new CustomEvent('fieldchange', { detail: parseFloat(this.value) }))"
					${readonly ? 'disabled' : ''}
					class="flex-1 px-3 py-2 border ${error ? 'border-theme-error' : 'border-theme-border-default'}
						rounded-md bg-theme-surface disabled:opacity-50"
				/>
				${field.config.unit ? `<span class="text-sm text-theme-text-secondary">${field.config.unit}</span>` : ''}
			</div>
		`;
	}

	function renderRangeField(field: CustomFieldDefinition, value: any, error: string | undefined) {
		return `
			<div class="space-y-2">
				<div class="flex justify-between text-sm">
					<span>${field.config.min ?? 0}</span>
					<span class="font-medium">${value ?? field.config.default ?? 0}</span>
					<span>${field.config.max ?? 100}</span>
				</div>
				<input
					type="range"
					value="${value ?? field.config.default ?? 0}"
					min="${field.config.min ?? 0}"
					max="${field.config.max ?? 100}"
					step="${field.config.step ?? 1}"
					onchange="this.dispatchEvent(new CustomEvent('fieldchange', { detail: parseFloat(this.value) }))"
					${readonly ? 'disabled' : ''}
					class="w-full disabled:opacity-50"
				/>
			</div>
		`;
	}

	function renderSelectField(field: CustomFieldDefinition, value: any, error: string | undefined) {
		const choices = field.config.choices || [];
		return `
			<select
				onchange="this.dispatchEvent(new CustomEvent('fieldchange', { detail: this.value }))"
				${readonly ? 'disabled' : ''}
				class="w-full px-3 py-2 border ${error ? 'border-theme-error' : 'border-theme-border-default'} 
					rounded-md bg-theme-surface disabled:opacity-50"
			>
				<option value="">-- Wählen --</option>
				${choices
					.map(
						(choice) => `
					<option value="${choice.value}" ${value === choice.value ? 'selected' : ''}>
						${choice.label}
					</option>
				`
					)
					.join('')}
			</select>
		`;
	}

	function renderMultiselectField(
		field: CustomFieldDefinition,
		value: any,
		error: string | undefined
	) {
		const choices = field.config.choices || [];
		const selectedValues = Array.isArray(value) ? value : [];

		// For now, render as checkboxes
		return choices
			.map(
				(choice) => `
			<label class="flex items-center space-x-2">
				<input
					type="checkbox"
					value="${choice.value}"
					${selectedValues.includes(choice.value) ? 'checked' : ''}
					onchange="this.dispatchEvent(new CustomEvent('multiselectchange', { detail: { value: this.value, checked: this.checked } }))"
					${readonly ? 'disabled' : ''}
					class="disabled:opacity-50"
				/>
				<span class="text-sm">${choice.label}</span>
			</label>
		`
			)
			.join('');
	}

	function renderBooleanField(field: CustomFieldDefinition, value: any, error: string | undefined) {
		return `
			<label class="flex items-center space-x-2">
				<input
					type="checkbox"
					${value ? 'checked' : ''}
					onchange="this.dispatchEvent(new CustomEvent('fieldchange', { detail: this.checked }))"
					${readonly ? 'disabled' : ''}
					class="disabled:opacity-50"
				/>
				<span class="text-sm">Aktiviert</span>
			</label>
		`;
	}

	function renderDateField(field: CustomFieldDefinition, value: any, error: string | undefined) {
		return `
			<input
				type="date"
				value="${value || ''}"
				onchange="this.dispatchEvent(new CustomEvent('fieldchange', { detail: this.value }))"
				${readonly ? 'disabled' : ''}
				class="w-full px-3 py-2 border ${error ? 'border-theme-error' : 'border-theme-border-default'} 
					rounded-md bg-theme-surface disabled:opacity-50"
			/>
		`;
	}

	function renderFormulaField(field: CustomFieldDefinition, value: any, error: string | undefined) {
		return `
			<div class="p-3 bg-theme-elevated rounded-md">
				<div class="text-sm text-theme-text-secondary mb-1">
					Formel: ${field.config.formula}
				</div>
				<div class="font-medium">
					${value ?? 'Wird berechnet...'}
				</div>
			</div>
		`;
	}

	function renderListField(field: CustomFieldDefinition, value: any, error: string | undefined) {
		const items = Array.isArray(value) ? value : [];
		return `
			<div class="space-y-2">
				${items
					.map(
						(item, i) => `
					<div class="flex items-center gap-2">
						<input
							type="${field.config.item_type === 'number' ? 'number' : 'text'}"
							value="${item}"
							onchange="this.dispatchEvent(new CustomEvent('listitemchange', { detail: { index: ${i}, value: this.value } }))"
							${readonly ? 'disabled' : ''}
							class="flex-1 px-3 py-2 border border-theme-border-default rounded-md bg-theme-surface disabled:opacity-50"
						/>
						${
							!readonly
								? `
							<button
								onclick="this.dispatchEvent(new CustomEvent('listitemremove', { detail: ${i} }))"
								class="text-theme-error hover:text-theme-error/80"
							>
								🗑️
							</button>
						`
								: ''
						}
					</div>
				`
					)
					.join('')}
				${
					!readonly && (!field.config.max_items || items.length < field.config.max_items)
						? `
					<button
						onclick="this.dispatchEvent(new CustomEvent('listitemadd'))"
						class="px-3 py-1 border border-theme-border-default rounded-md hover:bg-theme-elevated text-sm"
					>
						+ Element hinzufügen
					</button>
				`
						: ''
				}
			</div>
		`;
	}

	function renderJsonField(field: CustomFieldDefinition, value: any, error: string | undefined) {
		const jsonString = JSON.stringify(value, null, 2);
		return `
			<textarea
				value="${jsonString}"
				onchange="this.dispatchEvent(new CustomEvent('fieldchange', { detail: JSON.parse(this.value) }))"
				${readonly ? 'disabled' : ''}
				rows="5"
				class="w-full px-3 py-2 border ${error ? 'border-theme-error' : 'border-theme-border-default'} 
					rounded-md bg-theme-surface font-mono text-sm disabled:opacity-50"
			></textarea>
		`;
	}

	function renderReferenceField(
		field: CustomFieldDefinition,
		value: any,
		error: string | undefined
	) {
		// For now, just render as text input
		// In production, this would be a node selector
		return `
			<input
				type="text"
				value="${value || ''}"
				onchange="this.dispatchEvent(new CustomEvent('fieldchange', { detail: this.value }))"
				${readonly ? 'disabled' : ''}
				placeholder="Node-Slug eingeben"
				class="w-full px-3 py-2 border ${error ? 'border-theme-error' : 'border-theme-border-default'} 
					rounded-md bg-theme-surface disabled:opacity-50"
			/>
		`;
	}
</script>

<div class="custom-data-form space-y-6">
	{#each fieldsByCategory() as [category, fields]}
		<div class="category-group">
			{#if category !== '_uncategorized'}
				<h3 class="text-lg font-medium mb-3 text-theme-text-primary">
					{category}
				</h3>
			{/if}

			<div class="space-y-4">
				{#each fields as field}
					<div class="field-wrapper">
						<label class="block text-sm font-medium mb-1 text-theme-text-primary">
							{field.label}
							{#if field.required}
								<span class="text-theme-error">*</span>
							{/if}
						</label>

						{#if field.description}
							<p class="text-xs text-theme-text-secondary mb-2">
								{field.description}
							</p>
						{/if}

						<!-- Field Component -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="field-component"
							{...{
								onfieldchange: (e: Event) => {
									const customEvent = e as CustomEvent;
									handleFieldChange(field.key, customEvent.detail);
								},
								onmultiselectchange: (e: Event) => {
									const customEvent = e as CustomEvent;
									const current = formData[field.key] || [];
									if (customEvent.detail.checked) {
										handleFieldChange(field.key, [...current, customEvent.detail.value]);
									} else {
										handleFieldChange(
											field.key,
											current.filter((v: any) => v !== customEvent.detail.value)
										);
									}
								},
								onlistitemchange: (e: Event) => {
									const customEvent = e as CustomEvent;
									const items = [...(formData[field.key] || [])];
									items[customEvent.detail.index] = customEvent.detail.value;
									handleFieldChange(field.key, items);
								},
								onlistitemremove: (e: Event) => {
									const customEvent = e as CustomEvent;
									const items = [...(formData[field.key] || [])];
									items.splice(customEvent.detail, 1);
									handleFieldChange(field.key, items);
								},
								onlistitemadd: () => {
									const items = [...(formData[field.key] || [])];
									items.push(getDefaultValueForType(field.config.item_type || 'text'));
									handleFieldChange(field.key, items);
								},
							} as any}
						>
							{@html getFieldComponent(field)}
						</div>

						{#if errors[field.key]}
							<p class="text-sm text-theme-error mt-1">
								{errors[field.key]}
							</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/each}

	{#if onSave && !readonly}
		<div class="flex justify-end gap-3 pt-4 border-t">
			<button
				onclick={handleSave}
				disabled={!isDirty}
				class="px-4 py-2 bg-theme-primary-600 text-white rounded-md hover:bg-theme-primary-700 disabled:opacity-50"
			>
				Speichern
			</button>
		</div>
	{/if}
</div>

<style>
	.field-component :global(input),
	.field-component :global(select),
	.field-component :global(textarea) {
		font-size: 0.875rem;
	}
</style>
