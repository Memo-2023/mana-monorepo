<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from '@manacore/shared-icons';

	interface Props {
		/** Row label */
		label: string;
		/** Optional description */
		description?: string;
		/** Optional icon (Snippet for flexibility) */
		icon?: Snippet;
		/** Current value (HH:mm format, null = not set) */
		value: string | null;
		/** Change handler */
		onchange: (value: string | null) => void;
		/** Placeholder text when empty */
		placeholder?: string;
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
		value,
		onchange,
		placeholder = '--:--',
		border = true,
		disabled = false,
		class: className = '',
	}: Props = $props();

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const rawValue = target.value.trim();

		if (rawValue === '') {
			onchange(null);
			return;
		}

		// Validate HH:mm format
		if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(rawValue)) {
			onchange(rawValue);
		}
	}

	function handleClear() {
		onchange(null);
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

	<div class="flex items-center gap-1">
		<input
			type="time"
			class="w-24 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-100 text-center
				bg-black/[0.04] dark:bg-white/[0.08] border border-black/10 dark:border-white/[0.15]
				rounded-lg transition-all duration-200
				hover:border-black/20 dark:hover:border-white/25 hover:bg-black/[0.06] dark:hover:bg-white/[0.12]
				focus-visible:outline-2 focus-visible:outline-primary/40 focus-visible:outline-offset-2 focus-visible:border-primary
				disabled:cursor-not-allowed disabled:opacity-60
				[&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer
				dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:opacity-70"
			value={value ?? ''}
			oninput={handleInput}
			{placeholder}
			{disabled}
			aria-label={label}
		/>
		{#if value}
			<button
				type="button"
				class="flex items-center justify-center w-7 h-7 p-0 text-gray-500 dark:text-gray-400 bg-transparent border-none rounded-md cursor-pointer transition-all duration-200
					hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20
					disabled:cursor-not-allowed disabled:opacity-50"
				onclick={handleClear}
				aria-label="Clear time"
				{disabled}
			>
				<X size={20} />
			</button>
		{/if}
	</div>
</div>
