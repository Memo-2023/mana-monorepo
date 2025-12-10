<script lang="ts">
	import { Check } from '@manacore/shared-icons';
	import { TAG_COLORS, DEFAULT_TAG_COLOR } from './constants';

	interface Props {
		selectedColor?: string;
		onColorChange: (color: string) => void;
		size?: 'sm' | 'md' | 'lg';
	}

	let { selectedColor = DEFAULT_TAG_COLOR, onColorChange, size = 'md' }: Props = $props();

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

	function handleColorSelect(hex: string) {
		onColorChange(hex);
	}

	function handleKeyDown(e: KeyboardEvent, hex: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleColorSelect(hex);
		}
	}
</script>

<div class="flex flex-wrap {gapClasses[size]}" role="radiogroup" aria-label="Tag color">
	{#each TAG_COLORS as color}
		{@const isSelected = selectedColor?.toLowerCase() === color.hex.toLowerCase()}
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
			style="background-color: {color.hex}"
			onclick={() => handleColorSelect(color.hex)}
			onkeydown={(e) => handleKeyDown(e, color.hex)}
			role="radio"
			aria-checked={isSelected}
			aria-label={color.name}
			title={color.name}
		>
			{#if isSelected}
				<Check size={iconSizes[size]} weight="bold" class="text-white drop-shadow-sm" />
			{/if}
		</button>
	{/each}
</div>
