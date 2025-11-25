<script lang="ts">
	import type { ActionsModuleProps } from '../types';

	let { actions = [], layout = 'horizontal', alignment = 'left' }: ActionsModuleProps = $props();

	let containerClass = $derived(() => {
		const layoutClasses = {
			horizontal: 'flex flex-wrap gap-2',
			vertical: 'flex flex-col gap-2',
			grid: 'grid grid-cols-2 gap-2'
		};

		const alignmentClasses = {
			left: 'justify-start',
			center: 'justify-center',
			right: 'justify-end',
			between: 'justify-between'
		};

		return `${layoutClasses[layout]} ${layout === 'horizontal' ? alignmentClasses[alignment] : ''}`;
	});

	function getButtonClass(variant: string = 'primary') {
		const classes = {
			primary: 'bg-theme-primary text-theme-background hover:bg-theme-primary-hover',
			secondary: 'bg-theme-surface-hover text-theme-text hover:bg-theme-border',
			ghost: 'text-theme-text hover:bg-theme-surface-hover',
			link: 'text-theme-accent hover:text-theme-accent-hover underline-offset-4 hover:underline'
		};
		return `${classes[variant] || classes.primary} rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`;
	}

	function handleClick(action: any) {
		if (action.href) {
			window.open(action.href, '_blank');
		} else if (action.action) {
			action.action();
		}
	}
</script>

<div class="actions-module {containerClass()}">
	{#each actions as action}
		<button
			onclick={() => handleClick(action)}
			class={getButtonClass(action.variant)}
			disabled={action.disabled}
		>
			{#if action.icon}
				<span class="mr-2">{action.icon}</span>
			{/if}
			{action.label}
		</button>
	{/each}
</div>
