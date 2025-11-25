<script lang="ts">
	import type { Card } from './types';

	interface Props {
		card: Card;
		className?: string;
		showMetadata?: boolean;
		compact?: boolean;
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
		showMetadata = false,
		compact = false,
		userCardCustomization
	}: Props = $props();

	// Safe rendering function that won't break on errors
	function renderCard(card: Card) {
		try {
			if (!card?.config) return null;
			
			// Handle modular cards (beginner mode)
			if (card.config.mode === 'beginner' && card.config.modules) {
				return {
					type: 'modular',
					modules: card.config.modules || []
				};
			}
			
			// Handle template cards (advanced mode)
			if (card.config.mode === 'advanced' && card.config.template) {
				return {
					type: 'template',
					template: card.config.template,
					values: card.config.values || {}
				};
			}
			
			// Handle custom HTML cards (expert mode)
			if (card.config.mode === 'expert') {
				return {
					type: 'custom',
					html: card.config.html || '',
					css: card.config.css || ''
				};
			}
			
			return null;
		} catch (error) {
			console.error('Error rendering card:', error);
			return null;
		}
	}

	let cardData = $derived(renderCard(card));
	let headerModule = $derived(cardData?.modules?.find(m => m.type === 'header'));
	let linksModule = $derived(cardData?.modules?.find(m => m.type === 'links'));

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
</script>

<div class="safe-card-renderer rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden {className}" class:p-3={compact} class:p-6={!compact} style="{cardCustomStyles()}">
	{#if cardData?.type === 'modular'}
		<!-- Modular card rendering -->
		<div class="space-y-4">
			<!-- Header Module -->
			{#if headerModule}
				<div class="text-center">
					<!-- Avatar -->
					{#if headerModule.props?.avatar}
						<div class="mx-auto mb-3 h-16 w-16 overflow-hidden rounded-full bg-gray-100">
							<img 
								src={headerModule.props.avatar} 
								alt="Avatar" 
								class="h-full w-full object-cover"
								onerror={(e) => {
									e.currentTarget.style.display = 'none';
									if (e.currentTarget.nextElementSibling) {
										e.currentTarget.nextElementSibling.style.display = 'flex';
									}
								}}
							/>
							<div class="hidden h-full w-full items-center justify-center bg-gray-200 text-lg font-bold text-gray-600">
								{(headerModule.props?.title || 'U')[0].toUpperCase()}
							</div>
						</div>
					{:else if headerModule.props?.title}
						<div class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white">
							{headerModule.props.title[0].toUpperCase()}
						</div>
					{/if}

					<!-- Title and Subtitle -->
					{#if headerModule.props?.title}
						<h3 class="text-xl font-bold text-gray-900">{headerModule.props.title}</h3>
					{/if}
					{#if headerModule.props?.subtitle}
						<p class="mt-1 text-sm text-gray-600">{headerModule.props.subtitle}</p>
					{/if}
				</div>
			{/if}

			<!-- Links Module -->
			{#if linksModule?.props?.links && linksModule.props.links.length > 0}
				<div class="space-y-2">
					{#each linksModule.props.links as link}
						<div class="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
							{#if link.icon}
								<span class="text-lg">{link.icon}</span>
							{/if}
							<div class="min-w-0 flex-1">
								<div class="truncate font-medium text-gray-900">{link.title || link.original_url}</div>
								{#if link.description}
									<div class="truncate text-sm text-gray-600">{link.description}</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else if cardData?.type === 'template'}
		<!-- Template card rendering -->
		<div class="text-center">
			<h3 class="text-lg font-semibold text-gray-900">Template Card</h3>
			<p class="mt-2 text-sm text-gray-600">Template: {cardData.template}</p>
		</div>
	{:else if cardData?.type === 'custom'}
		<!-- Custom HTML card rendering -->
		<div class="text-center">
			<h3 class="text-lg font-semibold text-gray-900">Custom Card</h3>
			<p class="mt-2 text-sm text-gray-600">Custom HTML/CSS Card</p>
		</div>
	{:else}
		<!-- Fallback for invalid cards -->
		<div class="text-center">
			<div class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
				<svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
			</div>
			<h3 class="text-lg font-semibold text-gray-900">{card.title || card.metadata?.name || 'Unnamed Card'}</h3>
			{#if card.subtitle}
				<p class="mt-1 text-sm text-gray-600">{card.subtitle}</p>
			{/if}
		</div>
	{/if}

	<!-- Metadata -->
	{#if showMetadata}
		<div class="mt-4 border-t border-gray-200 pt-3">
			<div class="flex items-center justify-between text-xs text-gray-500">
				<span>{card.metadata?.name || 'Unnamed Card'}</span>
				<span>{card.config?.mode || 'unknown'} mode</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.safe-card-renderer {
		background-color: var(--card-bg, #ffffff);
		border-color: var(--card-border, #e2e8f0);
		color: var(--card-text, #0f172a);
	}

	.safe-card-renderer :global(a),
	.safe-card-renderer :global(.card-link) {
		color: var(--card-links, #0ea5e9);
	}

	.safe-card-renderer :global(a:hover),
	.safe-card-renderer :global(.card-link:hover) {
		color: var(--card-links, #0ea5e9);
		opacity: 0.8;
	}

	/* Apply card text color to various text elements */
	.safe-card-renderer :global(h1),
	.safe-card-renderer :global(h2),
	.safe-card-renderer :global(h3),
	.safe-card-renderer :global(h4),
	.safe-card-renderer :global(h5),
	.safe-card-renderer :global(h6),
	.safe-card-renderer :global(p),
	.safe-card-renderer :global(.text-gray-900) {
		color: var(--card-text, #0f172a);
	}
</style>