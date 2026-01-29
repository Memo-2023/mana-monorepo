<script lang="ts">
	import { matrixStore } from '$lib/matrix';
	import { goto } from '$app/navigation';
	import {
		ArrowLeft,
		User,
		Bell,
		Palette,
		Shield,
		SignOut,
		HardDrive,
		ShieldCheck,
		ShieldWarning,
		Key,
		DeviceMobile,
		CircleNotch,
		BellRinging,
		SpeakerHigh,
		Eye,
	} from '@manacore/shared-icons';
	import { VerificationDialog, RecoveryKeyDialog } from '$lib/components/crypto';
	import {
		getNotificationSettings,
		saveNotificationSettings,
		getNotificationPermission,
		requestNotificationPermission,
		isNotificationSupported,
	} from '$lib/notifications';
	import { browser } from '$app/environment';

	let verificationDialogOpen = $state(false);
	let recoveryDialogOpen = $state(false);
	let recoveryDialogMode = $state<'setup' | 'restore'>('setup');

	// Notification settings
	let notificationSettings = $state(getNotificationSettings());
	let notificationPermission = $state<NotificationPermission | 'unsupported'>(
		browser ? getNotificationPermission() : 'default'
	);
	let notificationsSupported = browser && isNotificationSupported();

	async function handleRequestPermission() {
		const permission = await requestNotificationPermission();
		notificationPermission = permission;
	}

	function updateNotificationSetting(key: keyof typeof notificationSettings, value: boolean) {
		notificationSettings = { ...notificationSettings, [key]: value };
		saveNotificationSettings({ [key]: value });
	}

	// Crypto status derived
	let cryptoReady = $derived(matrixStore.cryptoReady);
	let verificationStatus = $derived(matrixStore.verificationStatus);
	let keyBackupEnabled = $derived(matrixStore.keyBackupEnabled);
	let deviceId = $derived(matrixStore.getDeviceId());

	function handleLogout() {
		matrixStore.logout();
		goto('/login');
	}

	function openRecoveryDialog(mode: 'setup' | 'restore') {
		recoveryDialogMode = mode;
		recoveryDialogOpen = true;
	}
</script>

