<script lang="ts">
	import type { Snippet } from 'svelte';

	interface SelectOption {
		value: string | number | null;
		label: string;
	}

	interface Props {
		/** Row label */
		label: string;
		/** Optional description */
		description?: string;
		/** Optional icon (Snippet for flexibility) */
		icon?: Snippet;
		/** Available options */
		options: SelectOption[];
		/** Current selected value */
		value: string | number | null;
		/** Change handler */
		onchange: (value: string | number | null) => void;
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
		options,
		value,
		onchange,
		border = true,
		disabled = false,
		class: className = '',
	}: Props = $props();

	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const rawValue = target.value;

		// Handle null values (stored as empty string in select)
		if (rawValue === '') {
			onchange(null);
			return;
		}

		// Try to parse as number if the original options had numbers
		const numValue = Number(rawValue);
		if (!isNaN(numValue) && options.some((o) => o.value === numValue)) {
			onchange(numValue);
		} else {
			onchange(rawValue);
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

	<select
		class="min-w-32 px-3 pr-8 py-2 text-sm font-medium text-gray-700 dark:text-gray-100
			bg-black/[0.04] dark:bg-white/[0.08] border border-black/10 dark:border-white/[0.15]
			rounded-lg cursor-pointer appearance-none transition-all duration-200
			hover:border-black/20 dark:hover:border-white/25 hover:bg-black/[0.06] dark:hover:bg-white/[0.12]
			focus-visible:outline-2 focus-visible:outline-primary/40 focus-visible:outline-offset-2 focus-visible:border-primary
			disabled:cursor-not-allowed disabled:opacity-60
			bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]
			dark:bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]
			bg-no-repeat bg-[right_0.5rem_center] bg-[length:1rem]"
		value={value ?? ''}
		onchange={handleChange}
		{disabled}
		aria-label={label}
	>
		{#each options as option}
			<option
				value={option.value ?? ''}
				class="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100">{option.label}</option
			>
		{/each}
	</select>
</div>
