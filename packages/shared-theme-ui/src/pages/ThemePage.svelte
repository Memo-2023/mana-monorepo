<script lang="ts">
	import type {
		ThemeVariant,
		ThemeMode,
		A11yStore,
		CustomThemesStore,
		CustomTheme,
		UserSettingsStore,
	} from '@manacore/shared-theme';
	import {
		ArrowLeft,
		Sun,
		Moon,
		Desktop,
		Plus,
		PaintBrush,
		Users,
		Palette,
	} from '@manacore/shared-icons';
	import type { ThemeCardData, ThemePageTranslations, A11yTranslations } from '../types';
	import { defaultTranslations, defaultA11yTranslations } from '../types';
	import ThemeGrid from '../components/ThemeGrid.svelte';
	import A11ySettings from '../components/A11ySettings.svelte';

	type TabType = 'themes' | 'custom' | 'community';

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

		// A11y Settings
		a11yStore?: A11yStore;
		showA11ySettings?: boolean;
		a11yTranslations?: Partial<A11yTranslations>;

		// Custom Themes (new)
		customThemesStore?: CustomThemesStore;
		showCustomThemes?: boolean;
		onCreateTheme?: () => void;
		onEditTheme?: (theme: CustomTheme) => void;
		onCommunityThemes?: () => void;

		// Theme Pinning (user settings)
		userSettingsStore?: UserSettingsStore;
		pinnedThemes?: ThemeVariant[];
		onTogglePin?: (variant: ThemeVariant) => void;
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
		customThemesStore,
		showCustomThemes = false,
		onCreateTheme,
		onEditTheme,
		onCommunityThemes,
		userSettingsStore,
		pinnedThemes = [],
		onTogglePin,
	}: Props = $props();

	// Active tab state
	let activeTab = $state<TabType>('themes');

	// Load custom themes when tab becomes active
	$effect(() => {
		if (activeTab === 'custom' && customThemesStore) {
			customThemesStore.loadCustomThemes();
		}
	});

	// Merge translations with defaults
	const t = $derived({ ...defaultTranslations, ...translations });
	const a11yT = $derived({ ...defaultA11yTranslations, ...a11yTranslations });

	const modes: { mode: ThemeMode; icon: typeof Sun; label: string }[] = $derived([
		{ mode: 'light', icon: Sun, label: t.lightMode },
		{ mode: 'dark', icon: Moon, label: t.darkMode },
		{ mode: 'system', icon: Desktop, label: t.systemMode },
	]);

	// Tab definitions
	const tabs: { id: TabType; label: string; icon: typeof Palette }[] = [
		{ id: 'themes', label: 'Themes', icon: Palette },
		{ id: 'custom', label: 'Meine Themes', icon: PaintBrush },
		{ id: 'community', label: 'Community', icon: Users },
	];

	function handleApplyCustomTheme(theme: CustomTheme) {
		customThemesStore?.applyCustomTheme(theme);
	}

	async function handleDeleteTheme(theme: CustomTheme) {
		if (confirm(`Theme "${theme.name}" wirklich löschen?`)) {
			await customThemesStore?.deleteTheme(theme.id);
		}
	}
</script>

