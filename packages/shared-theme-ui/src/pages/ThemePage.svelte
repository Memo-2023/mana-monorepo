<script lang="ts">
	import type { ThemeVariant, ThemeMode } from '@manacore/shared-theme';
	import { ArrowLeft, Sun, Moon, Desktop } from '@manacore/shared-icons';
	import type { ThemeCardData, ThemePageTranslations } from '../types';
	import { defaultTranslations } from '../types';
	import ThemeGrid from '../components/ThemeGrid.svelte';

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

		// Back navigation
		showBackButton?: boolean;
		onBack?: () => void;

		// Store Features (preparation)
		showLockedThemes?: boolean;
		onUnlockTheme?: (variant: ThemeVariant) => void;

		// Translations
		translations?: Partial<ThemePageTranslations>;
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
	}: Props = $props();

	// Merge translations with defaults
	const t = $derived({ ...defaultTranslations, ...translations });

	const modes: { mode: ThemeMode; icon: typeof Sun; label: string }[] = $derived([
		{ mode: 'light', icon: Sun, label: t.lightMode },
		{ mode: 'dark', icon: Moon, label: t.darkMode },
		{ mode: 'system', icon: Desktop, label: t.systemMode },
	]);
</script>

<div class="min-h-screen bg-background">
	<div class="max-w-4xl mx-auto px-4 py-8">
		<!-- Header -->
		<header class="mb-8">
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
			<section class="mb-8">
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
			/>
		</section>
	</div>
</div>
