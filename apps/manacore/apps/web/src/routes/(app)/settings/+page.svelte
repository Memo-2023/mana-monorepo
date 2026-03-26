<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Input, Card, PageHeader, GlobalSettingsSection } from '@manacore/shared-ui';
	import { PasskeyManager, TwoFactorSetup } from '@manacore/shared-auth-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { creditsService } from '$lib/api/credits';
	import type { CreditBalance } from '$lib/api/credits';
	import { profileService } from '$lib/api/profile';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { APP_VERSION } from '$lib/version';
	import { ManaCoreEvents } from '@manacore/shared-utils/analytics';

	let loading = $state(true);
	let passkeys = $state<any[]>([]);
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
				passkeys = await authStore.listPasskeys();
				// Load user settings from server
				await userSettings.load();
			} catch (e) {
				console.error('Failed to load data:', e);
			}
		}
		loading = false;
	});

	function formatCredits(amount: number): string {
		return amount.toLocaleString('de-DE');
	}

	async function handleUpdateProfile() {
		const name = `${firstName} ${lastName}`.trim();
		if (!name) {
			profileError = 'Bitte gib einen Namen ein';
			return;
		}

		savingProfile = true;
		profileSuccess = false;
		profileError = null;

		try {
			await profileService.updateProfile({ name });
			profileSuccess = true;
			ManaCoreEvents.profileUpdated();
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

			<!-- Global Settings Section (synced across all apps) -->
			<GlobalSettingsSection {userSettings} appId="manacore" />

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

			<!-- Passkeys Section -->
			<Card>
				<div class="p-6">
					<PasskeyManager
						{passkeys}
						passkeyAvailable={authStore.isPasskeyAvailable()}
						onRegister={(name) => authStore.registerPasskey(name)}
						onDelete={(id) => authStore.deletePasskey(id)}
						onRename={(id, name) => authStore.renamePasskey(id, name)}
						onRefresh={async () => {
							passkeys = await authStore.listPasskeys();
						}}
						primaryColor="#6366f1"
					/>
				</div>
			</Card>

			<!-- Two-Factor Authentication Section -->
			<Card>
				<div class="p-6">
					<TwoFactorSetup
						enabled={!!authStore.user?.twoFactorEnabled}
						onEnable={(password) => authStore.enableTwoFactor(password)}
						onDisable={(password) => authStore.disableTwoFactor(password)}
						onGenerateBackupCodes={(password) => authStore.generateBackupCodes(password)}
						primaryColor="#6366f1"
					/>
				</div>
			</Card>

			<!-- My Data & Danger Zone -->
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
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
						</div>
						<div>
							<h2 class="text-lg font-semibold">Meine Daten (DSGVO)</h2>
							<p class="text-sm text-muted-foreground">Datenschutz und Datenexport</p>
						</div>
					</div>

					<div class="space-y-4">
						<div class="flex items-center justify-between py-3 border-b border-border">
							<div>
								<p class="font-medium">Daten ansehen & exportieren</p>
								<p class="text-sm text-muted-foreground">
									Sieh alle deine gespeicherten Daten ein und exportiere sie als JSON
								</p>
							</div>
							<a
								href="/settings/my-data"
								class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
							>
								Meine Daten
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</a>
						</div>

						<div
							class="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 p-4"
						>
							<div class="flex items-center justify-between">
								<div>
									<p class="font-medium text-red-600 dark:text-red-400">Konto loschen</p>
									<p class="text-sm text-muted-foreground">
										Das Loschen deines Kontos kann nicht ruckgangig gemacht werden.
									</p>
								</div>
								<a
									href="/settings/my-data"
									class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
								>
									Verwalten
								</a>
							</div>
						</div>
					</div>
				</div>
			</Card>
		</div>

		<p class="mt-8 pb-4 text-center text-xs text-gray-400 dark:text-gray-600">v{APP_VERSION}</p>
	{/if}
</div>
