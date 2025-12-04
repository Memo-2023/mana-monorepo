<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Input, Card, PageHeader } from '@manacore/shared-ui';
	import { authStore } from '$lib/stores/authStore.svelte';
	import { creditsService, type CreditBalance } from '$lib/api/credits';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import type { NavPosition, ThemeMode } from '@manacore/shared-theme';

	let loading = $state(true);
	let savingProfile = $state(false);
	let profileSuccess = $state(false);
	let profileError = $state<string | null>(null);

	// Form state
	let firstName = $state('');
	let lastName = $state('');

	// Credits data
	let creditBalance = $state<CreditBalance | null>(null);

	onMount(async () => {
		if (authStore.isAuthenticated) {
			try {
				creditBalance = await creditsService.getBalance();
				// Load user settings from server
				await userSettings.load();
			} catch (e) {
				console.error('Failed to load data:', e);
			}
		}
		loading = false;
	});

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
		await userSettings.updateGlobal({ theme: { ...userSettings.globalSettings.theme, mode } });
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

	function formatCredits(amount: number): string {
		return amount.toLocaleString('de-DE');
	}

	async function handleUpdateProfile() {
		savingProfile = true;
		profileSuccess = false;
		profileError = null;

		try {
			// TODO: Implement profile update API when available
			await new Promise((resolve) => setTimeout(resolve, 500));
			profileSuccess = true;
		} catch (e) {
			profileError = e instanceof Error ? e.message : 'Fehler beim Speichern';
		} finally {
			savingProfile = false;
		}
	}
</script>

