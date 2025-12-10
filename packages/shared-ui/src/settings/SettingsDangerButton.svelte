<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Button label */
		label: string;
		/** Optional description */
		description?: string;
		/** Optional icon (Snippet for flexibility) */
		icon?: Snippet;
		/** Click handler */
		onclick: () => void;
		/** Button text (default: label) */
		buttonText?: string;
		/** Show border at bottom */
		border?: boolean;
		/** Disabled state */
		disabled?: boolean;
		/** Additional CSS classes */
		class?: string;
	}

	let {
		label,
		description,
		icon,
		onclick,
		buttonText,
		border = true,
		disabled = false,
		class: className = '',
	}: Props = $props();

	// Tailwind classes
	const baseClasses = 'flex items-center justify-between gap-4 px-5 py-4';
	const borderClasses = 'border-b border-red-500/[0.12] dark:border-red-500/[0.18] last:border-b-0';
	const disabledClasses = 'opacity-50 cursor-not-allowed';

	const iconClasses =
		'flex items-center justify-center flex-shrink-0 w-9 h-9 rounded-[0.625rem] bg-red-500/10 dark:bg-red-500/[0.15] text-red-500 dark:text-red-400 [&>svg]:w-[1.125rem] [&>svg]:h-[1.125rem]';
</script>

<div
	class="{baseClasses} {border ? borderClasses : ''} {disabled ? disabledClasses : ''} {className}"
>
	<div class="flex items-center gap-3 flex-1 min-w-0">
		{#if icon}
			<span class={iconClasses}>
				{@render icon()}
			</span>
		{/if}
		<div class="flex flex-col gap-0.5 min-w-0">
			<span class="text-[0.9375rem] font-medium text-gray-700 dark:text-gray-100">{label}</span>
			{#if description}
				<span class="text-[0.8125rem] text-gray-500 dark:text-gray-400 leading-snug"
					>{description}</span
				>
			{/if}
		</div>
	</div>

	<button
		type="button"
		{onclick}
		class="px-4 py-2 text-sm font-medium text-red-500 dark:text-red-400
			bg-red-500/10 dark:bg-red-500/[0.15] border border-red-500/20 dark:border-red-500/25
			rounded-lg cursor-pointer flex-shrink-0 transition-all duration-200
			hover:bg-red-500/20 dark:hover:bg-red-500/25 hover:border-red-500/30 dark:hover:border-red-500/35
			focus-visible:outline-2 focus-visible:outline-red-500/40 focus-visible:outline-offset-2
			disabled:cursor-not-allowed"
		{disabled}
	>
		{buttonText || label}
	</button>
</div>
