<script lang="ts">
	import { Check } from '@manacore/shared-icons';

	/**
	 * Generic color picker with predefined palette.
	 * Renders a grid of color circles with selection indicator.
	 */

	interface Props {
		/** Available colors (hex strings) */
		colors: string[];
		/** Currently selected color */
		selectedColor?: string;
		/** Called when a color is selected */
		onColorChange: (color: string) => void;
		/** Button size */
		size?: 'sm' | 'md' | 'lg';
		/** Accessible label for the group */
		label?: string;
	}

	let {
		colors,
		selectedColor,
		onColorChange,
		size = 'md',
		label = 'Farbe wählen',
	}: Props = $props();

	const sizeClasses = {
		sm: 'w-6 h-6',
		md: 'w-8 h-8',
		lg: 'w-10 h-10',
	};

	const iconSizes = {
		sm: 12,
		md: 14,
		lg: 18,
	};

	const gapClasses = {
		sm: 'gap-1.5',
		md: 'gap-2',
		lg: 'gap-2.5',
	};

	function handleKeyDown(e: KeyboardEvent, hex: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onColorChange(hex);
		}
	}
</script>

<div class="flex flex-wrap {gapClasses[size]}" role="radiogroup" aria-label={label}>
	{#each colors as color}
		{@const isSelected = selectedColor?.toLowerCase() === color.toLowerCase()}
		<button
			type="button"
			class="
				{sizeClasses[size]}
				rounded-full
				flex items-center justify-center
				transition-all duration-150
				ring-offset-2 ring-offset-white dark:ring-offset-gray-900
				focus:outline-none focus:ring-2 focus:ring-primary
				{isSelected ? 'ring-2 ring-black/30 dark:ring-white/50 scale-110' : 'hover:scale-110'}
			"
			style="background-color: {color}"
			onclick={() => onColorChange(color)}
			onkeydown={(e) => handleKeyDown(e, color)}
			role="radio"
			aria-checked={isSelected}
			aria-label={color}
			title={color}
		>
			{#if isSelected}
				<Check size={iconSizes[size]} weight="bold" class="text-white drop-shadow-sm" />
			{/if}
		</button>
	{/each}
</div>