<div class="flex h-screen flex-col bg-background">
	<!-- Header -->
	<header class="flex items-center gap-4 border-b border-border p-4">
		<a href="/chat" class="btn-ghost rounded-full p-2">
			<ArrowLeft class="h-5 w-5" />
		</a>
		<h1 class="text-xl font-bold">Einstellungen</h1>
	</header>

	<!-- Content -->
	<div class="flex-1 overflow-y-auto p-4">
		<div class="mx-auto max-w-2xl space-y-6">
			<!-- Profile Section -->
			<section class="card">
				<div class="space-y-4">
					<h2 class="flex items-center gap-2 text-lg font-semibold">
						<User class="h-5 w-5" />
						Profil
					</h2>
					<div class="flex items-center gap-4">
						<div
							class="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground"
						>
							<span class="text-2xl">
								{matrixStore.userId?.charAt(1).toUpperCase() || '?'}
							</span>
						</div>
						<div>
							<p class="font-medium">{matrixStore.userId}</p>
							<p class="text-sm text-muted-foreground">Matrix ID</p>
						</div>
					</div>
				</div>
			</section>

			<!-- Server Section -->
			<section class="card">
				<div class="space-y-4">
					<h2 class="flex items-center gap-2 text-lg font-semibold">
						<HardDrive class="h-5 w-5" />
						Server
					</h2>
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Homeserver</span>
							<span class="font-mono">{matrixStore.client?.getHomeserverUrl() || 'Unbekannt'}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Sync Status</span>
							<span class={matrixStore.isReady ? 'badge badge-success' : 'badge badge-warning'}>
								{matrixStore.syncState}
							</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Räume</span>
							<span>{matrixStore.rooms.length}</span>
						</div>
					</div>
				</div>
			</section>

			<!-- Security Section -->
			<section class="card">
				<div class="space-y-4">
					<h2 class="flex items-center gap-2 text-lg font-semibold">
						<Shield class="h-5 w-5" />
						Sicherheit & Verschlüsselung
					</h2>

					{#if !cryptoReady}
						<div class="flex items-center gap-3 text-warning">
							<CircleNotch class="h-5 w-5 animate-spin" />
							<span>Verschlüsselung wird initialisiert...</span>
						</div>
					{:else}
						<div class="space-y-4">
							<!-- Verification Status -->
							<div class="flex items-center justify-between rounded-lg bg-muted p-4">
								<div class="flex items-center gap-3">
									{#if verificationStatus === 'verified'}
										<ShieldCheck class="h-8 w-8 text-success" />
									{:else}
										<ShieldWarning class="h-8 w-8 text-warning" />
									{/if}
									<div>
										<p class="font-medium">
											{verificationStatus === 'verified' ? 'Verifiziert' : 'Nicht verifiziert'}
										</p>
										<p class="text-sm text-muted-foreground">
											{verificationStatus === 'verified'
												? 'Dein Gerät ist verifiziert'
												: 'Verifiziere dein Gerät für bessere Sicherheit'}
										</p>
									</div>
								</div>
								<button
									class="btn-primary flex items-center gap-2 text-sm"
									onclick={() => (verificationDialogOpen = true)}
								>
									<DeviceMobile class="h-4 w-4" />
									Geräte
								</button>
							</div>

							<!-- Current Device -->
							<div class="text-sm">
								<div class="flex justify-between">
									<span class="text-muted-foreground">Geräte-ID</span>
									<span class="font-mono">{deviceId || 'Unbekannt'}</span>
								</div>
							</div>

							<!-- Key Backup -->
							<div class="flex items-center justify-between rounded-lg bg-muted p-4">
								<div class="flex items-center gap-3">
									<Key class={`h-8 w-8 ${keyBackupEnabled ? 'text-success' : 'text-warning'}`} />
									<div>
										<p class="font-medium">
											{keyBackupEnabled ? 'Schlüssel-Backup aktiv' : 'Kein Schlüssel-Backup'}
										</p>
										<p class="text-sm text-muted-foreground">
											{keyBackupEnabled
												? 'Deine Nachrichten werden gesichert'
												: 'Richte ein Backup ein, um Nachrichten wiederherzustellen'}
										</p>
									</div>
								</div>
								{#if keyBackupEnabled}
									<button class="btn-ghost text-sm" onclick={() => openRecoveryDialog('restore')}>
										Wiederherstellen
									</button>
								{:else}
									<button class="btn-primary text-sm" onclick={() => openRecoveryDialog('setup')}>
										Einrichten
									</button>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</section>

			<!-- Appearance Section (Placeholder) -->
			<section class="card">
				<div class="space-y-2">
					<h2 class="flex items-center gap-2 text-lg font-semibold">
						<Palette class="h-5 w-5" />
						Erscheinungsbild
					</h2>
					<p class="text-sm text-muted-foreground">Theme-Einstellungen folgen bald...</p>
				</div>
			</section>

			<!-- Notifications Section -->
			<section class="card">
				<div class="space-y-4">
					<h2 class="flex items-center gap-2 text-lg font-semibold">
						<Bell class="h-5 w-5" />
						Benachrichtigungen
					</h2>

					{#if !notificationsSupported}
						<p class="text-sm text-muted-foreground">
							Dein Browser unterstützt keine Benachrichtigungen.
						</p>
					{:else if notificationPermission === 'denied'}
						<div class="rounded-lg bg-error/10 p-4 text-sm">
							<p class="font-medium text-error">Benachrichtigungen blockiert</p>
							<p class="mt-1 text-muted-foreground">
								Du hast Benachrichtigungen für diese Seite blockiert. Bitte ändere die Einstellung
								in deinem Browser.
							</p>
						</div>
					{:else if notificationPermission === 'default'}
						<div class="flex items-center justify-between rounded-lg bg-muted p-4">
							<div class="flex items-center gap-3">
								<BellRinging class="h-8 w-8 text-primary" />
								<div>
									<p class="font-medium">Benachrichtigungen aktivieren</p>
									<p class="text-sm text-muted-foreground">
										Erhalte Benachrichtigungen für neue Nachrichten
									</p>
								</div>
							</div>
							<button class="btn-primary text-sm" onclick={handleRequestPermission}>
								Erlauben
							</button>
						</div>
					{:else}
						<div class="space-y-3">
							<!-- Enable/Disable Toggle -->
							<label class="flex items-center justify-between rounded-lg bg-muted p-4 cursor-pointer">
								<div class="flex items-center gap-3">
									<BellRinging class="h-6 w-6" />
									<div>
										<p class="font-medium">Benachrichtigungen</p>
										<p class="text-sm text-muted-foreground">
											Desktop-Benachrichtigungen für neue Nachrichten
										</p>
									</div>
								</div>
								<input
									type="checkbox"
									class="toggle toggle-primary"
									checked={notificationSettings.enabled}
									onchange={() =>
										updateNotificationSetting('enabled', !notificationSettings.enabled)}
								/>
							</label>

							<!-- Sound Toggle -->
							<label
								class="flex items-center justify-between rounded-lg bg-muted p-4 cursor-pointer {!notificationSettings.enabled ? 'opacity-50' : ''}"
							>
								<div class="flex items-center gap-3">
									<SpeakerHigh class="h-6 w-6" />
									<div>
										<p class="font-medium">Ton</p>
										<p class="text-sm text-muted-foreground">Ton bei neuen Nachrichten abspielen</p>
									</div>
								</div>
								<input
									type="checkbox"
									class="toggle toggle-primary"
									checked={notificationSettings.sound}
									disabled={!notificationSettings.enabled}
									onchange={() => updateNotificationSetting('sound', !notificationSettings.sound)}
								/>
							</label>

							<!-- Preview Toggle -->
							<label
								class="flex items-center justify-between rounded-lg bg-muted p-4 cursor-pointer {!notificationSettings.enabled ? 'opacity-50' : ''}"
							>
								<div class="flex items-center gap-3">
									<Eye class="h-6 w-6" />
									<div>
										<p class="font-medium">Vorschau anzeigen</p>
										<p class="text-sm text-muted-foreground">
											Nachrichteninhalt in Benachrichtigung anzeigen
										</p>
									</div>
								</div>
								<input
									type="checkbox"
									class="toggle toggle-primary"
									checked={notificationSettings.showPreview}
									disabled={!notificationSettings.enabled}
									onchange={() =>
										updateNotificationSetting('showPreview', !notificationSettings.showPreview)}
								/>
							</label>
						</div>
					{/if}
				</div>
			</section>

			<!-- Logout -->
			<section class="card">
				<button
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-error p-3 text-white hover:brightness-90"
					onclick={handleLogout}
				>
					<SignOut class="h-5 w-5" />
					Abmelden
				</button>
			</section>
		</div>
	</div>
</div>

<!-- Dialogs -->
<VerificationDialog
	open={verificationDialogOpen}
	onClose={() => (verificationDialogOpen = false)}
/>
<RecoveryKeyDialog
	open={recoveryDialogOpen}
	mode={recoveryDialogMode}
	onClose={() => (recoveryDialogOpen = false)}
/>
