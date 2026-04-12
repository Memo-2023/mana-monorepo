<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ThemeVariant, ThemeMode, A11yStore, UserSettingsStore } from '@mana/shared-theme';
	import { ArrowLeft, Sun, Moon, Desktop } from '@mana/shared-icons';
	import type { ThemeCardData, ThemePageTranslations, A11yTranslations } from '../types';
	import { defaultTranslations, defaultA11yTranslations } from '../types';
	import ThemeGrid from '../components/ThemeGrid.svelte';
	import A11ySettings from '../components/A11ySettings.svelte';

	interface Props {
		// Theme Store Integration
		currentVariant: ThemeVariant;
		onSelectTheme: (variant: ThemeVariant) => void;

		// Theme Data (for store extension)
		themes?: ThemeCardData[];

		// UI Customization
		title?: string;
		subtitle?: string;
		showModeSelector?: boolean;
		currentMode?: ThemeMode;
		onModeChange?: (mode: ThemeMode) => void;

		// Back navigation (deprecated — use PageHeader sticky on the consuming page instead)
		showBackButton?: boolean;
		onBack?: () => void;

		// Store Features (preparation)
		showLockedThemes?: boolean;
		onUnlockTheme?: (variant: ThemeVariant) => void;

		// Translations
		translations?: Partial<ThemePageTranslations>;

		// A11y Settings
		a11yStore?: A11yStore;
		showA11ySettings?: boolean;
		a11yTranslations?: Partial<A11yTranslations>;

		// Theme Pinning (user settings)
		userSettingsStore?: UserSettingsStore;
		pinnedThemes?: ThemeVariant[];
		onTogglePin?: (variant: ThemeVariant) => void;

		// Visual
		/** Make outer wrapper transparent (so a wallpaper layer behind it shows through). */
		transparent?: boolean;

		/** Extra content rendered below the theme grid (e.g. wallpaper picker). */
		children?: Snippet;
	}

	let {
		currentVariant,
		onSelectTheme,
		themes,
		title,
		subtitle,
		showModeSelector = false,
		currentMode = 'system',
		onModeChange,
		showBackButton = false,
		onBack,
		showLockedThemes = true,
		onUnlockTheme,
		translations = {},
		a11yStore,
		showA11ySettings = false,
		a11yTranslations = {},
		pinnedThemes = [],
		onTogglePin,
		transparent = false,
		children,
	}: Props = $props();

	// Merge translations with defaults
	const t = $derived({ ...defaultTranslations, ...translations });
	const a11yT = $derived({ ...defaultA11yTranslations, ...a11yTranslations });

	const modes: { mode: ThemeMode; icon: typeof Sun; label: string }[] = $derived([
		{ mode: 'light', icon: Sun, label: t.lightMode },
		{ mode: 'dark', icon: Moon, label: t.darkMode },
		{ mode: 'system', icon: Desktop, label: t.systemMode },
	]);
</script>

<div class="min-h-screen" class:bg-background={!transparent}>
	<div class="max-w-3xl mx-auto px-4 py-8" class:theme-page-card={transparent}>
		<!-- Header -->
		<header class="mb-6">
			<div class="flex items-center gap-3 mb-2">
				{#if showBackButton && onBack}
					<button
						type="button"
						onclick={onBack}
						class="p-2 -ml-2 text-muted-foreground hover:text-foreground
                       hover:bg-muted rounded-lg transition-colors"
						aria-label="Zurück"
					>
						<ArrowLeft size={20} weight="bold" />
					</button>
				{/if}
				<h1 class="text-2xl font-bold text-foreground">
					{title ?? t.title}
				</h1>
			</div>
			<p class="text-muted-foreground">
				{subtitle ?? t.subtitle}
			</p>
		</header>

		<!-- Mode Selector -->
		{#if showModeSelector && onModeChange}
			<section class="mb-6">
				<h2 class="text-sm font-medium text-muted-foreground mb-3">
					{t.modeLabel}
				</h2>
				<div class="inline-flex rounded-lg bg-muted p-1">
					{#each modes as { mode, icon: Icon, label }}
						<button
							type="button"
							onclick={() => onModeChange(mode)}
							class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                           {currentMode === mode
								? 'bg-surface text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'}"
						>
							<Icon size={16} weight={currentMode === mode ? 'fill' : 'regular'} />
							{label}
						</button>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Theme Grid -->
		<section>
			<h2 class="text-sm font-medium text-muted-foreground mb-4">
				{t.currentTheme}
			</h2>
			<ThemeGrid
				{currentVariant}
				onSelect={onSelectTheme}
				{themes}
				onUnlock={onUnlockTheme}
				{showLockedThemes}
				{translations}
				{pinnedThemes}
				{onTogglePin}
			/>
		</section>

		<!-- A11y Settings -->
		{#if showA11ySettings && a11yStore}
			<section class="mt-8 pt-8 border-t border-border">
				<h2 class="text-sm font-medium text-muted-foreground mb-4">
					{a11yT.a11yTitle}
				</h2>
				<A11ySettings store={a11yStore} translations={a11yTranslations} />
			</section>
		{/if}

		<!-- Extra content (e.g. wallpaper picker) -->
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>

<style>
	.theme-page-card {
		background: hsl(var(--color-card, 0 0% 100%) / 0.82);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: 1.25rem;
		margin-top: 2rem;
		margin-bottom: 2rem;
		padding-left: 2rem;
		padding-right: 2rem;
		border: 1px solid hsl(var(--color-border) / 0.2);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
	}
</style>
