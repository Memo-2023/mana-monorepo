<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { APP_VERSION } from '$lib/version';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		SettingsToggle,
		SettingsDangerZone,
		SettingsDangerButton,
		GlobalSettingsSection,
	} from '@manacore/shared-ui';
	import { User, Envelope, ShieldCheck, Sun, Moon, Monitor, SignOut } from '@manacore/shared-icons';

	function handleLogout() {
		auth.logout();
		goto('/login');
	}

	function setThemeMode(mode: 'light' | 'dark' | 'system') {
		theme.setMode(mode);
	}

	onMount(async () => {
		await userSettings.load();
	});
</script>

<svelte:head>
	<title>Settings - Presi</title>
</svelte:head>

<SettingsPage title="Settings" subtitle="Manage your account and preferences.">
	<!-- Account Section -->
	<SettingsSection title="Account">
		{#snippet icon()}
			<User />
		{/snippet}

		<SettingsCard>
			<SettingsRow label="Email" description={auth.user?.email || 'Not available'}>
				{#snippet icon()}
					<Envelope />
				{/snippet}
			</SettingsRow>
			<SettingsRow label="User ID" description={auth.user?.id || 'Not available'} border={false}>
				{#snippet icon()}
					<ShieldCheck />
				{/snippet}
				<span class="font-mono text-xs text-[hsl(var(--muted-foreground))]"
					>{auth.user?.id || '-'}</span
				>
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Appearance Section -->
	<SettingsSection title="Appearance">
		{#snippet icon()}
			<Sun />
		{/snippet}

		<SettingsCard>
			<div class="px-5 py-4">
				<p class="font-medium text-[hsl(var(--foreground))] mb-2">Theme</p>
				<p class="text-sm text-[hsl(var(--muted-foreground))] mb-4">Choose your preferred theme</p>
				<div class="grid grid-cols-3 gap-3">
					<button
						onclick={() => setThemeMode('light')}
						class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors
							{theme.mode === 'light'
							? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]'
							: 'border-[hsl(var(--border))]'}"
					>
						<Sun size={24} class="text-amber-500" />
						<span class="text-sm font-medium text-[hsl(var(--foreground))]">Light</span>
					</button>
					<button
						onclick={() => setThemeMode('dark')}
						class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors
							{theme.mode === 'dark'
							? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]'
							: 'border-[hsl(var(--border))]'}"
					>
						<Moon size={24} class="text-indigo-500" />
						<span class="text-sm font-medium text-[hsl(var(--foreground))]">Dark</span>
					</button>
					<button
						onclick={() => setThemeMode('system')}
						class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors
							{theme.mode === 'system'
							? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]'
							: 'border-[hsl(var(--border))]'}"
					>
						<Monitor size={24} class="text-[hsl(var(--muted-foreground))]" />
						<span class="text-sm font-medium text-[hsl(var(--foreground))]">System</span>
					</button>
				</div>
			</div>
		</SettingsCard>
	</SettingsSection>

	<!-- Global Settings Section -->
	<GlobalSettingsSection {userSettings} />

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
				<SignOut />
			{/snippet}
		</SettingsDangerButton>
	</SettingsDangerZone>

	<p class="mt-8 pb-4 text-center text-xs text-gray-400 dark:text-gray-600">v{APP_VERSION}</p>
</SettingsPage>
