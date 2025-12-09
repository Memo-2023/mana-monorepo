<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Row label */
		label: string;
		/** Optional description */
		description?: string;
		/** Optional icon (Snippet for flexibility) */
		icon?: Snippet;
		/** Make the entire row clickable */
		href?: string;
		/** Click handler (alternative to href) */
		onclick?: () => void;
		/** Show border at bottom */
		border?: boolean;
		/** Disabled state */
		disabled?: boolean;
		/** Additional CSS classes */
		class?: string;
		/** Control element (Toggle, Button, etc.) */
		children?: Snippet;
	}

	let {
		label,
		description,
		icon,
		href,
		onclick,
		border = true,
		disabled = false,
		class: className = '',
		children,
	}: Props = $props();

	const isClickable = $derived(!!href || !!onclick);

	// Tailwind classes
	const baseRowClasses =
		'flex items-center justify-between gap-4 px-5 py-4 bg-transparent w-full text-left no-underline transition-all duration-200';

	const borderClasses = 'border-b border-black/[0.08] dark:border-white/10 last:border-b-0';

	const clickableClasses = 'cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.06]';

	const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';

	const iconClasses =
		'flex items-center justify-center flex-shrink-0 w-9 h-9 rounded-[0.625rem] bg-black/[0.04] dark:bg-white/[0.08] text-primary';

	function getRowClasses(isBordered: boolean, isClick: boolean, isDisabled: boolean): string {
		let classes = baseRowClasses;
		if (isBordered) classes += ' ' + borderClasses;
		if (isClick) classes += ' ' + clickableClasses;
		if (isDisabled) classes += ' ' + disabledClasses;
		return classes;
	}
</script>

{#if href}
	<a {href} class="{getRowClasses(border, true, disabled)} {className}">
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
		<div class="flex items-center flex-shrink-0">
			{#if children}
				{@render children()}
			{:else}
				<svg
					class="w-5 h-5 text-gray-400 dark:text-gray-500"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			{/if}
		</div>
	</a>
{:else if onclick}
	<button type="button" {onclick} class="{getRowClasses(border, true, disabled)} {className}" {disabled}>
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
		<div class="flex items-center flex-shrink-0">
			{#if children}
				{@render children()}
			{:else}
				<svg
					class="w-5 h-5 text-gray-400 dark:text-gray-500"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			{/if}
		</div>
	</button>
{:else}
	<div class="{getRowClasses(border, false, disabled)} {className}">
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
		{#if children}
			<div class="flex items-center flex-shrink-0">
				{@render children()}
			</div>
		{/if}
	</div>
{/if}

<style>
	/* Keep SVG sizing for icons passed via snippet */
	:global(svg) {
		width: 1.125rem;
		height: 1.125rem;
	}
</style>
