<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { theme } from '$lib/stores/theme';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import { ThemeColorPreview } from '@manacore/shared-theme-ui';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		SettingsToggle,
		SettingsDangerZone,
		SettingsDangerButton,
	} from '@manacore/shared-ui';

	// Settings state
	let language = $state<'de' | 'en'>('de');
	let userName = $state('');

	// Load settings from localStorage on mount
	onMount(() => {
		const savedLanguage = localStorage.getItem('language');
		const savedUserName = localStorage.getItem('userName');

		if (savedLanguage) language = savedLanguage as 'de' | 'en';
		if (savedUserName) userName = savedUserName;
	});

	// Save settings to localStorage
	function saveSetting(key: string, value: string | boolean) {
		localStorage.setItem(key, String(value));
	}

	function toggleDarkMode(value: boolean) {
		theme.toggleMode();
	}

	function setLanguageSetting(lang: 'de' | 'en') {
		language = lang;
		saveSetting('language', lang);
	}

	function saveUserName() {
		saveSetting('userName', userName);
	}

	function resetAllData() {
		if (
			confirm('Möchtest du wirklich ALLE Daten löschen? Dies kann nicht rückgängig gemacht werden!')
		) {
			localStorage.clear();
			window.location.href = '/';
		}
	}
</script>

<svelte:head>
	<title>Einstellungen - Zitare</title>
</svelte:head>

<SettingsPage title="Einstellungen" subtitle="Passe die App an deine Vorlieben an.">
	<!-- Personal Section -->
	<SettingsSection title="Persönlich">
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
			<div class="px-5 py-4">
				<label class="block">
					<span class="font-medium text-[hsl(var(--foreground))] mb-2 block">Dein Name</span>
					<input
						type="text"
						bind:value={userName}
						onblur={saveUserName}
						placeholder="Name eingeben..."
						class="w-full px-3 py-2 rounded-lg border-2 border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none transition-colors"
					/>
				</label>
				<p class="text-sm text-[hsl(var(--muted-foreground))] mt-2">
					Wird als Standard-Autor für eigene Zitate verwendet
				</p>
			</div>
		</SettingsCard>
	</SettingsSection>

	<!-- Appearance Section -->
	<SettingsSection title="Aussehen">
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
				label="Dark Mode"
				description="Dunkles Farbschema verwenden"
				isOn={theme.isDark}
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

			<SettingsRow
				label="Aktuelles Theme"
				description={THEME_DEFINITIONS[theme.variant].label}
				onclick={() => goto('/themes')}
			>
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
				<span
					class="px-3 py-1.5 text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg"
				>
					Themes wählen
				</span>
			</SettingsRow>

			<div class="px-5 py-4 border-t border-[hsl(var(--border))]">
				<p class="font-medium text-[hsl(var(--foreground))] mb-2">Farbvorschau</p>
				<p class="text-sm text-[hsl(var(--muted-foreground))] mb-4">
					So sieht die App mit dem aktuellen Theme aus
				</p>
				<div class="flex justify-center">
					<ThemeColorPreview
						variant={theme.variant}
						mode={theme.isDark ? 'dark' : 'light'}
						size="lg"
					/>
				</div>
			</div>
		</SettingsCard>
	</SettingsSection>

	<!-- Language Section -->
	<SettingsSection title="Sprache">
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

		<SettingsCard>
			<div class="px-5 py-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="font-medium text-[hsl(var(--foreground))]">Sprache</p>
						<p class="text-sm text-[hsl(var(--muted-foreground))]">Sprache der App und Zitate</p>
					</div>
					<div class="flex rounded-full overflow-hidden border border-[hsl(var(--border))]">
						<button
							class="px-4 py-2 text-sm font-medium transition-colors
								{language === 'de'
								? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
								: 'bg-transparent text-[hsl(var(--foreground))]'}"
							onclick={() => setLanguageSetting('de')}
						>
							DE
						</button>
						<button
							class="px-4 py-2 text-sm font-medium transition-colors
								{language === 'en'
								? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
								: 'bg-transparent text-[hsl(var(--foreground))]'}"
							onclick={() => setLanguageSetting('en')}
						>
							EN
						</button>
					</div>
				</div>
			</div>
		</SettingsCard>
	</SettingsSection>

	<!-- About Section -->
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
				<span class="text-[hsl(var(--muted-foreground))]">1.0.0</span>
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Data Section -->
	<SettingsDangerZone title="Daten">
		<SettingsDangerButton
			label="Alle Daten zurücksetzen"
			description="Löscht Favoriten, Playlists und Einstellungen"
			buttonText="Zurücksetzen"
			onclick={resetAllData}
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
</SettingsPage>
