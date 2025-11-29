<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, user } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { settings } from '$lib/stores/settings';
	import type { ThemeMode } from '$lib/stores/theme';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		SettingsToggle,
		SettingsDangerZone,
		SettingsDangerButton,
	} from '@manacore/shared-ui';

	// theme is a Svelte 5 runes-based store, access properties directly
	let currentMode = $derived(theme.mode);
	let currentUser = $derived($user);
	let currentSettings = $derived($settings);

	// Theme mode options
	const themeModes: { label: string; value: ThemeMode; icon: string }[] = [
		{ label: 'System', value: 'system', icon: 'sync' },
		{ label: 'Light', value: 'light', icon: 'sunny' },
		{ label: 'Dark', value: 'dark', icon: 'moon' },
	];

	function setThemeMode(mode: ThemeMode) {
		theme.setMode(mode);
		activeMode = mode;
	}

	let activeMode = $state<ThemeMode>(currentMode);

	// Update activeMode when theme changes
	$effect(() => {
		activeMode = currentMode;
	});

	// Collapsible sections state
	let showUIElements = $state(false);
	let showMoreSettings = $state(false);

	async function handleLogout() {
		await auth.signOut();
		goto('/login');
	}

	// Support functions
	function handleContactSupport() {
		const subject = encodeURIComponent('Memoro Support Request');
		const body = encodeURIComponent(
			`Hi Memoro Team,\n\n[Please describe your issue here]\n\n---\nUser: ${currentUser?.email || 'N/A'}\nVersion: 0.1.0 (Web)\nBrowser: ${navigator.userAgent}`
		);
		window.location.href = `mailto:support@memoro.com?subject=${subject}&body=${body}`;
	}

	function handleRateApp() {
		alert('Thank you for your interest! Rating feature coming soon for the web version.');
	}

	// Copy app info
	function copyAppInfo() {
		const infoText = `Memoro Web App Information
Version: 0.1.0
Platform: Web
Build: Beta
Browser: ${navigator.userAgent}
User: ${currentUser?.email || 'N/A'}`;

		navigator.clipboard.writeText(infoText).then(() => {
			alert('App information copied to clipboard!');
		});
	}

	// Easter egg for developer mode
	let clickCount = $state(0);
	function handleVersionClick() {
		clickCount++;
		if (clickCount >= 7) {
			clickCount = 0;
			const newMode = !currentSettings.developerMode;
			settings.setDeveloperMode(newMode);
			alert(
				newMode
					? 'Developer Mode activated! Advanced settings are now visible.'
					: 'Developer Mode deactivated.'
			);
		}
	}

	// Delete account confirmation
	function handleDeleteAccount() {
		const confirmed = confirm(
			'Are you sure you want to delete your account?\n\nThis action cannot be undone. All your data will be permanently deleted.'
		);
		if (confirmed) {
			const doubleConfirm = confirm(
				'This is your last chance. Type your email to confirm deletion:\n\n' + currentUser?.email
			);
			if (doubleConfirm) {
				alert('Account deletion feature coming soon. Please contact support@memoro.com for now.');
			}
		}
	}

	function handleResetSettings() {
		if (confirm('Reset all settings to defaults?')) {
			settings.reset();
			alert('Settings reset to defaults!');
		}
	}
</script>

<svelte:head>
	<title>Settings - Memoro</title>
</svelte:head>

