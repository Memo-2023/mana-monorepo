<script lang="ts">
	import type {
		UserSettingsStore,
		NavPosition,
		ThemeMode,
		WeekStartDay,
	} from '@manacore/shared-theme';
	import { getAvailableRoutes, getDefaultRoute } from '@manacore/shared-theme';
	import SettingsSection from './SettingsSection.svelte';
	import SettingsCard from './SettingsCard.svelte';
	import NavVisibilitySettings from './NavVisibilitySettings.svelte';

	interface Props {
		/** User settings store instance */
		userSettings: UserSettingsStore;
		/** App ID for start page selection */
		appId?: string;
		/** Whether to show navigation settings */
		showNavigation?: boolean;
		/** Whether to show nav visibility settings */
		showNavVisibility?: boolean;
		/** Whether to show theme settings */
		showTheme?: boolean;
		/** Whether to show language settings */
		showLanguage?: boolean;
		/** Whether to show general settings (start page, sounds, week start) */
		showGeneral?: boolean;
		/** Section title */
		title?: string;
		/** Section description */
		description?: string;
		/** Translation function (optional, falls back to German) */
		t?: (key: string) => string;
	}

	let {
		userSettings,
		appId,
		showNavigation = true,
		showNavVisibility = true,
		showTheme = true,
		showLanguage = true,
		showGeneral = true,
		title = 'App-Einstellungen',
		description = 'Diese Einstellungen gelten für alle Mana Apps',
		t = (key: string) => key,
	}: Props = $props();

	// Available routes for start page selection
	const availableRoutes = $derived(appId ? getAvailableRoutes(appId) : []);
	const defaultRoute = $derived(appId ? getDefaultRoute(appId) : '/');
	const currentStartPage = $derived(
		appId ? userSettings.general?.startPages?.[appId] || defaultRoute : '/'
	);

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

	// Start page handler
	async function handleStartPageChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		if (appId) {
			await userSettings.setStartPage(appId, target.value);
		}
	}

	// Week start handler
	async function handleWeekStartChange(day: WeekStartDay) {
		await userSettings.updateGeneral({ weekStartsOn: day });
	}

	// Sounds handler
	async function handleSoundsChange(enabled: boolean) {
		await userSettings.updateGeneral({ soundsEnabled: enabled });
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
						<h3
							class="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider"
						>
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

						<div
							class="flex items-center justify-between py-2 border-t border-[hsl(var(--border))]"
						>
							<div>
								<p class="font-medium text-[hsl(var(--foreground))]">Sidebar eingeklappt</p>
								<p class="text-sm text-[hsl(var(--muted-foreground))]">
									Standard-Zustand der Sidebar
								</p>
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

				{#if showNavVisibility && appId}
					<!-- Navigation Visibility Settings -->
					<div
						class="space-y-4 {showNavigation ? 'pt-4 border-t border-[hsl(var(--border))]' : ''}"
					>
						<NavVisibilitySettings {userSettings} {appId} {t} />
					</div>
				{/if}

				{#if showTheme}
					<!-- Theme Settings -->
					<div
						class="space-y-4 {showNavigation || (showNavVisibility && appId)
							? 'pt-4 border-t border-[hsl(var(--border))]'
							: ''}"
					>
						<h3
							class="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider"
						>
							Erscheinungsbild
						</h3>

						<div class="flex items-center justify-between py-2">
							<div>
								<p class="font-medium text-[hsl(var(--foreground))]">Farbmodus</p>
								<p class="text-sm text-[hsl(var(--muted-foreground))]">
									Hell, Dunkel oder automatisch
								</p>
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

						<div
							class="flex items-center justify-between py-2 border-t border-[hsl(var(--border))]"
						>
							<div>
								<p class="font-medium text-[hsl(var(--foreground))]">Farbschema</p>
								<p class="text-sm text-[hsl(var(--muted-foreground))]">
									Akzentfarbe der Benutzeroberfläche
								</p>
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
						class="space-y-4 {showTheme || showNavigation || (showNavVisibility && appId)
							? 'pt-4 border-t border-[hsl(var(--border))]'
							: ''}"
					>
						<h3
							class="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider"
						>
							Sprache
						</h3>

						<div class="flex items-center justify-between py-2">
							<div>
								<p class="font-medium text-[hsl(var(--foreground))]">Anzeigesprache</p>
								<p class="text-sm text-[hsl(var(--muted-foreground))]">
									Sprache der Benutzeroberfläche
								</p>
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

				{#if showGeneral}
					<!-- General Settings -->
					<div
						class="space-y-4 {showLanguage ||
						showTheme ||
						showNavigation ||
						(showNavVisibility && appId)
							? 'pt-4 border-t border-[hsl(var(--border))]'
							: ''}"
					>
						<h3
							class="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider"
						>
							Allgemein
						</h3>

						{#if appId && availableRoutes.length > 1}
							<!-- Start Page Selector -->
							<div class="flex items-center justify-between py-2">
								<div>
									<p class="font-medium text-[hsl(var(--foreground))]">Startseite</p>
									<p class="text-sm text-[hsl(var(--muted-foreground))]">
										Welche Seite beim Öffnen der App angezeigt wird
									</p>
								</div>
								<select
									class="px-3 py-1.5 text-sm font-medium rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border-none cursor-pointer appearance-none pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.5rem_center] bg-[length:1rem]"
									value={currentStartPage}
									onchange={handleStartPageChange}
								>
									{#each availableRoutes as route}
										<option value={route.path}>
											{t(route.labelKey)}
										</option>
									{/each}
								</select>
							</div>
						{/if}

						<!-- Week Start Day -->
						<div
							class="flex items-center justify-between py-2 {appId && availableRoutes.length > 1
								? 'border-t border-[hsl(var(--border))]'
								: ''}"
						>
							<div>
								<p class="font-medium text-[hsl(var(--foreground))]">Wochenstart</p>
								<p class="text-sm text-[hsl(var(--muted-foreground))]">
									Erster Tag der Woche in Kalendern
								</p>
							</div>
							<div class="flex gap-2">
								<button
									class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {userSettings
										.general?.weekStartsOn === 'monday'
										? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
										: 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 text-[hsl(var(--foreground))]'}"
									onclick={() => handleWeekStartChange('monday')}
								>
									Montag
								</button>
								<button
									class="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {userSettings
										.general?.weekStartsOn === 'sunday'
										? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
										: 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 text-[hsl(var(--foreground))]'}"
									onclick={() => handleWeekStartChange('sunday')}
								>
									Sonntag
								</button>
							</div>
						</div>

						<!-- Sounds Toggle -->
						<div
							class="flex items-center justify-between py-2 border-t border-[hsl(var(--border))]"
						>
							<div>
								<p class="font-medium text-[hsl(var(--foreground))]">Sounds</p>
								<p class="text-sm text-[hsl(var(--muted-foreground))]">
									Sound-Effekte in allen Apps
								</p>
							</div>
							<button
								class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {(userSettings
									.general?.soundsEnabled ?? true)
									? 'bg-[hsl(var(--primary))]'
									: 'bg-gray-200 dark:bg-gray-700'}"
								onclick={() => handleSoundsChange(!(userSettings.general?.soundsEnabled ?? true))}
							>
								<span
									class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {(userSettings
										.general?.soundsEnabled ?? true)
										? 'translate-x-6'
										: 'translate-x-1'}"
								></span>
							</button>
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
