<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		SettingsToggle,
		SettingsDangerZone,
		SettingsDangerButton,
	} from '@manacore/shared-ui';

	function handleLogout() {
		auth.logout();
		goto('/login');
	}

	function setThemeMode(mode: 'light' | 'dark' | 'system') {
		theme.setMode(mode);
	}
</script>

<svelte:head>
	<title>Settings - Presi</title>
</svelte:head>

<SettingsPage title="Settings" subtitle="Manage your account and preferences.">
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
			<SettingsRow label="Email" description={auth.user?.email || 'Not available'}>
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
			<SettingsRow label="User ID" description={auth.user?.id || 'Not available'} border={false}>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
						/>
					</svg>
				{/snippet}
				<span class="font-mono text-xs text-[hsl(var(--muted-foreground))]">{auth.user?.id || '-'}</span>
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Appearance Section -->
	<SettingsSection title="Appearance">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<div class="px-5 py-4">
				<p class="font-medium text-[hsl(var(--foreground))] mb-2">Theme</p>
				<p class="text-sm text-[hsl(var(--muted-foreground))] mb-4">
					Choose your preferred theme
				</p>
				<div class="grid grid-cols-3 gap-3">
					<button
						onclick={() => setThemeMode('light')}
						class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors
							{theme.mode === 'light'
							? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]'
							: 'border-[hsl(var(--border))]'}"
					>
						<svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
						<span class="text-sm font-medium text-[hsl(var(--foreground))]">Light</span>
					</button>
					<button
						onclick={() => setThemeMode('dark')}
						class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors
							{theme.mode === 'dark'
							? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]'
							: 'border-[hsl(var(--border))]'}"
					>
						<svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
							/>
						</svg>
						<span class="text-sm font-medium text-[hsl(var(--foreground))]">Dark</span>
					</button>
					<button
						onclick={() => setThemeMode('system')}
						class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors
							{theme.mode === 'system'
							? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]'
							: 'border-[hsl(var(--border))]'}"
					>
						<svg class="w-6 h-6 text-[hsl(var(--muted-foreground))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
						<span class="text-sm font-medium text-[hsl(var(--foreground))]">System</span>
					</button>
				</div>
			</div>
		</SettingsCard>
	</SettingsSection>

	<!-- Danger Zone -->
	<SettingsDangerZone title="Danger Zone">
		<SettingsDangerButton
			label="Sign out"
			description="Sign out of your account on this device"
			buttonText="Sign out"
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
</SettingsPage>
