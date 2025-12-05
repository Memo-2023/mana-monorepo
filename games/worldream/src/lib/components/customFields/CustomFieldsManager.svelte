<script lang="ts">
	import type { ContentNode } from '$lib/types/content';
	import type {
		CustomFieldSchema,
		CustomFieldData,
		CustomFieldDefinition,
		CustomFieldTemplate,
	} from '$lib/types/customFields';
	import { createEmptySchema } from '$lib/types/customFields';
	import FieldDefinitionEditor from './FieldDefinitionEditor.svelte';
	import CustomDataForm from './CustomDataForm.svelte';

	interface Props {
		node?: ContentNode;
		nodeSlug?: string;
		nodeKind: string;
		worldSlug?: string;
		onSchemaChange?: (schema: CustomFieldSchema) => void;
		onDataChange?: (data: CustomFieldData) => void;
	}

	let { node, nodeSlug, nodeKind, worldSlug, onSchemaChange, onDataChange }: Props = $props();

	let activeTab = $state<'data' | 'schema' | 'templates'>('data');
	let schema = $state<CustomFieldSchema>(node?.custom_schema || createEmptySchema());
	let customData = $state<CustomFieldData>(node?.custom_data || {});
	let isEditingSchema = $state(false);
	let editingField = $state<CustomFieldDefinition | null>(null);
	let showFieldEditor = $state(false);
	let templates = $state<CustomFieldTemplate[]>([]);
	let loadingTemplates = $state(false);
	let selectedTemplate = $state<string | null>(null);

	// Load templates
	async function loadTemplates() {
		if (loadingTemplates) return;

		loadingTemplates = true;
		try {
			const response = await fetch(`/api/templates?applicable_to=${nodeKind}&is_public=true`);
			if (response.ok) {
				const data = await response.json();
				templates = data.templates || [];
			}
		} catch (err) {
			console.error('Failed to load templates:', err);
		} finally {
			loadingTemplates = false;
		}
	}

	// Save schema
	async function saveSchema() {
		if (!nodeSlug) return;

		try {
			const response = await fetch(`/api/nodes/${nodeSlug}/schema`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ schema }),
			});

			if (response.ok) {
				isEditingSchema = false;
				if (onSchemaChange) {
					onSchemaChange(schema);
				}
			} else {
				console.error('Failed to save schema');
			}
		} catch (err) {
			console.error('Error saving schema:', err);
		}
	}

	// Save custom data
	async function saveCustomData(data: CustomFieldData) {
		if (!nodeSlug) return;

		customData = data;

		try {
			const response = await fetch(`/api/nodes/${nodeSlug}/custom-data`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ data }),
			});

			if (response.ok) {
				if (onDataChange) {
					onDataChange(data);
				}
			} else {
				console.error('Failed to save custom data');
			}
		} catch (err) {
			console.error('Error saving custom data:', err);
		}
	}

	// Apply template
	async function applyTemplate(templateId: string) {
		const template = templates.find((t) => t.id === templateId);
		if (!template) return;

		// Merge template fields with existing schema
		const existingKeys = schema.fields.map((f) => f.key);
		const newFields = template.fields.filter((f) => !existingKeys.includes(f.key));

		schema = {
			...schema,
			fields: [...schema.fields, ...newFields],
			template_id: templateId,
			template_version: template.version,
		};

		// Initialize data for new fields
		for (const field of newFields) {
			if (!(field.key in customData)) {
				customData[field.key] = getDefaultValue(field);
			}
		}

		selectedTemplate = null;
	}

	// Add field to schema
	function addField(field: CustomFieldDefinition) {
		schema = {
			...schema,
			fields: [...schema.fields, field],
			version: (schema.version || 0) + 1,
		};
		showFieldEditor = false;
	}

	// Edit existing field
	function editField(field: CustomFieldDefinition) {
		schema = {
			...schema,
			fields: schema.fields.map((f) => (f.id === field.id ? field : f)),
			version: (schema.version || 0) + 1,
		};
		editingField = null;
	}

	// Remove field from schema
	function removeField(fieldId: string) {
		if (confirm('Dieses Feld wirklich entfernen? Die Daten gehen verloren.')) {
			schema = {
				...schema,
				fields: schema.fields.filter((f) => f.id !== fieldId),
				version: (schema.version || 0) + 1,
			};

			// Remove data for this field
			const field = schema.fields.find((f) => f.id === fieldId);
			if (field) {
				delete customData[field.key];
			}
		}
	}

	// Get default value for field
	function getDefaultValue(field: CustomFieldDefinition): any {
		switch (field.type) {
			case 'text':
				return '';
			case 'number':
			case 'range':
				return field.config.default ?? field.config.min ?? 0;
			case 'boolean':
				return false;
			case 'date':
				return new Date().toISOString().split('T')[0];
			case 'select':
				return field.config.choices?.[0]?.value ?? '';
			case 'multiselect':
				return [];
			case 'list':
				return [];
			case 'json':
				return {};
			case 'reference':
				return field.config.multiple ? [] : null;
			default:
				return null;
		}
	}

	// Load templates when switching to templates tab
	$effect(() => {
		if (activeTab === 'templates' && templates.length === 0) {
			loadTemplates();
		}
	});

	// Check if we have any fields
	let hasFields = $derived(schema.fields.length > 0);
</script>

