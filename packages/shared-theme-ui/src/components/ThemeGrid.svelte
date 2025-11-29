<script lang="ts">
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { THEME_VARIANTS } from '@manacore/shared-theme';
	import type { ThemeCardData, ThemePageTranslations } from '../types';
	import ThemeCard from './ThemeCard.svelte';

	interface Props {
		currentVariant: ThemeVariant;
		onSelect: (variant: ThemeVariant) => void;
		themes?: ThemeCardData[];
		onUnlock?: (variant: ThemeVariant) => void;
		showLockedThemes?: boolean;
		translations?: Partial<ThemePageTranslations>;
	}

	let {
		currentVariant,
		onSelect,
		themes,
		onUnlock,
		showLockedThemes = true,
		translations = {},
	}: Props = $props();

	// Build theme data - use provided themes or create defaults from THEME_VARIANTS
	const themeData = $derived(() => {
		if (themes) {
			return showLockedThemes ? themes : themes.filter((t) => t.status === 'available');
		}
		// Default: all variants are available
		return THEME_VARIANTS.map((variant) => ({
			variant,
			status: 'available' as const,
		}));
	});

	const cardTranslations = $derived({
		locked: translations.locked,
		comingSoon: translations.comingSoon,
		premium: translations.premium,
		unlock: translations.unlock,
		lightPreview: translations.lightPreview,
		darkPreview: translations.darkPreview,
	});
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
	{#each themeData() as theme (theme.variant)}
		<ThemeCard
			variant={theme.variant}
			isActive={currentVariant === theme.variant}
			status={theme.status}
			onClick={() => onSelect(theme.variant)}
			onUnlock={onUnlock ? () => onUnlock(theme.variant) : undefined}
			translations={cardTranslations}
		/>
	{/each}
</div>
