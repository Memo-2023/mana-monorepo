<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, user } from '$lib/stores/auth';
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

	let isDeleting = $state(false);
	let showDeleteConfirm = $state(false);

	let effectiveMode = $derived(theme.effectiveMode);

	async function handleDeleteAllData() {
		if (!showDeleteConfirm) {
			showDeleteConfirm = true;
			return;
		}

		isDeleting = true;
		// TODO: Implement data deletion
		await new Promise((resolve) => setTimeout(resolve, 1000));
		isDeleting = false;
		showDeleteConfirm = false;
	}

	async function handleLogout() {
		await auth.signOut();
		goto('/login');
	}

	function toggleDarkMode(value: boolean) {
		theme.toggleMode();
	}
</script>

<SettingsPage title="Einstellungen" subtitle="Verwalte dein Konto und App-Einstellungen">
	<!-- Account Section -->
	<SettingsSection title="Konto">
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
			<SettingsRow label="E-Mail" description={$user?.email || 'Nicht angemeldet'}>
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
			<SettingsRow label="Benutzer-ID" border={false}>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
						/>
					</svg>
				{/snippet}
				<span class="font-mono text-xs text-[hsl(var(--muted-foreground))]">{$user?.id || '—'}</span>
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Appearance Section -->
	<SettingsSection title="Erscheinungsbild">
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
			<SettingsToggle
				label="Dunkles Design"
				description="Aktiviere den Dark Mode für eine augenfreundliche Ansicht"
				isOn={effectiveMode === 'dark'}
				onToggle={toggleDarkMode}
			>
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
			</SettingsToggle>
		</SettingsCard>
	</SettingsSection>

	<!-- Data Management Section -->
	<SettingsSection title="Datenverwaltung">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsRow
				label="Daten exportieren"
				description="Exportiere alle deine Mahlzeiten und Statistiken"
				onclick={() => goto('/export')}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
				{/snippet}
				<span class="px-4 py-2 text-sm font-medium bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-lg">
					Export
				</span>
			</SettingsRow>
		</SettingsCard>

		<SettingsDangerZone title="Gefahrenbereich">
			{#if showDeleteConfirm}
				<div class="px-5 py-4 flex items-center justify-between gap-4">
					<div>
						<p class="font-medium text-[hsl(var(--foreground))]">Alle Daten löschen</p>
						<p class="text-sm text-[hsl(var(--muted-foreground))]">
							Löscht alle deine Mahlzeiten und Statistiken unwiderruflich
						</p>
					</div>
					<div class="flex gap-2">
						<button
							onclick={() => (showDeleteConfirm = false)}
							class="px-4 py-2 text-sm font-medium bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-lg hover:bg-[hsl(var(--muted)/0.8)]"
						>
							Abbrechen
						</button>
						<button
							onclick={handleDeleteAllData}
							disabled={isDeleting}
							class="px-4 py-2 text-sm font-medium bg-[hsl(var(--destructive))] text-white rounded-lg hover:bg-[hsl(var(--destructive)/0.9)] disabled:opacity-50"
						>
							{isDeleting ? 'Wird gelöscht...' : 'Bestätigen'}
						</button>
					</div>
				</div>
			{:else}
				<SettingsDangerButton
					label="Alle Daten löschen"
					description="Löscht alle deine Mahlzeiten und Statistiken unwiderruflich"
					buttonText="Löschen"
					onclick={handleDeleteAllData}
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
			{/if}
		</SettingsDangerZone>
	</SettingsSection>

	<!-- Logout Section -->
	<SettingsDangerZone title="Abmelden">
		<SettingsDangerButton
			label="Abmelden"
			description="Von deinem Konto abmelden"
			buttonText="Abmelden"
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

	<!-- App Info -->
	<SettingsSection title="Über">
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
			<SettingsRow label="Version" border={false}>
				<span class="text-sm text-[hsl(var(--muted-foreground))]">0.1.0</span>
			</SettingsRow>
		</SettingsCard>

		<p class="text-center text-sm text-[hsl(var(--muted-foreground))] mt-4">
			Teil des Mana Core Ökosystems
		</p>
	</SettingsSection>
</SettingsPage>
