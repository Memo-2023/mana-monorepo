<script lang="ts">
	import type { Card } from './types';
	import { isBeginnerCard, isAdvancedCard, isExpertCard } from './types';
	import ModularCard from './ModularCard.svelte';
	import TemplateCard from './TemplateCard.svelte';
	import CustomCard from './CustomCard.svelte';

	interface Props {
		card: Card;
		className?: string;
		editable?: boolean;
		onEdit?: (card: Card) => void;
		onDelete?: (id: string) => void;
		showMetadata?: boolean;
		userCardCustomization?: {
			cardBackgroundColor?: string;
			cardBorderColor?: string;
			cardLinkColor?: string;
			cardTextColor?: string;
		};
	}

	let {
		card,
		className = '',
		editable = false,
		onEdit = () => {},
		onDelete = () => {},
		showMetadata = false,
		userCardCustomization,
	}: Props = $props();

	// Determine variant classes and user customization styles
	let variantClasses = $derived(() => {
		const classes = {
			default: 'bg-white border border-gray-200',
			compact: 'bg-white border border-gray-200 p-4',
			hero: 'bg-gradient-to-br from-blue-500 to-purple-600 text-white',
			minimal: 'bg-transparent border-0',
			glass: 'bg-white/10 backdrop-blur-lg border border-white/20',
			gradient: 'bg-gradient-to-br from-blue-50 to-purple-50 border border-purple-200',
		};
		return classes[card.variant || 'default'] || classes.default;
	});

	// Generate CSS custom properties for user card customization
	let cardCustomStyles = $derived(() => {
		if (!userCardCustomization) return '';

		const styles = [];
		if (userCardCustomization.cardBackgroundColor) {
			styles.push(`--card-bg: ${userCardCustomization.cardBackgroundColor}`);
		}
		if (userCardCustomization.cardBorderColor) {
			styles.push(`--card-border: ${userCardCustomization.cardBorderColor}`);
		}
		if (userCardCustomization.cardLinkColor) {
			styles.push(`--card-links: ${userCardCustomization.cardLinkColor}`);
		}
		if (userCardCustomization.cardTextColor) {
			styles.push(`--card-text: ${userCardCustomization.cardTextColor}`);
		}

		return styles.join('; ');
	});

	// Handle edit click
	function handleEdit() {
		if (editable) {
			onEdit(card);
		}
	}

	// Handle delete click
	function handleDelete() {
		if (editable && card.id && confirm('Are you sure you want to delete this card?')) {
			onDelete(card.id);
		}
	}

	// Helper to get metadata from either Card or UnifiedCard
	function getMetadata() {
		if ('metadata' in card) {
			return card.metadata;
		}
		return undefined;
	}

	// Helper to get constraints from either Card or UnifiedCard
	function getConstraints() {
		if ('constraints' in card) {
			return card.constraints;
		}
		return undefined;
	}
</script>

<div
	class="card-renderer rounded-xl shadow-sm transition-all {variantClasses()} {className}"
	style={cardCustomStyles()}
	data-card-id={card.id}
	data-card-mode={card.config.mode}
>
	{#if editable}
		<div class="card-controls">
			<button onclick={handleEdit} class="control-button edit-button" title="Edit card">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
					/>
				</svg>
			</button>
			<button onclick={handleDelete} class="control-button delete-button" title="Delete card">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
				</svg>
			</button>
		</div>
	{/if}

	{#if isBeginnerCard(card.config)}
		<ModularCard
			modules={card.config.modules}
			theme={card.config.theme}
			layout={card.config.layout}
			animations={card.config.animations}
			{userCardCustomization}
		/>
	{:else if isAdvancedCard(card.config)}
		<TemplateCard
			template={card.config.template}
			css={card.config.css}
			variables={card.config.variables}
			values={card.config.values}
			constraints={getConstraints()}
		/>
	{:else if isExpertCard(card.config)}
		<CustomCard html={card.config.html} css={card.config.css} constraints={getConstraints()} />
	{:else}
		<div class="error-state">
			<svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
			<p>Unknown card mode: {card.config.mode}</p>
		</div>
	{/if}

	{#if (showMetadata || !editable) && getMetadata()?.name}
		<div class="card-metadata">
			<span class="metadata-name">{getMetadata()?.name}</span>
			{#if getMetadata()?.version}
				<span class="metadata-version">v{getMetadata()?.version}</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.card-renderer {
		position: relative;
		width: 100%;
		overflow: hidden;
		background-color: var(--card-bg, #ffffff);
		border-color: var(--card-border, #e2e8f0);
		color: var(--card-text, #0f172a);
	}

	.card-renderer :global(a),
	.card-renderer :global(.card-link),
	.card-renderer :global(.module-link) {
		color: var(--card-links, #0ea5e9);
	}

	.card-renderer :global(a:hover),
	.card-renderer :global(.card-link:hover),
	.card-renderer :global(.module-link:hover) {
		color: var(--card-links, #0ea5e9);
		opacity: 0.8;
	}

	.card-renderer:hover {
		box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
	}

	.card-controls {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: flex;
		gap: 0.25rem;
		z-index: 10;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.card-renderer:hover .card-controls {
		opacity: 1;
	}

	.control-button {
		padding: 0.375rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.control-button:hover {
		transform: scale(1.05);
	}

	.edit-button:hover {
		background: #3b82f6;
		color: white;
		border-color: #3b82f6;
	}

	.delete-button:hover {
		background: #ef4444;
		color: white;
		border-color: #ef4444;
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem;
		color: #ef4444;
		min-height: 200px;
	}

	.error-icon {
		width: 48px;
		height: 48px;
		margin-bottom: 0.5rem;
	}

	.card-metadata {
		position: absolute;
		bottom: 0.5rem;
		left: 0.5rem;
		display: flex;
		gap: 0.5rem;
		opacity: 0;
		transition: opacity 0.2s;
		pointer-events: none;
		z-index: 10;
	}

	.card-renderer:hover .card-metadata {
		opacity: 1;
	}

	.metadata-name,
	.metadata-version {
		padding: 0.125rem 0.5rem;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		font-size: 0.75rem;
		border-radius: 0.25rem;
	}

	.metadata-version {
		background: rgba(59, 130, 246, 0.8);
	}
</style>
