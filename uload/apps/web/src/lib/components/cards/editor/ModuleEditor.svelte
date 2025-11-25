<script lang="ts">
	import type { Module } from '../types';

	interface Props {
		module: Module;
		onUpdate: (module: Module) => void;
		onRemove: () => void;
	}

	let { module, onUpdate, onRemove }: Props = $props();

	let expanded = $state(false);

	// Update module props
	function updateProp(key: string, value: any) {
		onUpdate({
			...module,
			props: {
				...module.props,
				[key]: value
			}
		});
	}

	// Get module icon
	function getModuleIcon(type: Module['type']): string {
		const icons = {
			header: '📄',
			content: '📝',
			links: '🔗',
			media: '🖼️',
			stats: '📊',
			actions: '⚡',
			footer: '📌',
			custom: '🎨'
		};
		return icons[type] || '📦';
	}
</script>

<div class="module-editor">
	<div class="module-header">
		<button class="expand-btn" onclick={() => (expanded = !expanded)}>
			<span class="module-icon">{getModuleIcon(module.type)}</span>
			<span class="module-type">{module.type}</span>
			<svg
				class="expand-icon"
				class:rotated={expanded}
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		<div class="module-actions">
			<input
				type="number"
				value={module.order}
				onchange={(e) => onUpdate({ ...module, order: parseInt(e.currentTarget.value) })}
				class="order-input"
				min="0"
				title="Order"
			/>
			<button onclick={onRemove} class="remove-btn" title="Remove">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>
	</div>

	{#if expanded}
		<div class="module-content">
			{#if module.type === 'header'}
				<div class="field">
					<label>Title</label>
					<input
						type="text"
						value={module.props.title || ''}
						oninput={(e) => updateProp('title', e.currentTarget.value)}
						placeholder="Enter title"
					/>
				</div>
				<div class="field">
					<label>Subtitle</label>
					<input
						type="text"
						value={module.props.subtitle || ''}
						oninput={(e) => updateProp('subtitle', e.currentTarget.value)}
						placeholder="Enter subtitle"
					/>
				</div>
			{:else if module.type === 'content'}
				<div class="field">
					<label>Text</label>
					<textarea
						value={module.props.text || ''}
						oninput={(e) => updateProp('text', e.currentTarget.value)}
						placeholder="Enter content"
						rows="4"
					></textarea>
				</div>
			{:else if module.type === 'links'}
				<div class="field">
					<label>Links (JSON)</label>
					<textarea
						value={JSON.stringify(module.props.links || [], null, 2)}
						oninput={(e) => {
							try {
								const links = JSON.parse(e.currentTarget.value);
								updateProp('links', links);
							} catch {}
						}}
						placeholder="JSON array of links"
						rows="4"
					></textarea>
				</div>
				<div class="field">
					<label>Style</label>
					<select
						value={module.props.style || 'button'}
						onchange={(e) => updateProp('style', e.currentTarget.value)}
					>
						<option value="button">Button</option>
						<option value="list">List</option>
						<option value="card">Card</option>
					</select>
				</div>
			{:else if module.type === 'media'}
				<div class="field">
					<label>Type</label>
					<select
						value={module.props.type || 'image'}
						onchange={(e) => updateProp('type', e.currentTarget.value)}
					>
						<option value="image">Image</option>
						<option value="video">Video</option>
						<option value="qr">QR Code</option>
					</select>
				</div>
				{#if module.props.type === 'image'}
					<div class="field">
						<label>Image URL</label>
						<input
							type="text"
							value={module.props.src || ''}
							oninput={(e) => updateProp('src', e.currentTarget.value)}
							placeholder="https://example.com/image.jpg"
						/>
					</div>
					<div class="field">
						<label>Alt Text</label>
						<input
							type="text"
							value={module.props.alt || ''}
							oninput={(e) => updateProp('alt', e.currentTarget.value)}
							placeholder="Image description"
						/>
					</div>
				{:else if module.props.type === 'qr'}
					<div class="field">
						<label>QR Data</label>
						<input
							type="text"
							value={module.props.qrData || ''}
							oninput={(e) => updateProp('qrData', e.currentTarget.value)}
							placeholder="https://example.com"
						/>
					</div>
				{/if}
			{:else if module.type === 'stats'}
				<div class="field">
					<label>Stats (JSON)</label>
					<textarea
						value={JSON.stringify(module.props.stats || [], null, 2)}
						oninput={(e) => {
							try {
								const stats = JSON.parse(e.currentTarget.value);
								updateProp('stats', stats);
							} catch {}
						}}
						placeholder="JSON array of stats"
						rows="4"
					></textarea>
				</div>
			{:else if module.type === 'footer'}
				<div class="field">
					<label>Text</label>
					<input
						type="text"
						value={module.props.text || ''}
						oninput={(e) => updateProp('text', e.currentTarget.value)}
						placeholder="Footer text"
					/>
				</div>
				<div class="field">
					<label>Copyright</label>
					<input
						type="text"
						value={module.props.copyright || ''}
						oninput={(e) => updateProp('copyright', e.currentTarget.value)}
						placeholder="© 2024"
					/>
				</div>
			{:else}
				<div class="field">
					<label>Custom Props (JSON)</label>
					<textarea
						value={JSON.stringify(module.props, null, 2)}
						oninput={(e) => {
							try {
								const props = JSON.parse(e.currentTarget.value);
								onUpdate({ ...module, props });
							} catch {}
						}}
						placeholder="JSON object"
						rows="4"
					></textarea>
				</div>
			{/if}

			<div class="field">
				<label>Visibility</label>
				<select
					value={module.visibility || 'always'}
					onchange={(e) => onUpdate({ ...module, visibility: e.currentTarget.value as any })}
				>
					<option value="always">Always</option>
					<option value="desktop">Desktop Only</option>
					<option value="mobile">Mobile Only</option>
				</select>
			</div>
		</div>
	{/if}
</div>

<style>
	.module-editor {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.module-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: #f9fafb;
	}

	.expand-btn {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		font-weight: 500;
		color: #374151;
	}

	.module-icon {
		font-size: 1.25rem;
	}

	.module-type {
		text-transform: capitalize;
	}

	.expand-icon {
		margin-left: auto;
		transition: transform 0.2s;
	}

	.expand-icon.rotated {
		transform: rotate(180deg);
	}

	.module-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.order-input {
		width: 50px;
		padding: 0.25rem;
		border: 1px solid #d1d5db;
		border-radius: 0.25rem;
		text-align: center;
		font-size: 0.875rem;
	}

	.remove-btn {
		padding: 0.25rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: #6b7280;
		transition: color 0.2s;
	}

	.remove-btn:hover {
		color: #ef4444;
	}

	.module-content {
		padding: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.field {
		margin-bottom: 1rem;
	}

	.field:last-child {
		margin-bottom: 0;
	}

	.field label {
		display: block;
		margin-bottom: 0.25rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.field input,
	.field select,
	.field textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.field input:focus,
	.field select:focus,
	.field textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.field textarea {
		font-family: monospace;
		resize: vertical;
	}
</style>
