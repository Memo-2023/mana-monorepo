<script lang="ts">
	import type { Card, CardConfig, Module } from './types';
	import { isBeginnerCard, isAdvancedCard, isExpertCard } from './types';
	import { cardValidator } from '$lib/services/cardValidator';
	import ModuleEditor from './editor/ModuleEditor.svelte';
	import TemplateEditor from './editor/TemplateEditor.svelte';
	import CodeEditor from './editor/CodeEditor.svelte';

	interface Props {
		card: Card;
		onSave: (card: Card) => void;
		onCancel: () => void;
	}

	let { card, onSave, onCancel }: Props = $props();

	let editingCard = $state<Card>({ 
		...card,
		metadata: card.metadata || {},
		constraints: card.constraints || {}
	});
	let activeTab = $state<'config' | 'metadata' | 'preview'>('config');
	let validationErrors = $state<string[]>([]);

	// Mode options
	const modes = [
		{ value: 'beginner', label: 'Beginner', description: 'Visual modules' },
		{ value: 'advanced', label: 'Advanced', description: 'HTML templates' },
		{ value: 'expert', label: 'Expert', description: 'Custom HTML/CSS' }
	];

	// Validate card on changes
	$effect(() => {
		const validation = cardValidator.validate(editingCard);
		validationErrors = validation.errors?.map((e) => `${e.field}: ${e.message}`) || [];
	});

	// Handle mode change
	async function handleModeChange(newMode: string) {
		if (newMode === editingCard.config.mode) return;

		// Convert config to new mode
		// For now, just reset to default config for the new mode
		let newConfig: CardConfig;

		switch (newMode) {
			case 'beginner':
				newConfig = {
					mode: 'beginner',
					modules: [],
					layout: { columns: 1, gap: '1rem', padding: '1.5rem' }
				};
				break;
			case 'advanced':
				newConfig = {
					mode: 'advanced',
					template:
						'<div class="card-content">\n  <h2>{{title}}</h2>\n  <p>{{content}}</p>\n</div>',
					css: '',
					variables: [],
					values: {}
				};
				break;
			case 'expert':
				newConfig = {
					mode: 'expert',
					html: '<div class="card-content">\n  <h2>Title</h2>\n  <p>Content</p>\n</div>',
					css: '.card-content { padding: 1.5rem; }'
				};
				break;
			default:
				return;
		}

		editingCard = {
			...editingCard,
			config: newConfig
		};
	}

	// Handle save
	function handleSave() {
		if (validationErrors.length > 0) {
			alert('Please fix validation errors before saving');
			return;
		}
		onSave(editingCard);
	}

	// Add module (for beginner mode)
	function addModule(type: Module['type']) {
		if (!isBeginnerCard(editingCard.config)) return;

		const newModule: Module = {
			id: `module_${Date.now()}`,
			type,
			props: {},
			order: editingCard.config.modules.length
		};

		editingCard.config.modules = [...editingCard.config.modules, newModule];
	}

	// Remove module
	function removeModule(moduleId: string) {
		if (!isBeginnerCard(editingCard.config)) return;

		editingCard.config.modules = editingCard.config.modules.filter((m) => m.id !== moduleId);

		// Reorder remaining modules
		editingCard.config.modules.forEach((m, i) => {
			m.order = i;
		});
	}
</script>

