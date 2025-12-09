<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Row label */
		label: string;
		/** Optional description */
		description?: string;
		/** Optional icon (Snippet for flexibility) */
		icon?: Snippet;
		/** Toggle state */
		isOn: boolean;
		/** Toggle handler */
		onToggle: (value: boolean) => void;
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
		isOn = false,
		onToggle,
		border = true,
		disabled = false,
		class: className = '',
	}: Props = $props();

	function handleToggle() {
		if (!disabled) {
			onToggle(!isOn);
		}
	}

	// Tailwind classes
	const baseClasses = 'flex items-center justify-between gap-4 px-5 py-4';
	const borderClasses = 'border-b border-black/[0.08] dark:border-white/10 last:border-b-0';
	const disabledClasses = 'opacity-50 cursor-not-allowed';

	const iconClasses =
		'flex items-center justify-center flex-shrink-0 w-9 h-9 rounded-[0.625rem] bg-black/[0.04] dark:bg-white/[0.08] text-primary [&>svg]:w-[1.125rem] [&>svg]:h-[1.125rem]';
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
		onclick={handleToggle}
		class="relative w-12 h-7 rounded-full border flex-shrink-0 transition-all duration-200
			{isOn
			? 'bg-primary border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.2)] dark:shadow-[0_0_0_2px_hsl(var(--primary)/0.3)]'
			: 'bg-black/[0.08] border-black/10 dark:bg-white/[0.12] dark:border-white/[0.15]'}
			{!disabled ? 'cursor-pointer hover:border-black/20 dark:hover:border-white/25' : 'cursor-not-allowed'}
			focus-visible:outline-2 focus-visible:outline-primary/40 focus-visible:outline-offset-2"
		role="switch"
		aria-checked={isOn}
		aria-label={label}
		{disabled}
	>
		<span
			class="absolute top-[1px] left-[1px] w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200
				{isOn ? 'translate-x-5' : ''}"
		></span>
	</button>
</div>