<SettingsPage title="Settings" subtitle="Manage your account and preferences" maxWidth="5xl">
	<!-- Appearance Section -->
	<SettingsSection title="Appearance">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<h3 class="mb-4 text-lg font-medium text-[hsl(var(--foreground))]">Theme Mode</h3>
			<div class="grid grid-cols-3 gap-3">
				{#each themeModes as mode}
					<button
						onclick={() => {
							setThemeMode(mode.value);
							activeMode = mode.value;
						}}
						class="flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all {activeMode ===
						mode.value
							? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] shadow-md'
							: 'border-[hsl(var(--border))] bg-[hsl(var(--muted))]'}"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							{#if mode.icon === 'sync'}
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							{:else if mode.icon === 'sunny'}
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
								/>
							{:else}
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
								/>
							{/if}
						</svg>
						<span
							class="text-sm font-medium {activeMode === mode.value
								? 'text-[hsl(var(--primary))]'
								: 'text-[hsl(var(--foreground))]'}"
						>
							{mode.label}
						</span>
					</button>
				{/each}
			</div>
			<p class="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
				Choose how Memoro looks. System automatically matches your device's theme.
			</p>
		</SettingsCard>
	</SettingsSection>

	<!-- User Interface Section (Collapsible) -->
	<SettingsSection title="User Interface">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
				/>
			</svg>
		{/snippet}

		<button
			onclick={() => (showUIElements = !showUIElements)}
			class="mb-4 flex w-full items-center justify-between rounded-lg bg-[hsl(var(--muted))] p-3 text-left"
		>
			<span class="text-sm font-medium text-[hsl(var(--foreground))]">
				{showUIElements ? 'Hide' : 'Show'} UI Element Options
			</span>
			<svg
				class="h-5 w-5 transition-transform text-[hsl(var(--muted-foreground))] {showUIElements
					? 'rotate-180'
					: ''}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		{#if showUIElements}
			<SettingsCard>
				<SettingsToggle
					label="Show Language Button"
					description="Display language selection button next to the recording button"
					isOn={currentSettings.showLanguageButton}
					onToggle={settings.setShowLanguageButton}
				>
					{#snippet icon()}
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
							/>
						</svg>
					{/snippet}
				</SettingsToggle>
				<SettingsToggle
					label="Show Recording Instruction"
					description="Show 'Start Recording' text with arrow near the recording button"
					isOn={currentSettings.showRecordingInstruction}
					onToggle={settings.setShowRecordingInstruction}
				>
					{#snippet icon()}
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					{/snippet}
				</SettingsToggle>
				<SettingsToggle
					label="Show Blueprints"
					description="Display blueprint selection at the bottom of the screen"
					isOn={currentSettings.showBlueprints}
					onToggle={settings.setShowBlueprints}
				>
					{#snippet icon()}
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					{/snippet}
				</SettingsToggle>
				<SettingsToggle
					label="Show Mana Badge"
					description="Display Mana counter in the header"
					isOn={currentSettings.showManaBadge}
					onToggle={settings.setShowManaBadge}
					border={false}
				>
					{#snippet icon()}
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
							/>
						</svg>
					{/snippet}
				</SettingsToggle>
			</SettingsCard>
		{/if}
	</SettingsSection>

	<!-- Data & Privacy Section -->
	<SettingsSection title="Data & Privacy">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsToggle
				label="Save Location"
				description="Allow the app to save your location to enable location-based features"
				isOn={currentSettings.saveLocation}
				onToggle={settings.setSaveLocation}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>
			<SettingsToggle
				label="Enable Analytics"
				description="Help improve Memoro by sharing anonymous usage data"
				isOn={currentSettings.enableAnalytics}
				onToggle={settings.setEnableAnalytics}
				border={false}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>
		</SettingsCard>
	</SettingsSection>

	<!-- Support Section -->
	<SettingsSection title="Support">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsRow
				label="Contact Support"
				description="Need help? Get in touch with our support team"
				onclick={handleContactSupport}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				{/snippet}
			</SettingsRow>
			<SettingsRow
				label="Rate App"
				description="Enjoying Memoro? Rate us in your browser's extension store"
				onclick={handleRateApp}
				border={false}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
						/>
					</svg>
				{/snippet}
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Account Section -->
	<SettingsSection title="Account">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsRow label="Email Address" description={currentUser?.email || 'No email available'}>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				{/snippet}
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Developer Settings -->
	{#if currentSettings.developerMode}
		<SettingsSection title="Developer Settings">
			{#snippet icon()}
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
					/>
				</svg>
			{/snippet}

			<SettingsCard>
				<SettingsToggle
					label="Show Debug Borders"
					description="Display borders around UI elements for development"
					isOn={currentSettings.showDebugBorders}
					onToggle={settings.setShowDebugBorders}
				>
					{#snippet icon()}
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
							/>
						</svg>
					{/snippet}
				</SettingsToggle>
				<SettingsRow
					label="Reset All Settings"
					description="Reset all settings to default values"
					onclick={handleResetSettings}
					border={false}
				>
					{#snippet icon()}
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
					{/snippet}
				</SettingsRow>
			</SettingsCard>
		</SettingsSection>
	{/if}

	<!-- App Information Section -->
	<SettingsSection title="App Information">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<div class="relative">
				<button
					onclick={copyAppInfo}
					class="absolute right-0 top-0 rounded-lg p-2 transition-colors bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)]"
					title="Copy app information"
				>
					<svg
						class="h-5 w-5 text-[hsl(var(--muted-foreground))]"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
				</button>
			</div>
			<SettingsRow label="Version">
				<span class="text-sm font-medium text-[hsl(var(--foreground))]">0.1.0</span>
			</SettingsRow>
			<SettingsRow label="Platform">
				<span class="text-sm font-medium text-[hsl(var(--foreground))]">Web</span>
			</SettingsRow>
			<SettingsRow label="Build">
				<span class="text-sm font-medium text-[hsl(var(--foreground))]">Beta</span>
			</SettingsRow>
			<SettingsRow label="Browser" border={false}>
				<span class="text-xs font-medium text-[hsl(var(--foreground))]">
					{navigator.userAgent.split(' ').slice(-2).join(' ')}
				</span>
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Advanced Settings / Danger Zone -->
	<button
		onclick={() => (showMoreSettings = !showMoreSettings)}
		class="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[hsl(var(--muted))] p-3"
	>
		<svg
			class="h-5 w-5 transition-transform text-[hsl(var(--muted-foreground))] {showMoreSettings
				? 'rotate-180'
				: ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
		<span class="text-sm font-medium text-[hsl(var(--foreground))]">
			{showMoreSettings ? 'Hide' : 'Show'} Advanced Settings
		</span>
	</button>

	{#if showMoreSettings}
		<SettingsDangerZone title="Danger Zone">
			<SettingsDangerButton
				label="Delete Account"
				description="Permanently delete your account and all data. This action cannot be undone."
				buttonText="Delete Account"
				onclick={handleDeleteAccount}
				border={false}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				{/snippet}
			</SettingsDangerButton>
		</SettingsDangerZone>
	{/if}

	<!-- Logout -->
	<SettingsDangerZone title="Sign Out">
		<SettingsDangerButton
			label="Sign Out"
			description="Sign out of your Memoro account"
			buttonText="Sign Out"
			onclick={handleLogout}
			border={false}
		>
			{#snippet icon()}
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					/>
				</svg>
			{/snippet}
		</SettingsDangerButton>
	</SettingsDangerZone>

	<!-- Footer -->
	<div class="pt-8 text-center">
		<button
			onclick={handleVersionClick}
			class="text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
		>
			2025 Memoro GmbH
		</button>
		<p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Made with love in Germany</p>
		{#if clickCount > 0 && clickCount < 7}
			<p class="mt-2 text-xs text-[hsl(var(--muted-foreground))] opacity-50">
				{7 - clickCount} more clicks...
			</p>
		{/if}
	</div>
</SettingsPage>