<div>
	<PageHeader
		title="Einstellungen"
		description="Verwalte deine Kontoeinstellungen und Präferenzen"
		size="lg"
	/>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:else}
		<div class="space-y-6">
			<!-- Profile Section -->
			<Card>
				<div class="p-6">
					<div class="flex items-center gap-3 mb-6">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								/>
							</svg>
						</div>
						<div>
							<h2 class="text-lg font-semibold">Profil</h2>
							<p class="text-sm text-muted-foreground">Deine persönlichen Informationen</p>
						</div>
					</div>

					{#if profileSuccess}
						<div
							class="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400"
						>
							Profil erfolgreich aktualisiert!
						</div>
					{/if}

					{#if profileError}
						<div
							class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
						>
							{profileError}
						</div>
					{/if}

					<div class="space-y-4">
						<div>
							<label for="email" class="mb-2 block text-sm font-medium">E-Mail</label>
							<Input
								type="email"
								id="email"
								value={authStore.user?.email || ''}
								disabled
								class="bg-muted"
							/>
							<p class="mt-1 text-xs text-muted-foreground">E-Mail kann nicht geändert werden</p>
						</div>

						<div class="grid gap-4 sm:grid-cols-2">
							<div>
								<label for="firstName" class="mb-2 block text-sm font-medium">Vorname</label>
								<Input type="text" id="firstName" bind:value={firstName} placeholder="Max" />
							</div>

							<div>
								<label for="lastName" class="mb-2 block text-sm font-medium">Nachname</label>
								<Input type="text" id="lastName" bind:value={lastName} placeholder="Mustermann" />
							</div>
						</div>

						<Button onclick={handleUpdateProfile} loading={savingProfile} class="w-full sm:w-auto">
							{savingProfile ? 'Speichern...' : 'Änderungen speichern'}
						</Button>
					</div>
				</div>
			</Card>

			<!-- Default App Settings Section -->
			<Card>
				<div class="p-6">
					<div class="flex items-center gap-3 mb-6">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
						</div>
						<div>
							<h2 class="text-lg font-semibold">Standard App-Einstellungen</h2>
							<p class="text-sm text-muted-foreground">
								Diese Einstellungen gelten für alle Mana Apps
							</p>
						</div>
					</div>

					<div class="space-y-6">
						<!-- Navigation Settings -->
						<div class="space-y-4">
							<h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
								Navigation
							</h3>

							<div class="flex items-center justify-between py-3 border-b border-border">
								<div>
									<p class="font-medium">Position (Desktop)</p>
									<p class="text-sm text-muted-foreground">
										Position der Navigation auf großen Bildschirmen
									</p>
								</div>
								<div class="flex gap-2">
									<button
										class="px-4 py-2 text-sm font-medium rounded-lg transition-colors {userSettings
											.globalSettings.nav.desktopPosition === 'top'
											? 'bg-primary text-primary-foreground'
											: 'bg-surface-hover hover:bg-surface-hover/80'}"
										onclick={() => handleNavPositionChange('top')}
									>
										Oben
									</button>
									<button
										class="px-4 py-2 text-sm font-medium rounded-lg transition-colors {userSettings
											.globalSettings.nav.desktopPosition === 'bottom'
											? 'bg-primary text-primary-foreground'
											: 'bg-surface-hover hover:bg-surface-hover/80'}"
										onclick={() => handleNavPositionChange('bottom')}
									>
										Unten
									</button>
								</div>
							</div>

							<div class="flex items-center justify-between py-3">
								<div>
									<p class="font-medium">Sidebar eingeklappt</p>
									<p class="text-sm text-muted-foreground">Standard-Zustand der Sidebar</p>
								</div>
								<button
									class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {userSettings
										.globalSettings.nav.sidebarCollapsed
										? 'bg-primary'
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

						<!-- Theme Settings -->
						<div class="space-y-4">
							<h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
								Erscheinungsbild
							</h3>

							<div class="flex items-center justify-between py-3 border-b border-border">
								<div>
									<p class="font-medium">Farbmodus</p>
									<p class="text-sm text-muted-foreground">Hell, Dunkel oder automatisch</p>
								</div>
								<div class="flex gap-2">
									<button
										class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {userSettings
											.globalSettings.theme.mode === 'light'
											? 'bg-primary text-primary-foreground'
											: 'bg-surface-hover hover:bg-surface-hover/80'}"
										onclick={() => handleThemeModeChange('light')}
									>
										Hell
									</button>
									<button
										class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {userSettings
											.globalSettings.theme.mode === 'dark'
											? 'bg-primary text-primary-foreground'
											: 'bg-surface-hover hover:bg-surface-hover/80'}"
										onclick={() => handleThemeModeChange('dark')}
									>
										Dunkel
									</button>
									<button
										class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {userSettings
											.globalSettings.theme.mode === 'system'
											? 'bg-primary text-primary-foreground'
											: 'bg-surface-hover hover:bg-surface-hover/80'}"
										onclick={() => handleThemeModeChange('system')}
									>
										System
									</button>
								</div>
							</div>

							<div class="flex items-center justify-between py-3">
								<div>
									<p class="font-medium">Farbschema</p>
									<p class="text-sm text-muted-foreground">Akzentfarbe der Benutzeroberfläche</p>
								</div>
								<div class="flex gap-2">
									{#each [{ id: 'ocean', label: 'Ozean', color: 'bg-blue-500' }, { id: 'forest', label: 'Wald', color: 'bg-green-500' }, { id: 'sunset', label: 'Sonnenuntergang', color: 'bg-orange-500' }, { id: 'lavender', label: 'Lavendel', color: 'bg-purple-500' }] as scheme}
										<button
											class="w-8 h-8 rounded-full transition-all {scheme.color} {userSettings
												.globalSettings.theme.colorScheme === scheme.id
												? 'ring-2 ring-offset-2 ring-primary'
												: 'hover:scale-110'}"
											onclick={() => handleColorSchemeChange(scheme.id)}
											title={scheme.label}
										></button>
									{/each}
								</div>
							</div>
						</div>

						<!-- Language Settings -->
						<div class="space-y-4">
							<h3 class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
								Sprache
							</h3>

							<div class="flex items-center justify-between py-3">
								<div>
									<p class="font-medium">Anzeigesprache</p>
									<p class="text-sm text-muted-foreground">Sprache der Benutzeroberfläche</p>
								</div>
								<div class="flex gap-2">
									{#each [{ id: 'de', label: 'DE' }, { id: 'en', label: 'EN' }, { id: 'fr', label: 'FR' }, { id: 'es', label: 'ES' }, { id: 'it', label: 'IT' }] as lang}
										<button
											class="px-3 py-2 text-sm font-medium rounded-lg transition-colors {userSettings
												.globalSettings.locale === lang.id
												? 'bg-primary text-primary-foreground'
												: 'bg-surface-hover hover:bg-surface-hover/80'}"
											onclick={() => handleLocaleChange(lang.id)}
										>
											{lang.label}
										</button>
									{/each}
								</div>
							</div>
						</div>
					</div>

					{#if userSettings.syncing}
						<div class="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
							></div>
							<span>Einstellungen werden synchronisiert...</span>
						</div>
					{/if}
				</div>
			</Card>

			<!-- Credits Section -->
			<Card>
				<div class="p-6">
					<div class="flex items-center justify-between mb-6">
						<div class="flex items-center gap-3">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<div>
								<h2 class="text-lg font-semibold">Credits</h2>
								<p class="text-sm text-muted-foreground">Dein Guthaben für Mana Apps</p>
							</div>
						</div>
						<a href="/credits" class="text-sm text-primary hover:underline">Alle Details</a>
					</div>

					<div class="grid gap-4 sm:grid-cols-3">
						<div class="rounded-lg bg-surface-hover p-4 text-center">
							<p class="text-sm text-muted-foreground">Verfügbar</p>
							<p class="text-2xl font-bold text-primary">
								{creditBalance ? formatCredits(creditBalance.balance) : '...'}
							</p>
						</div>
						<div class="rounded-lg bg-surface-hover p-4 text-center">
							<p class="text-sm text-muted-foreground">Gratis heute</p>
							<p class="text-2xl font-bold text-green-600 dark:text-green-400">
								{creditBalance
									? `${creditBalance.freeCreditsRemaining}/${creditBalance.dailyFreeCredits}`
									: '...'}
							</p>
						</div>
						<div class="rounded-lg bg-surface-hover p-4 text-center">
							<p class="text-sm text-muted-foreground">Gesamt verbraucht</p>
							<p class="text-2xl font-bold">
								{creditBalance ? formatCredits(creditBalance.totalSpent) : '...'}
							</p>
						</div>
					</div>

					<div class="mt-4 flex gap-2">
						<a
							href="/credits?tab=packages"
							class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
						>
							Credits kaufen
						</a>
						<a
							href="/credits?tab=transactions"
							class="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-hover transition-colors"
						>
							Transaktionen
						</a>
					</div>
				</div>
			</Card>

			<!-- Account Section -->
			<Card>
				<div class="p-6">
					<div class="flex items-center gap-3 mb-6">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
								/>
							</svg>
						</div>
						<div>
							<h2 class="text-lg font-semibold">Konto</h2>
							<p class="text-sm text-muted-foreground">Konto- und Sicherheitsinformationen</p>
						</div>
					</div>

					<div class="space-y-4">
						<div class="flex items-center justify-between py-3 border-b border-border">
							<div>
								<p class="font-medium">Konto-Status</p>
								<p class="text-sm text-muted-foreground">Dein aktueller Kontostatus</p>
							</div>
							<span
								class="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400"
							>
								Aktiv
							</span>
						</div>

						<div class="flex items-center justify-between py-3 border-b border-border">
							<div>
								<p class="font-medium">Rolle</p>
								<p class="text-sm text-muted-foreground">Deine Berechtigungsstufe</p>
							</div>
							<span
								class="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
							>
								{authStore.user?.role || 'user'}
							</span>
						</div>

						<div class="flex items-center justify-between py-3">
							<div>
								<p class="font-medium">Benutzer-ID</p>
								<p class="text-sm text-muted-foreground">Deine eindeutige Kennung</p>
							</div>
							<code class="rounded bg-muted px-2 py-1 text-xs font-mono">
								{authStore.user?.sub?.slice(0, 8) || '...'}...
							</code>
						</div>
					</div>
				</div>
			</Card>

			<!-- Danger Zone -->
			<Card>
				<div class="p-6 border-red-200 dark:border-red-800">
					<div class="flex items-center gap-3 mb-6">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
						</div>
						<div>
							<h2 class="text-lg font-semibold text-red-600 dark:text-red-400">Gefahrenzone</h2>
							<p class="text-sm text-muted-foreground">Irreversible Aktionen</p>
						</div>
					</div>

					<div class="rounded-lg border border-red-200 dark:border-red-800 p-4">
						<div class="flex items-center justify-between">
							<div>
								<p class="font-medium text-red-600 dark:text-red-400">Konto löschen</p>
								<p class="text-sm text-muted-foreground">
									Das Löschen deines Kontos kann nicht rückgängig gemacht werden.
								</p>
							</div>
							<Button variant="destructive" disabled class="bg-red-600 hover:bg-red-700 text-white">
								Konto löschen
							</Button>
						</div>
					</div>
				</div>
			</Card>
		</div>
	{/if}
</div>
