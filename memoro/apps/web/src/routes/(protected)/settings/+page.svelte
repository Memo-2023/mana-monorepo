<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, user } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { settings } from '$lib/stores/settings';
	import type { ThemeMode } from '$lib/stores/theme';
	import SettingsToggle from '$lib/components/SettingsToggle.svelte';
	import SectionHeader from '$lib/components/SectionHeader.svelte';
	import { onMount } from 'svelte';

	let currentTheme = $derived($theme);
	let currentUser = $derived($user);
	let currentSettings = $derived($settings);

	// Theme mode options
	const themeModes: { label: string; value: ThemeMode; icon: string }[] = [
		{ label: 'System', value: 'system', icon: 'sync' },
		{ label: 'Light', value: 'light', icon: 'sunny' },
		{ label: 'Dark', value: 'dark', icon: 'moon' }
	];

	function setThemeMode(mode: ThemeMode) {
		theme.setMode(mode);
		activeMode = mode;
	}

	let activeMode = $state<ThemeMode>(currentTheme.mode);

	// Update activeMode when theme changes
	$effect(() => {
		activeMode = currentTheme.mode;
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
		alert('Thank you for your interest! Rating feature coming soon for the web version. 🌟');
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
					? '🎉 Developer Mode activated!\nAdvanced settings are now visible.'
					: 'Developer Mode deactivated.'
			);
		}
	}

	// Delete account confirmation
	function handleDeleteAccount() {
		const confirmed = confirm(
			'⚠️ Are you sure you want to delete your account?\n\nThis action cannot be undone. All your data will be permanently deleted.'
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
</script>

<svelte:head>
	<title>Settings - Memoro</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Content Area -->
	<div class="flex-1 overflow-y-auto">
		<div class="mx-auto max-w-5xl pb-12">
	<h1 class="mb-8 text-3xl font-bold">Settings</h1>

	<!-- Appearance Section -->
	<section class="mb-6">
		<SectionHeader title="Appearance" isFirst={true} />
		<div class="card">
			<h3 class="mb-4 text-lg font-medium">Theme Mode</h3>
			<div class="grid grid-cols-3 gap-3">
				{#each themeModes as mode}
					<button
						onclick={() => {
							setThemeMode(mode.value);
							activeMode = mode.value;
						}}
						class="flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all bg-content-hover {activeMode === mode.value
							? 'border-primary shadow-md'
							: 'border-theme'}"
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
								? 'text-primary'
								: 'text-theme'}"
						>
							{mode.label}
						</span>
					</button>
				{/each}
			</div>
			<p class="mt-4 text-sm text-theme-secondary">
				Choose how Memoro looks. System automatically matches your device's theme.
			</p>
		</div>
	</section>

	<!-- User Interface Elements -->
	<SectionHeader
		title="User Interface"
		collapsible={true}
		isCollapsed={!showUIElements}
		onPress={() => (showUIElements = !showUIElements)}
	/>
	{#if showUIElements}
		<div class="mb-6 space-y-4">
			<SettingsToggle
				title="Show Language Button"
				description="Display language selection button next to the recording button"
				type="toggle"
				isOn={currentSettings.showLanguageButton}
				onToggle={settings.setShowLanguageButton}
			/>
			<SettingsToggle
				title="Show Recording Instruction"
				description="Show 'Start Recording' text with arrow near the recording button"
				type="toggle"
				isOn={currentSettings.showRecordingInstruction}
				onToggle={settings.setShowRecordingInstruction}
			/>
			<SettingsToggle
				title="Show Blueprints"
				description="Display blueprint selection at the bottom of the screen"
				type="toggle"
				isOn={currentSettings.showBlueprints}
				onToggle={settings.setShowBlueprints}
			/>
			<SettingsToggle
				title="Show Mana Badge"
				description="Display Mana counter in the header"
				type="toggle"
				isOn={currentSettings.showManaBadge}
				onToggle={settings.setShowManaBadge}
			/>
		</div>
	{/if}

	<!-- Data & Privacy -->
	<SectionHeader title="Data & Privacy" />
	<div class="mb-6 space-y-4">
		<SettingsToggle
			title="Save Location"
			description="Allow the app to save your location to enable location-based features"
			type="toggle"
			isOn={currentSettings.saveLocation}
			onToggle={settings.setSaveLocation}
		/>
		<SettingsToggle
			title="Enable Analytics"
			description="Help improve Memoro by sharing anonymous usage data"
			type="toggle"
			isOn={currentSettings.enableAnalytics}
			onToggle={settings.setEnableAnalytics}
		/>
	</div>

	<!-- Support -->
	<SectionHeader title="Support" />
	<div class="mb-6 space-y-4">
		<SettingsToggle
			title="Contact Support"
			description="Need help? Get in touch with our support team"
			type="button"
			onPress={handleContactSupport}
			icon="mail-outline"
		/>
		<SettingsToggle
			title="Rate App"
			description="Enjoying Memoro? Rate us in your browser's extension store"
			type="button"
			onPress={handleRateApp}
			icon="star-outline"
		/>
	</div>

	<!-- Advanced Settings -->
	<div class="mb-6">
		<button
			onclick={() => (showMoreSettings = !showMoreSettings)}
			class="btn-secondary w-full justify-center"
		>
			<svg
				class="mr-2 inline-block h-5 w-5 transition-transform {showMoreSettings ? 'rotate-180' : ''}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 9l-7 7-7-7"
				/>
			</svg>
			{showMoreSettings ? 'Hide' : 'Show'} Advanced Settings
		</button>
	</div>

	{#if showMoreSettings}
		<div class="card mb-6 border-2 border-theme">
			<h3 class="mb-4 text-lg font-semibold text-theme-secondary">Delete Account</h3>
			<p class="mb-4 text-sm text-theme-secondary">
				If you delete your account, all your data will be permanently deleted. This action cannot be
				undone.
			</p>
			<button onclick={handleDeleteAccount} class="btn-primary w-full bg-red-600 hover:bg-red-700">
				<svg class="mr-2 inline-block h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
				</svg>
				Delete Account
			</button>
		</div>
	{/if}

	<!-- Developer Settings -->
	{#if currentSettings.developerMode}
		<SectionHeader title="Developer Settings" />
		<div class="mb-6 space-y-4">
			<SettingsToggle
				title="Show Debug Borders"
				description="Display borders around UI elements for development"
				type="toggle"
				isOn={currentSettings.showDebugBorders}
				onToggle={settings.setShowDebugBorders}
			/>
			<SettingsToggle
				title="Reset All Settings"
				description="Reset all settings to default values"
				type="button"
				onPress={() => {
					if (confirm('Reset all settings to defaults?')) {
						settings.reset();
						alert('Settings reset to defaults!');
					}
				}}
			/>
		</div>
	{/if}

	<!-- Account Section -->
	<SectionHeader title="Account" />
	<div class="card mb-6">
		{#if currentUser}
			<div class="mb-6">
				<label class="mb-2 block text-sm font-medium text-theme-secondary">Email Address</label>
				<p class="text-lg font-medium">{currentUser.email || 'No email available'}</p>
			</div>
		{/if}

		<button onclick={handleLogout} class="btn-primary w-full">
			<svg class="mr-2 inline-block h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
				/>
			</svg>
			Sign Out
		</button>
	</div>

	<!-- App Information Section -->
	<SectionHeader title="App Information" />
	<div class="card mb-6 relative">
		<button
			onclick={copyAppInfo}
			class="absolute right-4 top-4 rounded-lg p-2 transition-colors bg-menu-hover"
			title="Copy app information"
		>
			<svg class="h-5 w-5 text-theme-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
				/>
			</svg>
		</button>
		<div class="space-y-3 pr-12">
			<div class="flex items-center justify-between border-b border-theme-light py-3">
				<span class="text-sm text-theme-secondary">Version</span>
				<span class="font-medium">0.1.0</span>
			</div>
			<div class="flex items-center justify-between border-b border-theme-light py-3">
				<span class="text-sm text-theme-secondary">Platform</span>
				<span class="font-medium">Web</span>
			</div>
			<div class="flex items-center justify-between border-b border-theme-light py-3">
				<span class="text-sm text-theme-secondary">Build</span>
				<span class="font-medium">Beta</span>
			</div>
			<div class="flex items-center justify-between py-3">
				<span class="text-sm text-theme-secondary">Browser</span>
				<span class="text-xs font-medium">{navigator.userAgent.split(' ').slice(-2).join(' ')}</span>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<div class="pt-8 text-center">
		<button
			onclick={handleVersionClick}
			class="text-sm text-theme-muted transition-colors hover:text-theme-secondary"
		>
			© 2025 Memoro GmbH
		</button>
		<p class="mt-1 text-xs text-theme-muted">Made with ❤️ in Germany</p>
		{#if clickCount > 0 && clickCount < 7}
			<p class="mt-2 text-xs text-theme-muted opacity-50">{7 - clickCount} more clicks...</p>
		{/if}
	</div>
		</div>
	</div>
</div>

<style>
	.grid {
		display: grid;
	}
</style>