<div class="min-h-screen bg-background">
	<div class="max-w-4xl mx-auto px-4 py-8">
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

		<!-- Tabs (if custom themes enabled) -->
		{#if showCustomThemes && customThemesStore}
			<nav class="flex gap-1 mb-6 p-1 bg-muted rounded-lg" role="tablist">
				{#each tabs as tab}
					<button
						type="button"
						class="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center
						{activeTab === tab.id
							? 'bg-surface text-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground'}"
						onclick={() => (activeTab = tab.id)}
						role="tab"
						aria-selected={activeTab === tab.id}
					>
						<svelte:component
							this={tab.icon}
							size={16}
							weight={activeTab === tab.id ? 'fill' : 'regular'}
						/>
						{tab.label}
					</button>
				{/each}
			</nav>
		{/if}

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

		<!-- Tab Content -->
		{#if !showCustomThemes || activeTab === 'themes'}
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
		{:else if activeTab === 'custom' && customThemesStore}
			<!-- Custom Themes -->
			<section>
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-sm font-medium text-muted-foreground">Meine Themes</h2>
					{#if onCreateTheme}
						<button
							type="button"
							onclick={onCreateTheme}
							class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
						>
							<Plus size={16} />
							Neues Theme
						</button>
					{/if}
				</div>

				{#if customThemesStore.loading}
					<div class="text-center py-8 text-muted-foreground">Lade...</div>
				{:else if customThemesStore.customThemes.length === 0}
					<div class="text-center py-12 border border-dashed border-border rounded-xl">
						<PaintBrush size={48} class="mx-auto mb-4 text-muted-foreground" weight="light" />
						<h3 class="text-lg font-semibold text-foreground mb-2">Noch keine eigenen Themes</h3>
						<p class="text-muted-foreground mb-4">
							Erstelle dein erstes eigenes Theme mit individuellen Farben.
						</p>
						{#if onCreateTheme}
							<button
								type="button"
								onclick={onCreateTheme}
								class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
							>
								<Plus size={16} />
								Theme erstellen
							</button>
						{/if}
					</div>
				{:else}
					<div class="grid gap-4 sm:grid-cols-2">
						{#each customThemesStore.customThemes as theme (theme.id)}
							<div class="bg-surface border border-border rounded-xl overflow-hidden">
								<!-- Color preview bar -->
								<div class="h-8 flex">
									<div
										class="flex-1"
										style="background-color: hsl({theme.lightColors.primary})"
									></div>
									<div
										class="flex-1"
										style="background-color: hsl({theme.lightColors.background})"
									></div>
									<div
										class="flex-1"
										style="background-color: hsl({theme.lightColors.surface})"
									></div>
									<div
										class="flex-1"
										style="background-color: hsl({theme.lightColors.foreground})"
									></div>
								</div>
								<div class="p-4">
									<div class="flex items-center gap-3 mb-2">
										<span class="text-xl">{theme.emoji}</span>
										<div class="flex-1 min-w-0">
											<h3 class="font-semibold text-foreground truncate">{theme.name}</h3>
											{#if theme.description}
												<p class="text-sm text-muted-foreground truncate">{theme.description}</p>
											{/if}
										</div>
										{#if theme.isPublished}
											<span
												class="px-2 py-0.5 text-xs font-medium bg-success/10 text-success rounded"
											>
												Veröffentlicht
											</span>
										{/if}
									</div>
									<div class="flex gap-2 mt-3">
										<button
											type="button"
											onclick={() => handleApplyCustomTheme(theme)}
											class="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
										>
											Anwenden
										</button>
										{#if onEditTheme}
											<button
												type="button"
												onclick={() => onEditTheme(theme)}
												class="px-3 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
											>
												Bearbeiten
											</button>
										{/if}
										<button
											type="button"
											onclick={() => handleDeleteTheme(theme)}
											class="px-3 py-2 bg-muted text-error rounded-lg text-sm font-medium hover:bg-error/10 transition-colors"
										>
											Löschen
										</button>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{:else if activeTab === 'community'}
			<!-- Community Themes -->
			<section>
				<div class="text-center py-12 border border-dashed border-border rounded-xl">
					<Users size={48} class="mx-auto mb-4 text-muted-foreground" weight="light" />
					<h3 class="text-lg font-semibold text-foreground mb-2">Community Themes</h3>
					<p class="text-muted-foreground mb-4">
						Entdecke Themes, die von anderen Nutzern erstellt wurden.
					</p>
					{#if onCommunityThemes}
						<button
							type="button"
							onclick={onCommunityThemes}
							class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
						>
							<Users size={16} />
							Community durchsuchen
						</button>
					{/if}
				</div>
			</section>
		{/if}

		<!-- A11y Settings -->
		{#if showA11ySettings && a11yStore}
			<section class="mt-8 pt-8 border-t border-border">
				<h2 class="text-sm font-medium text-muted-foreground mb-4">
					{a11yT.a11yTitle}
				</h2>
				<A11ySettings store={a11yStore} translations={a11yTranslations} />
			</section>
		{/if}
	</div>
</div>
