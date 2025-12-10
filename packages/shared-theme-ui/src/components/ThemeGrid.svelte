<script lang="ts">
	import type { ThemeVariant } from '@manacore/shared-theme';
	import { DEFAULT_THEME_VARIANTS, EXTENDED_THEME_VARIANTS } from '@manacore/shared-theme';
	import type { ThemeCardData, ThemePageTranslations } from '../types';
	import ThemeCard from './ThemeCard.svelte';

	interface Props {
		currentVariant: ThemeVariant;
		onSelect: (variant: ThemeVariant) => void;
		themes?: ThemeCardData[];
		onUnlock?: (variant: ThemeVariant) => void;
		showLockedThemes?: boolean;
		translations?: Partial<ThemePageTranslations>;
		/** Currently pinned themes (extended themes only) */
		pinnedThemes?: ThemeVariant[];
		/** Callback when pin status changes */
		onTogglePin?: (variant: ThemeVariant) => void;
		/** Whether to show extended themes section */
		showExtendedThemes?: boolean;
	}

	let {
		currentVariant,
		onSelect,
		themes,
		onUnlock,
		showLockedThemes = true,
		translations = {},
		pinnedThemes = [],
		onTogglePin,
		showExtendedThemes = true,
	}: Props = $props();

	// Build theme data for default themes
	const defaultThemeData = $derived(() => {
		if (themes) {
			const defaultThemes = themes.filter((t) => DEFAULT_THEME_VARIANTS.includes(t.variant));
			return showLockedThemes
				? defaultThemes
				: defaultThemes.filter((t) => t.status === 'available');
		}
		return DEFAULT_THEME_VARIANTS.map((variant) => ({
			variant,
			status: 'available' as const,
		}));
	});

	// Build theme data for extended themes
	const extendedThemeData = $derived(() => {
		if (themes) {
			const extendedThemes = themes.filter((t) => EXTENDED_THEME_VARIANTS.includes(t.variant));
			return showLockedThemes
				? extendedThemes
				: extendedThemes.filter((t) => t.status === 'available');
		}
		return EXTENDED_THEME_VARIANTS.map((variant) => ({
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

	function isThemePinned(variant: ThemeVariant): boolean {
		return pinnedThemes.includes(variant);
	}
</script>

<!-- Default Themes -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
	{#each defaultThemeData() as theme (theme.variant)}
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

<!-- Extended Themes -->
{#if showExtendedThemes && extendedThemeData().length > 0}
	<div class="mt-8">
		<h3 class="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
			Weitere Themes
			<span class="text-xs text-muted-foreground/70">(zum Anpinnen in der Navigation)</span>
		</h3>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each extendedThemeData() as theme (theme.variant)}
				<ThemeCard
					variant={theme.variant}
					isActive={currentVariant === theme.variant}
					status={theme.status}
					onClick={() => onSelect(theme.variant)}
					onUnlock={onUnlock ? () => onUnlock(theme.variant) : undefined}
					canPin={true}
					isPinned={isThemePinned(theme.variant)}
					{onTogglePin}
					translations={cardTranslations}
				/>
			{/each}
		</div>
	</div>
{/if}
