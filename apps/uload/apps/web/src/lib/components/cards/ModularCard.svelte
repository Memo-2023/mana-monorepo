<script lang="ts">
	import type { Module, Theme } from './types';
	import { moduleEventBus } from '$lib/services/moduleEventBus';
	import HeaderModule from './modules/HeaderModule.svelte';
	import ContentModule from './modules/ContentModule.svelte';
	import MediaModule from './modules/MediaModule.svelte';
	import StatsModule from './modules/StatsModule.svelte';
	import ActionsModule from './modules/ActionsModule.svelte';
	import FooterModule from './modules/FooterModule.svelte';
	import LinksModule from './modules/LinksModule.svelte';

	interface Props {
		modules: Module[];
		theme?: Theme;
		layout?: {
			columns?: number;
			gap?: string;
			padding?: string;
		};
		animations?: {
			hover?: boolean;
			entrance?: 'fade' | 'slide' | 'scale' | 'none';
		};
		className?: string;
		userCardCustomization?: {
			cardBackgroundColor?: string;
			cardBorderColor?: string;
			cardLinkColor?: string;
			cardTextColor?: string;
		};
	}

	let {
		modules = [],
		theme,
		layout = { columns: 1, gap: '1rem', padding: '1.5rem' },
		animations = {},
		className = '',
		userCardCustomization,
	}: Props = $props();

	// Module component map
	const moduleComponents = {
		header: HeaderModule,
		content: ContentModule,
		media: MediaModule,
		stats: StatsModule,
		actions: ActionsModule,
		footer: FooterModule,
		links: LinksModule,
	};

	// Sort modules by order - create a copy to avoid mutation
	// Also ensure modules is an array to prevent errors
	let sortedModules = $derived(() => {
		if (!Array.isArray(modules)) return [];
		return [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
	});

	// Generate CSS variables from theme and user customization
	let themeStyles = $derived(() => {
		const styles = [];

		// Add theme colors
		if (theme?.colors) {
			styles.push(...Object.entries(theme.colors).map(([key, value]) => `--${key}: ${value}`));
		}

		// Add user card customization (takes priority)
		if (userCardCustomization) {
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
		}

		return styles.join('; ');
	});

	// Animation classes
	let animationClass = $derived(() => {
		if (!animations?.entrance || animations.entrance === 'none') return '';

		const classes = {
			fade: 'animate-fade-in',
			slide: 'animate-slide-up',
			scale: 'animate-scale-in',
		};

		return classes[animations.entrance] || '';
	});

	// Grid styles
	let gridStyles = $derived(() => {
		const styles = [];

		if (layout?.columns && layout.columns > 1) {
			styles.push(`display: grid`);
			styles.push(`grid-template-columns: repeat(${layout.columns}, 1fr)`);
			styles.push(`gap: ${layout.gap || '1rem'}`);
		}

		if (layout?.padding) {
			styles.push(`padding: ${layout.padding}`);
		}

		return styles.join('; ');
	});

	// Check if module should be visible
	function isModuleVisible(module: Module): boolean {
		if (!module.visibility || module.visibility === 'always') return true;

		if (typeof window === 'undefined') return true;

		const width = window.innerWidth;
		const isMobile = width < 768;

		if (module.visibility === 'mobile') return isMobile;
		if (module.visibility === 'desktop') return !isMobile;

		return true;
	}

	// Handle module events
	function handleModuleEvent(moduleId: string, event: string, data: any) {
		moduleEventBus.emit(`module:${event}`, {
			moduleId,
			data,
		});
	}
</script>

<div class="modular-card {animationClass()} {className}" style="{themeStyles()} {gridStyles()}">
	{#each sortedModules() as module (module.id)}
		{#if isModuleVisible(module) && moduleComponents[module.type]}
			<div
				class="module-wrapper {module.className || ''}"
				data-module-id={module.id}
				data-module-type={module.type}
				style={module.grid
					? `
					grid-column: ${module.grid.col || 'auto'} / span ${module.grid.colSpan || 1};
					grid-row: ${module.grid.row || 'auto'} / span ${module.grid.rowSpan || 1};
				`
					: ''}
			>
				<svelte:component
					this={moduleComponents[module.type]}
					{...module.props}
					onEvent={(event, data) => handleModuleEvent(module.id, event, data)}
				/>
			</div>
		{/if}
	{/each}
</div>

<style>
	.modular-card {
		width: 100%;
		min-height: 100px;
	}

	.module-wrapper {
		position: relative;
	}

	/* Animations */
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slide-up {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes scale-in {
		from {
			transform: scale(0.95);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}

	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}

	.animate-scale-in {
		animation: scale-in 0.3s ease-out;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.modular-card {
			display: block !important;
		}

		.module-wrapper {
			grid-column: 1 !important;
			grid-row: auto !important;
			margin-bottom: 1rem;
		}

		.module-wrapper:last-child {
			margin-bottom: 0;
		}
	}
</style>
