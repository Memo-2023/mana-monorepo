<script lang="ts">
	import type {
		CustomFieldSchema,
		CustomFieldData,
		CustomFieldDefinition,
	} from '$lib/types/customFields';
	import { parseReferences } from '$lib/utils/markdown';

	interface Props {
		schema?: CustomFieldSchema;
		data?: CustomFieldData;
	}

	let { schema, data = {} }: Props = $props();

	// Group fields by category
	let fieldsByCategory = $derived(() => {
		if (!schema) return new Map();

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

	// Format value for display
	function formatValue(field: CustomFieldDefinition, value: any): string {
		if (value === null || value === undefined || value === '') {
			return '—';
		}

		switch (field.type) {
			case 'boolean':
				return value ? '✓ Ja' : '✗ Nein';

			case 'number':
			case 'range':
				const formatted = typeof value === 'number' ? value.toString() : value;
				return field.config.unit ? `${formatted} ${field.config.unit}` : formatted;

			case 'date':
				return new Date(value).toLocaleDateString('de-DE');

			case 'select':
				const choice = field.config.choices?.find((c) => c.value === value);
				return choice?.label || value;

			case 'multiselect':
				if (Array.isArray(value)) {
					const labels = value.map((v) => {
						const choice = field.config.choices?.find((c) => c.value === v);
						return choice?.label || v;
					});
					return labels.join(', ');
				}
				return value;

			case 'list':
				if (Array.isArray(value)) {
					return value.join(', ');
				}
				return value;

			case 'json':
				return JSON.stringify(value, null, 2);

			case 'formula':
				// Formulas might return complex results
				return typeof value === 'object' ? JSON.stringify(value) : value;

			case 'reference':
				if (Array.isArray(value)) {
					return value.map((v) => `@${v}`).join(', ');
				}
				return value ? `@${value}` : '—';

			case 'text':
			default:
				return value;
		}
	}

	// Check if value is empty
	function isEmpty(value: any): boolean {
		return (
			value === null ||
			value === undefined ||
			value === '' ||
			(Array.isArray(value) && value.length === 0) ||
			(typeof value === 'object' && Object.keys(value).length === 0)
		);
	}

	// Check if we have any non-empty values
	let hasData = $derived(() => {
		if (!schema || !data) return false;
		return schema.fields.some((field) => !isEmpty(data[field.key]));
	});
</script>

{#if schema && schema.fields.length > 0}
	{#if !hasData}
		<div class="text-center py-8 text-theme-text-secondary">
			Keine benutzerdefinierten Daten vorhanden
		</div>
	{:else}
		<div class="space-y-6">
			{#each fieldsByCategory() as [category, fields]}
				<div class="category-section">
					{#if category !== '_uncategorized'}
						<h3 class="text-lg font-medium mb-3 text-theme-text-primary border-b pb-2">
							{category}
						</h3>
					{/if}

					<div class="grid gap-4 md:grid-cols-2">
						{#each fields as field}
							{#if !isEmpty(data[field.key])}
								<div class="field-display">
									<dt class="text-sm font-medium text-theme-text-secondary mb-1">
										{field.label}
									</dt>
									<dd class="text-theme-text-primary">
										{#if field.type === 'range'}
											<!-- Special display for range fields -->
											<div class="flex items-center gap-2">
												<div class="flex-1 bg-theme-elevated rounded-full h-2 relative">
													<div
														class="absolute top-0 left-0 h-full bg-theme-primary-600 rounded-full"
														style="width: {((data[field.key] - (field.config.min ?? 0)) /
															((field.config.max ?? 100) - (field.config.min ?? 0))) *
															100}%"
													></div>
												</div>
												<span class="text-sm font-medium">
													{formatValue(field, data[field.key])}
												</span>
											</div>
										{:else if field.type === 'text' && field.config.multiline}
											<!-- Multiline text with markdown support -->
											<div class="prose prose-sm max-w-none">
												{@html parseReferences(data[field.key])}
											</div>
										{:else if field.type === 'json'}
											<!-- JSON display -->
											<pre class="text-xs bg-theme-elevated p-2 rounded overflow-x-auto">
												<code>{formatValue(field, data[field.key])}</code>
											</pre>
										{:else if field.type === 'boolean'}
											<!-- Boolean with icon -->
											<span
												class={data[field.key] ? 'text-theme-success' : 'text-theme-text-secondary'}
											>
												{formatValue(field, data[field.key])}
											</span>
										{:else if field.type === 'multiselect' || field.type === 'list'}
											<!-- Tags display for arrays -->
											<div class="flex flex-wrap gap-1">
												{#each Array.isArray(data[field.key]) ? data[field.key] : [] as item}
													<span class="inline-block px-2 py-0.5 bg-theme-elevated rounded text-sm">
														{field.type === 'multiselect'
															? field.config.choices?.find(
																	(c: { value: any; label: string }) => c.value === item
																)?.label || item
															: item}
													</span>
												{/each}
											</div>
										{:else}
											<!-- Default display -->
											<span class="break-words">
												{@html parseReferences(formatValue(field, data[field.key]))}
											</span>
										{/if}
									</dd>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
{:else}
	<div class="text-center py-8 text-theme-text-secondary">
		Keine benutzerdefinierten Felder definiert
	</div>
{/if}

<style>
	.field-display {
		background-color: var(--theme-background-elevated);
		border-radius: 0.5rem;
		padding: 0.75rem;
	}

	.field-display dt {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.field-display dd {
		margin-top: 0.25rem;
	}

	.category-section + .category-section {
		padding-top: 1rem;
		border-top: 1px solid var(--theme-border-default);
	}
</style>