<div class="custom-fields-manager">
	<!-- Tab Navigation -->
	<div class="flex border-b border-theme-border-default mb-4">
		<button
			onclick={() => (activeTab = 'data')}
			class="px-4 py-2 text-sm font-medium {activeTab === 'data'
				? 'text-theme-primary-600 border-b-2 border-theme-primary-600'
				: 'text-theme-text-secondary hover:text-theme-text-primary'}"
		>
			Daten
			{#if hasFields}
				<span class="ml-1 text-xs bg-theme-primary-100 text-theme-primary-700 px-2 py-0.5 rounded">
					{schema.fields.length}
				</span>
			{/if}
		</button>
		<button
			onclick={() => (activeTab = 'schema')}
			class="px-4 py-2 text-sm font-medium {activeTab === 'schema'
				? 'text-theme-primary-600 border-b-2 border-theme-primary-600'
				: 'text-theme-text-secondary hover:text-theme-text-primary'}"
		>
			Felder verwalten
		</button>
		<button
			onclick={() => (activeTab = 'templates')}
			class="px-4 py-2 text-sm font-medium {activeTab === 'templates'
				? 'text-theme-primary-600 border-b-2 border-theme-primary-600'
				: 'text-theme-text-secondary hover:text-theme-text-primary'}"
		>
			Vorlagen
		</button>
	</div>

	<!-- Tab Content -->
	{#if activeTab === 'data'}
		{#if hasFields}
			<CustomDataForm
				{schema}
				data={customData}
				onChange={onDataChange}
				onSave={nodeSlug ? saveCustomData : undefined}
			/>
		{:else}
			<div class="text-center py-12 bg-theme-elevated rounded-lg">
				<p class="text-theme-text-secondary mb-4">
					Noch keine benutzerdefinierten Felder vorhanden
				</p>
				<button
					onclick={() => (activeTab = 'schema')}
					class="px-4 py-2 bg-theme-primary-600 text-white rounded-md hover:bg-theme-primary-700"
				>
					Felder hinzufügen
				</button>
			</div>
		{/if}
	{:else if activeTab === 'schema'}
		<div class="space-y-4">
			{#if !isEditingSchema}
				<!-- Field List -->
				<div class="flex justify-between items-center mb-4">
					<h3 class="text-lg font-medium">Benutzerdefinierte Felder</h3>
					<button
						onclick={() => (showFieldEditor = true)}
						class="px-3 py-1.5 bg-theme-primary-600 text-white rounded-md hover:bg-theme-primary-700 text-sm"
					>
						+ Neues Feld
					</button>
				</div>

				{#if hasFields}
					<div class="space-y-2">
						{#each schema.fields as field}
							<div class="flex items-center justify-between p-3 bg-theme-elevated rounded-lg">
								<div class="flex-1">
									<div class="flex items-center gap-2">
										<span class="font-medium">{field.label}</span>
										<span class="text-xs text-theme-text-secondary">({field.key})</span>
										<span class="text-xs px-2 py-0.5 bg-theme-surface rounded">
											{field.type}
										</span>
									</div>
									{#if field.description}
										<p class="text-sm text-theme-text-secondary mt-1">
											{field.description}
										</p>
									{/if}
								</div>
								<div class="flex gap-2">
									<button
										onclick={() => (editingField = field)}
										class="text-theme-primary-600 hover:text-theme-primary-700"
									>
										✏️
									</button>
									<button
										onclick={() => removeField(field.id)}
										class="text-theme-error hover:text-theme-error/80"
									>
										🗑️
									</button>
								</div>
							</div>
						{/each}
					</div>

					{#if nodeSlug}
						<div class="flex justify-end mt-4">
							<button
								onclick={saveSchema}
								class="px-4 py-2 bg-theme-primary-600 text-white rounded-md hover:bg-theme-primary-700"
							>
								Schema speichern
							</button>
						</div>
					{/if}
				{:else}
					<p class="text-center text-theme-text-secondary py-8">Noch keine Felder definiert</p>
				{/if}
			{/if}

			<!-- Field Editor -->
			{#if showFieldEditor}
				<FieldDefinitionEditor
					onSave={addField}
					onCancel={() => (showFieldEditor = false)}
					existingKeys={schema.fields.map((f) => f.key)}
				/>
			{/if}

			{#if editingField}
				<FieldDefinitionEditor
					field={editingField}
					onSave={editField}
					onCancel={() => (editingField = null)}
					existingKeys={schema.fields.filter((f) => f.id !== editingField?.id).map((f) => f.key)}
				/>
			{/if}
		</div>
	{:else if activeTab === 'templates'}
		<div class="space-y-4">
			<h3 class="text-lg font-medium mb-4">Verfügbare Vorlagen</h3>

			{#if loadingTemplates}
				<p class="text-center text-theme-text-secondary py-8">Lade Vorlagen...</p>
			{:else if templates.length === 0}
				<p class="text-center text-theme-text-secondary py-8">
					Keine Vorlagen für {nodeKind} verfügbar
				</p>
			{:else}
				<div class="grid gap-4">
					{#each templates as template}
						<div class="p-4 bg-theme-elevated rounded-lg">
							<div class="flex justify-between items-start">
								<div class="flex-1">
									<h4 class="font-medium">{template.name}</h4>
									{#if template.description}
										<p class="text-sm text-theme-text-secondary mt-1">
											{template.description}
										</p>
									{/if}
									<div class="flex gap-2 mt-2">
										{#each template.tags as tag}
											<span class="text-xs px-2 py-0.5 bg-theme-surface rounded">
												{tag}
											</span>
										{/each}
									</div>
									<p class="text-xs text-theme-text-secondary mt-2">
										{template.fields.length} Felder •
										{template.usage_count} mal verwendet
									</p>
								</div>
								<button
									onclick={() => applyTemplate(template.id)}
									class="px-3 py-1.5 bg-theme-primary-600 text-white rounded-md hover:bg-theme-primary-700 text-sm"
								>
									Anwenden
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
