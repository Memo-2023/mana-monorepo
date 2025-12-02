<script lang="ts">
	import type { UserSettingsStore, NavPosition, ThemeMode } from '@manacore/shared-theme';
	import SettingsSection from './SettingsSection.svelte';
	import SettingsCard from './SettingsCard.svelte';

	interface Props {
		/** User settings store instance */
		userSettings: UserSettingsStore;
		/** Whether to show navigation settings */
		showNavigation?: boolean;
		/** Whether to show theme settings */
		showTheme?: boolean;
		/** Whether to show language settings */
		showLanguage?: boolean;
		/** Section title */
		title?: string;
		/** Section description */
		description?: string;
	}

	let {
		userSettings,
		showNavigation = true,
		showTheme = true,
		showLanguage = true,
		title = 'App-Einstellungen',
		description = 'Diese Einstellungen gelten für alle Mana Apps',
	}: Props = $props();

	// Navigation position handler
	async function handleNavPositionChange(position: NavPosition) {
		await userSettings.updateGlobal({
			nav: { ...userSettings.globalSettings.nav, desktopPosition: position },
		});
	}

	// Sidebar collapsed handler
	async function handleSidebarChange(collapsed: boolean) {
		await userSettings.updateGlobal({
			nav: { ...userSettings.globalSettings.nav, sidebarCollapsed: collapsed },
		});
	}

	// Theme mode handler
	async function handleThemeModeChange(mode: ThemeMode) {
		await userSettings.updateGlobal({
			theme: { ...userSettings.globalSettings.theme, mode },
		});
	}

	// Color scheme handler
	async function handleColorSchemeChange(colorScheme: string) {
		await userSettings.updateGlobal({
			theme: { ...userSettings.globalSettings.theme, colorScheme },
		});
	}

	// Locale handler
	async function handleLocaleChange(locale: string) {
		await userSettings.updateGlobal({ locale });
	}

	const colorSchemes = [
		{ id: 'ocean', label: 'Ozean', color: 'bg-blue-500' },
		{ id: 'nature', label: 'Natur', color: 'bg-green-500' },
		{ id: 'lume', label: 'Lume', color: 'bg-amber-500' },
		{ id: 'stone', label: 'Stein', color: 'bg-slate-500' },
	];

	const languages = [
		{ id: 'de', label: 'DE' },
		{ id: 'en', label: 'EN' },
		{ id: 'fr', label: 'FR' },
		{ id: 'es', label: 'ES' },
		{ id: 'it', label: 'IT' },
	];
</script>

<SettingsSection {title}>
	{#snippet icon()}
		<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
			/>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
			/>
		</svg>
	{/snippet}

	<SettingsCard>
		<div class="p-5">
			<p class="text-sm text-[hsl(var(--muted-foreground))] mb-6">{description}</p>

			<div class="space-y-6">
				{#if showNavigation}
					<!-- Navigation Settings -->
					<div class="space-y-4">
						<h3 class="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
							Navigation
						</h3>

						<div class="flex items-center justify-between py-2">
							<div>
								<p class="font-medium text-[hsl(var(--foreground))]">Position (Desktop)</p>
								<p class="text-sm text-[hsl(var(--muted-foreground))]">
									Position der Navigation auf großen Bildschirmen
								</p>
							</div>
							<div class="flex gap-2">
								<button
									class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {userSettings
										.globalSettings.nav.desktopPosition === 'top'
										? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
										: 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 text-[hsl(var(--foreground))]'}"
									onclick={() => handleNavPositionChange('top')}
								>
									Oben
								</button>
								<button
									class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {userSettings
										.globalSettings.nav.desktopPosition === 'bottom'
										? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
										: 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 text-[hsl(var(--foreground))]'}"
									onclick={() => handleNavPositionChange('bottom')}
								>
									Unten
								</button>
							</div>
						</div>

						<div class="flex items-center justify-between py-2 border-t border-[hsl(var(--border))]">
							<div>
								<p class="font-medium text-[hsl(var(--foreground))]">Sidebar eingeklappt</p>
								<p class="text-sm text-[hsl(var(--muted-foreground))]">Standard-Zustand der Sidebar</p>
							</div>
							<button
								class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {userSettings
									.globalSettings.nav.sidebarCollapsed
									? 'bg-[hsl(var(--primary))]'
									: 'bg-gray-200 dark:bg-gray-700'}"
								onclick={() =>
									handleSidebarChange(!userSettings.globalSettings.nav.sidebarCollapsed)}
							>
								<span
									class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {userSettings
										.globalSettings.nav.sidebarCollapsed
										? 'translate-x-6'
										: 'translate-x-1'}"
								></span>
							</button>
						</div>
					</div>
				{/if}

				{#if showTheme}
					<!-- Theme Settings -->
					<div class="space-y-4 {showNavigation ? 'pt-4 border-t border-[hsl(var(--border))]' : ''}">
						<h3 class="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
							Erscheinungsbild
						</h3>

						<div class="flex items-center justify-between py-2">
							<div>
								<p class="font-medium text-[hsl(var(--foreground))]">Farbmodus</p>
								<p class="text-sm text-[hsl(var(--muted-foreground))]">Hell, Dunkel oder automatisch</p>
							</div>
							<div class="flex gap-1">
								{#each ['light', 'dark', 'system'] as mode}
									<button
										class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {userSettings
											.globalSettings.theme.mode === mode
											? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
											: 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 text-[hsl(var(--foreground))]'}"
										onclick={() => handleThemeModeChange(mode as ThemeMode)}
									>
										{mode === 'light' ? 'Hell' : mode === 'dark' ? 'Dunkel' : 'System'}
									</button>
								{/each}
							</div>
						</div>

						<div class="flex items-center justify-between py-2 border-t border-[hsl(var(--border))]">
							<div>
								<p class="font-medium text-[hsl(var(--foreground))]">Farbschema</p>
								<p class="text-sm text-[hsl(var(--muted-foreground))]">Akzentfarbe der Benutzeroberfläche</p>
							</div>
							<div class="flex gap-2">
								{#each colorSchemes as scheme}
									<button
										class="w-7 h-7 rounded-full transition-all {scheme.color} {userSettings
											.globalSettings.theme.colorScheme === scheme.id
											? 'ring-2 ring-offset-2 ring-[hsl(var(--primary))]'
											: 'hover:scale-110'}"
										onclick={() => handleColorSchemeChange(scheme.id)}
										title={scheme.label}
									></button>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				{#if showLanguage}
					<!-- Language Settings -->
					<div
						class="space-y-4 {showTheme || showNavigation
							? 'pt-4 border-t border-[hsl(var(--border))]'
							: ''}"
					>
						<h3 class="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
							Sprache
						</h3>

						<div class="flex items-center justify-between py-2">
							<div>
								<p class="font-medium text-[hsl(var(--foreground))]">Anzeigesprache</p>
								<p class="text-sm text-[hsl(var(--muted-foreground))]">Sprache der Benutzeroberfläche</p>
							</div>
							<div class="flex gap-1">
								{#each languages as lang}
									<button
										class="px-2.5 py-1.5 text-sm font-medium rounded-lg transition-colors {userSettings
											.globalSettings.locale === lang.id
											? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
											: 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 text-[hsl(var(--foreground))]'}"
										onclick={() => handleLocaleChange(lang.id)}
									>
										{lang.label}
									</button>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>

			{#if userSettings.syncing}
				<div class="mt-4 flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-[hsl(var(--primary))] border-t-transparent"
					></div>
					<span>Synchronisiere...</span>
				</div>
			{/if}
		</div>
	</SettingsCard>
</SettingsSection>
