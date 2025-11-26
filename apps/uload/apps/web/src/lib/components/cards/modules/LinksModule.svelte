<script lang="ts">
	import type { LinksModuleProps } from '../types';

	let {
		links = [],
		style = 'button',
		columns = 1,
		showDescription = false,
		showIcon = true,
		target = '_blank',
		buttonVariant = 'secondary',
		gap = 'md'
	}: LinksModuleProps = $props();

	let containerClass = $derived(() => {
		const columnClasses = {
			1: 'grid-cols-1',
			2: 'grid-cols-2'
		};

		const gapClasses = {
			sm: 'gap-2',
			md: 'gap-3',
			lg: 'gap-4'
		};

		return `grid ${columnClasses[columns] || 'grid-cols-1'} ${gapClasses[gap] || 'gap-3'}`;
	});

	function getButtonClass(variant: string = 'secondary') {
		const classes = {
			primary: 'bg-theme-primary text-theme-background hover:bg-theme-primary-hover',
			secondary:
				'bg-theme-surface hover:bg-theme-surface-hover text-theme-text border border-theme-border',
			ghost: 'text-theme-text hover:bg-theme-surface-hover',
			outline:
				'border-2 border-theme-primary text-theme-primary hover:bg-theme-primary hover:text-theme-background'
		};
		return classes[variant] || classes.secondary;
	}

	function getLinkStyleClass() {
		const baseClass = 'transition-all duration-200 rounded-lg';

		switch (style) {
			case 'button':
				return `${baseClass} ${getButtonClass(buttonVariant)} px-4 py-3 flex items-center justify-between group`;
			case 'list':
				return `${baseClass} px-3 py-2 hover:bg-theme-surface-hover flex items-center justify-between group`;
			case 'card':
				return `${baseClass} bg-theme-surface border border-theme-border hover:border-theme-accent hover:shadow-md px-4 py-3 flex items-center justify-between group`;
			default:
				return `${baseClass} ${getButtonClass(buttonVariant)} px-4 py-3 flex items-center justify-between group`;
		}
	}

	function handleClick(href: string) {
		if (href) {
			window.open(href, target);
		}
	}
</script>

<div class="links-module {containerClass()}">
	{#each links as link}
		<button
			onclick={() => handleClick(link.href)}
			class={getLinkStyleClass()}
			disabled={link.disabled}
			title={link.description || link.label}
		>
			<div class="flex flex-1 items-center gap-3 text-left">
				{#if showIcon && link.icon}
					<span class="flex-shrink-0 text-xl">{link.icon}</span>
				{/if}

				<div class="min-w-0 flex-1">
					<div class="truncate font-medium">
						{link.label}
					</div>
					{#if showDescription && link.description}
						<div class="truncate text-sm text-theme-text-muted">
							{link.description}
						</div>
					{/if}
				</div>
			</div>

			<svg
				class="h-5 w-5 flex-shrink-0 text-theme-text-muted transition-colors group-hover:text-theme-accent"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
				/>
			</svg>
		</button>
	{/each}
</div>

<style>
	.links-module button {
		width: 100%;
		text-align: left;
	}

	.links-module button:hover {
		transform: translateX(2px);
	}

	.links-module button:active {
		transform: scale(0.98);
	}

	@media (max-width: 640px) {
		.links-module {
			grid-template-columns: 1fr !important;
		}
	}
</style>
