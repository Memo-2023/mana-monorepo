<script lang="ts">
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';

	interface Props {
		variant: ThemeVariant;
		mode: 'light' | 'dark';
		size?: 'sm' | 'md' | 'lg';
	}

	let { variant, mode, size = 'md' }: Props = $props();

	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-5 h-5',
		lg: 'w-6 h-6',
	};

	const gapClasses = {
		sm: '-ml-1.5',
		md: '-ml-2',
		lg: '-ml-2.5',
	};

	const colors = $derived(() => {
		const def = THEME_DEFINITIONS[variant];
		const themeColors = mode === 'dark' ? def.dark : def.light;
		return [
			{ name: 'primary', value: themeColors.primary },
			{ name: 'secondary', value: themeColors.secondary },
			{ name: 'background', value: themeColors.background },
			{ name: 'surface', value: themeColors.surface },
			{ name: 'muted', value: themeColors.muted },
		];
	});
</script>

<div class="flex items-center">
	{#each colors() as color, i}
		<div
			class="{sizeClasses[size]} rounded-full border border-white/20 shadow-sm {i > 0
				? gapClasses[size]
				: ''}"
			style="background-color: hsl({color.value}); z-index: {5 - i};"
			title={color.name}
		></div>
	{/each}
</div>
