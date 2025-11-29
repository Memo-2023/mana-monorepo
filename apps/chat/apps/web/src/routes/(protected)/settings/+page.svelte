<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { THEME_DEFINITIONS, type ThemeVariant } from '@manacore/shared-theme';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		SettingsToggle,
		SettingsDangerZone,
		SettingsDangerButton,
	} from '@manacore/shared-ui';

	// Available theme variants
	const themeVariants = theme.variants;

	function setThemeVariant(variant: ThemeVariant) {
		theme.setVariant(variant);
	}

	function toggleDarkMode(value: boolean) {
		theme.toggleMode();
	}

	function handleDeleteChatHistory() {
		// TODO: Implement chat history deletion
		alert('Diese Funktion wird bald verfügbar sein.');
	}
</script>

<svelte:head>
	<title>Einstellungen | ManaChat</title>
</svelte:head>

<SettingsPage title="Einstellungen" subtitle="Passe die App an deine Vorlieben an.">
	<!-- Appearance Section -->
	<SettingsSection title="Erscheinungsbild">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsToggle
				label="Dunkler Modus"
				description="Aktiviere den dunklen Modus für die App"
				isOn={theme.mode === 'dark'}
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

			<div class="px-5 py-4">
				<p class="font-medium text-[hsl(var(--foreground))] mb-2">Farbschema</p>
				<p class="text-sm text-[hsl(var(--muted-foreground))] mb-4">
					Wähle ein Farbschema für die App
				</p>
				<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
					{#each themeVariants as variant}
						{@const def = THEME_DEFINITIONS[variant]}
						<button
							onclick={() => setThemeVariant(variant)}
							class="flex items-center gap-3 p-3 rounded-lg border-2 transition-all
								{theme.variant === variant
								? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)]'
								: 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)]'}"
						>
							<span class="text-xl">{def.icon}</span>
							<span
								class="text-sm font-medium {theme.variant === variant
									? 'text-[hsl(var(--primary))]'
									: 'text-[hsl(var(--foreground))]'}"
							>
								{def.label}
							</span>
						</button>
					{/each}
				</div>
			</div>
		</SettingsCard>
	</SettingsSection>

	<!-- Notifications Section -->
	<SettingsSection title="Benachrichtigungen">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsToggle
				label="Push-Benachrichtigungen"
				description="Erhalte Benachrichtigungen über neue Nachrichten"
				isOn={false}
				onToggle={() => {}}
				disabled
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="opacity-50">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>

			<SettingsToggle
				label="E-Mail-Benachrichtigungen"
				description="Erhalte wöchentliche Zusammenfassungen per E-Mail"
				isOn={false}
				onToggle={() => {}}
				disabled
				border={false}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="opacity-50">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>

			<p class="text-xs text-[hsl(var(--muted-foreground))] px-5 pb-4 italic">
				Benachrichtigungen werden in einer zukünftigen Version verfügbar sein.
			</p>
		</SettingsCard>
	</SettingsSection>

	<!-- Privacy & Security Section -->
	<SettingsSection title="Datenschutz & Sicherheit">
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

		<SettingsCard>
			<SettingsRow
				label="Passwort ändern"
				description="Aktualisiere dein Passwort regelmäßig"
				href="/profile"
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
						/>
					</svg>
				{/snippet}
			</SettingsRow>
		</SettingsCard>

		<SettingsDangerZone title="Gefahrenbereich">
			<SettingsDangerButton
				label="Chat-Verlauf löschen"
				description="Lösche alle deine Konversationen permanent"
				buttonText="Löschen"
				onclick={handleDeleteChatHistory}
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
	</SettingsSection>

	<!-- About Section -->
	<SettingsSection title="Über die App">
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
			<SettingsRow label="Version" border={true}>
				<span class="font-medium text-[hsl(var(--foreground))]">1.0.0</span>
			</SettingsRow>
			<SettingsRow label="Build" border={false}>
				<span class="font-mono text-sm text-[hsl(var(--foreground))]">2024.11.29</span>
			</SettingsRow>
		</SettingsCard>

		<div class="flex flex-wrap gap-4 text-sm mt-2">
			<a href="#" class="text-[hsl(var(--primary))] hover:underline">Datenschutz</a>
			<a href="#" class="text-[hsl(var(--primary))] hover:underline">Nutzungsbedingungen</a>
			<a href="#" class="text-[hsl(var(--primary))] hover:underline">Hilfe & Support</a>
		</div>
	</SettingsSection>
</SettingsPage>
