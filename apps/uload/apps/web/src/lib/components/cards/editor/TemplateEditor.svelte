<script lang="ts">
	import type { TemplateVariable } from '../types';
	import { cardSanitizer } from '$lib/services/cardSanitizer';

	interface Props {
		template: string;
		css: string;
		variables: TemplateVariable[];
		values: Record<string, any>;
	}

	let {
		template = $bindable(),
		css = $bindable(),
		variables = $bindable(),
		values = $bindable()
	}: Props = $props();

	// Extract variables when template changes
	$effect(() => {
		variables = cardSanitizer.extractVariables(template);
	});
</script>

<div class="template-editor">
	<div class="editor-section">
		<h3>HTML Template</h3>
		<p class="help-text">Use {'{{variable}}'} syntax for dynamic content</p>
		<textarea
			bind:value={template}
			class="code-editor"
			placeholder="Add your HTML template with {{ variable }} syntax..."
			rows="10"
		></textarea>
	</div>

	<div class="editor-section">
		<h3>CSS Styles</h3>
		<textarea
			bind:value={css}
			class="code-editor"
			placeholder="Add your CSS styles here..."
			rows="8"
		></textarea>
	</div>

	{#if variables.length > 0}
		<div class="editor-section">
			<h3>Template Variables</h3>
			<div class="variables-list">
				{#each variables as variable}
					<div class="variable-field">
						<label>
							{variable.label || variable.name}
							<span class="variable-type">({variable.type})</span>
						</label>

						{#if variable.type === 'text'}
							<input
								type="text"
								value={values[variable.name] || ''}
								oninput={(e) => (values[variable.name] = e.currentTarget.value)}
								placeholder={variable.placeholder || `Enter ${variable.name}`}
							/>
						{:else if variable.type === 'number'}
							<input
								type="number"
								value={values[variable.name] || 0}
								oninput={(e) => (values[variable.name] = parseFloat(e.currentTarget.value))}
								placeholder={variable.placeholder || '0'}
							/>
						{:else if variable.type === 'color'}
							<input
								type="color"
								value={values[variable.name] || '#000000'}
								oninput={(e) => (values[variable.name] = e.currentTarget.value)}
							/>
						{:else if variable.type === 'boolean'}
							<label class="checkbox-label">
								<input
									type="checkbox"
									checked={values[variable.name] || false}
									onchange={(e) => (values[variable.name] = e.currentTarget.checked)}
								/>
								{variable.placeholder || 'Enabled'}
							</label>
						{:else if variable.type === 'link'}
							<input
								type="url"
								value={values[variable.name] || ''}
								oninput={(e) => (values[variable.name] = e.currentTarget.value)}
								placeholder={variable.placeholder || 'https://example.com'}
							/>
						{:else if variable.type === 'image'}
							<input
								type="url"
								value={values[variable.name] || ''}
								oninput={(e) => (values[variable.name] = e.currentTarget.value)}
								placeholder={variable.placeholder || 'https://example.com/image.jpg'}
							/>
						{:else}
							<input
								type="text"
								value={values[variable.name] || ''}
								oninput={(e) => (values[variable.name] = e.currentTarget.value)}
								placeholder={variable.placeholder || `Enter ${variable.name}`}
							/>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.template-editor {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.editor-section h3 {
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	.help-text {
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.code-editor {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		line-height: 1.5;
		resize: vertical;
		background: #f9fafb;
	}

	.code-editor:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		background: white;
	}

	.variables-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.variable-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.variable-field label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.variable-type {
		font-size: 0.75rem;
		color: #6b7280;
		font-weight: normal;
	}

	.variable-field input {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.variable-field input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #374151;
	}

	.checkbox-label input {
		width: auto;
	}
</style>
