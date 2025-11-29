<script lang="ts">
	import type { TemplateVariable, CardConstraints } from './types';
	import { cardSanitizer } from '$lib/services/cardSanitizer';
	import CustomCard from './CustomCard.svelte';

	interface Props {
		template: string;
		css?: string;
		variables: TemplateVariable[];
		values: Record<string, any>;
		constraints?: CardConstraints;
		className?: string;
	}

	let { template, css = '', variables, values, constraints = {}, className = '' }: Props = $props();

	// Process template with variables
	let processedHTML = $derived(() => {
		if (!template) return '';
		return cardSanitizer.replaceVariables(template, values || {});
	});

	// Default CSS if none provided
	let finalCSS = $derived(() => {
		return (
			css ||
			`
			.card-content {
				padding: 1.5rem;
				height: 100%;
			}
			
			h1, h2, h3, h4, h5, h6 {
				margin-bottom: 0.5rem;
				line-height: 1.2;
			}
			
			p {
				margin-bottom: 1rem;
				line-height: 1.6;
			}
			
			a {
				color: var(--primary, #3b82f6);
				text-decoration: none;
				transition: color 0.2s;
			}
			
			a:hover {
				color: var(--primary-dark, #2563eb);
				text-decoration: underline;
			}
			
			img {
				max-width: 100%;
				height: auto;
				border-radius: 0.5rem;
			}
			
			.button {
				display: inline-block;
				padding: 0.5rem 1rem;
				background: var(--primary, #3b82f6);
				color: white;
				border-radius: 0.375rem;
				text-decoration: none;
				transition: all 0.2s;
			}
			
			.button:hover {
				background: var(--primary-dark, #2563eb);
				transform: translateY(-1px);
				box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
			}
		`
		);
	});
</script>

<div class="template-card-wrapper {className}">
	{#if template}
		<CustomCard html={processedHTML()} css={finalCSS()} {constraints} />
	{:else}
		<div class="empty-state">
			<svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
				/>
			</svg>
			<p>No template provided</p>
		</div>
	{/if}
</div>

{#if variables.length > 0 && import.meta.env.DEV}
	<!-- Debug panel for development -->
	<details class="debug-panel">
		<summary>Template Variables ({variables.length})</summary>
		<div class="variables-list">
			{#each variables as variable}
				<div class="variable-item">
					<span class="variable-name">{variable.name}</span>
					<span class="variable-type">{variable.type}</span>
					<span class="variable-value">
						{values?.[variable.name] || 'undefined'}
					</span>
				</div>
			{/each}
		</div>
	</details>
{/if}

<style>
	.template-card-wrapper {
		position: relative;
		width: 100%;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		background: var(--theme-surface, #f9fafb);
		border-radius: var(--theme-radius-lg, 0.75rem);
		border: 2px dashed var(--theme-border, #e5e7eb);
		color: var(--theme-text-muted, #6b7280);
		min-height: 200px;
	}

	.empty-icon {
		width: 48px;
		height: 48px;
		margin-bottom: 0.5rem;
		opacity: 0.5;
	}

	/* Debug panel (only in development) */
	.debug-panel {
		margin-top: 1rem;
		padding: 1rem;
		background: #f3f4f6;
		border-radius: 0.5rem;
		font-size: 0.875rem;
	}

	.debug-panel summary {
		cursor: pointer;
		font-weight: 600;
		color: #4b5563;
	}

	.variables-list {
		margin-top: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.variable-item {
		display: flex;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem;
		background: white;
		border-radius: 0.25rem;
	}

	.variable-name {
		font-weight: 600;
		color: #1f2937;
	}

	.variable-type {
		color: #6b7280;
		font-size: 0.75rem;
		background: #e5e7eb;
		padding: 0 0.25rem;
		border-radius: 0.125rem;
	}

	.variable-value {
		margin-left: auto;
		color: #059669;
		font-family: monospace;
	}
</style>