<div class="card-editor-overlay">
	<div class="card-editor">
		<!-- Header -->
		<div class="editor-header">
			<h2>{card.id === 'new' ? 'Create Card' : 'Edit Card'}</h2>
			<button onclick={onCancel} class="close-btn" aria-label="Close editor">
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- Tabs -->
		<div class="editor-tabs">
			<button
				class="tab"
				class:active={activeTab === 'config'}
				onclick={() => (activeTab = 'config')}
			>
				Configuration
			</button>
			<button
				class="tab"
				class:active={activeTab === 'metadata'}
				onclick={() => (activeTab = 'metadata')}
			>
				Metadata
			</button>
			<button
				class="tab"
				class:active={activeTab === 'preview'}
				onclick={() => (activeTab = 'preview')}
			>
				Preview
			</button>
		</div>

		<!-- Content -->
		<div class="editor-content">
			{#if activeTab === 'config'}
				<!-- Mode selector -->
				<div class="form-group">
					<label>Mode</label>
					<select
						value={editingCard.config.mode}
						onchange={(e) => handleModeChange(e.currentTarget.value)}
						class="select"
					>
						{#each modes as mode}
							<option value={mode.value}>
								{mode.label} - {mode.description}
							</option>
						{/each}
					</select>
				</div>

				<!-- Mode-specific editor -->
				{#if isBeginnerCard(editingCard.config)}
					<div class="modules-editor">
						<h3>Modules</h3>

						<!-- Module list -->
						{#if editingCard.config.modules.length > 0}
							<div class="modules-list">
								{#each editingCard.config.modules as module (module.id)}
									<ModuleEditor
										{module}
										onUpdate={(updated) => {
											if (!isBeginnerCard(editingCard.config)) return;
											const index = editingCard.config.modules.findIndex((m) => m.id === module.id);
											if (index >= 0) {
												editingCard.config.modules[index] = updated;
											}
										}}
										onRemove={() => removeModule(module.id)}
									/>
								{/each}
							</div>
						{:else}
							<p class="empty-message">No modules yet. Add one below.</p>
						{/if}

						<!-- Add module buttons -->
						<div class="add-module-buttons">
							<button onclick={() => addModule('header')} class="btn btn-sm">+ Header</button>
							<button onclick={() => addModule('content')} class="btn btn-sm">+ Content</button>
							<button onclick={() => addModule('links')} class="btn btn-sm">+ Links</button>
							<button onclick={() => addModule('media')} class="btn btn-sm">+ Media</button>
							<button onclick={() => addModule('stats')} class="btn btn-sm">+ Stats</button>
							<button onclick={() => addModule('footer')} class="btn btn-sm">+ Footer</button>
						</div>
					</div>
				{:else if isAdvancedCard(editingCard.config)}
					<TemplateEditor
						bind:template={editingCard.config.template}
						bind:css={editingCard.config.css}
						bind:variables={editingCard.config.variables}
						bind:values={editingCard.config.values}
					/>
				{:else if isExpertCard(editingCard.config)}
					<CodeEditor bind:html={editingCard.config.html} bind:css={editingCard.config.css} />
				{/if}
			{:else if activeTab === 'metadata'}
				<div class="metadata-editor">
					<div class="form-group">
						<label for="name">Name</label>
						<input
							id="name"
							type="text"
							bind:value={editingCard.metadata!.name}
							class="input"
							placeholder="Card name"
						/>
					</div>

					<div class="form-group">
						<label for="description">Description</label>
						<textarea
							id="description"
							bind:value={editingCard.metadata!.description}
							class="textarea"
							placeholder="Card description"
							rows="3"
						></textarea>
					</div>

					<div class="form-group">
						<label for="page">Page</label>
						<input
							id="page"
							type="text"
							bind:value={editingCard.page}
							class="input"
							placeholder="default"
						/>
					</div>

					<div class="form-group">
						<label for="position">Position</label>
						<input
							id="position"
							type="number"
							bind:value={editingCard.position}
							class="input"
							min="0"
						/>
					</div>

					<div class="form-group">
						<label>
							<input type="checkbox" bind:checked={editingCard.metadata!.isActive} />
							Active
						</label>
					</div>

					<div class="form-group">
						<label>
							<input type="checkbox" bind:checked={editingCard.metadata!.isPublic} />
							Public
						</label>
					</div>

					<div class="form-group">
						<label for="aspectRatio">Aspect Ratio</label>
						<select
							id="aspectRatio"
							bind:value={editingCard.constraints!.aspectRatio}
							class="select"
						>
							<option value="16/9">16:9</option>
							<option value="4/3">4:3</option>
							<option value="1/1">1:1</option>
							<option value="3/2">3:2</option>
							<option value="auto">Auto</option>
						</select>
					</div>
				</div>
			{:else if activeTab === 'preview'}
				<div class="preview-container">
					<div class="preview-card">
						<!-- Preview would go here -->
						<p>Preview coming soon...</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- Validation errors -->
		{#if validationErrors.length > 0}
			<div class="validation-errors">
				<h4>Validation Errors:</h4>
				<ul>
					{#each validationErrors as error}
						<li>{error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Footer -->
		<div class="editor-footer">
			<button onclick={onCancel} class="btn btn-secondary"> Cancel </button>
			<button onclick={handleSave} class="btn btn-primary" disabled={validationErrors.length > 0}>
				Save Card
			</button>
		</div>
	</div>
</div>

<style>
	.card-editor-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.card-editor {
		background: white;
		border-radius: 0.75rem;
		max-width: 900px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
	}

	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.editor-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	.close-btn {
		padding: 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: #6b7280;
		transition: color 0.2s;
	}

	.close-btn:hover {
		color: #1f2937;
	}

	.editor-tabs {
		display: flex;
		gap: 1rem;
		padding: 0 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.tab {
		padding: 1rem 0;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		font-weight: 500;
		color: #6b7280;
		transition: all 0.2s;
	}

	.tab:hover {
		color: #1f2937;
	}

	.tab.active {
		color: #3b82f6;
		border-bottom-color: #3b82f6;
	}

	.editor-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #374151;
	}

	.input,
	.select,
	.textarea {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		transition: border-color 0.2s;
	}

	.input:focus,
	.select:focus,
	.textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.modules-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.empty-message {
		text-align: center;
		color: #6b7280;
		padding: 2rem;
		background: #f9fafb;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.add-module-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}

	.btn-sm {
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
	}

	.btn-primary {
		background: #3b82f6;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
	}

	.btn-secondary {
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.btn-secondary:hover {
		background: #f9fafb;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.validation-errors {
		padding: 1rem 1.5rem;
		background: #fef2f2;
		border-top: 1px solid #fecaca;
	}

	.validation-errors h4 {
		color: #dc2626;
		margin-bottom: 0.5rem;
	}

	.validation-errors ul {
		list-style: disc;
		padding-left: 1.5rem;
		color: #dc2626;
		font-size: 0.875rem;
	}

	.editor-footer {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.preview-container {
		min-height: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f9fafb;
		border-radius: 0.5rem;
	}
</style>
