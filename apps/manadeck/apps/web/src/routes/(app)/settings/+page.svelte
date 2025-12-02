<script lang="ts">
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		GlobalSettingsSection,
	} from '@manacore/shared-ui';

	onMount(async () => {
		await userSettings.load();
	});
</script>

<svelte:head>
	<title>Einstellungen - ManaDeck</title>
</svelte:head>

<SettingsPage title="Einstellungen" subtitle="Passe die App an deine Vorlieben an.">
	<!-- Appearance Section -->
	<SettingsSection title="Darstellung">
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
			<div class="px-5 py-4">
				<p class="font-medium text-[hsl(var(--foreground))] mb-2">Farbmodus</p>
				<p class="text-sm text-[hsl(var(--muted-foreground))] mb-4">
					Wähle zwischen Hell, Dunkel oder System
				</p>
				<div class="flex gap-2">
					{#each ['light', 'dark', 'system'] as mode}
						<button
							class="px-4 py-2 text-sm font-medium rounded-lg transition-colors {theme.mode ===
							mode
								? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
								: 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 text-[hsl(var(--foreground))]'}"
							onclick={() => theme.setMode(mode as 'light' | 'dark' | 'system')}
						>
							{mode === 'light' ? 'Hell' : mode === 'dark' ? 'Dunkel' : 'System'}
						</button>
					{/each}
				</div>
			</div>

			<div class="px-5 py-4 border-t border-[hsl(var(--border))]">
				<p class="font-medium text-[hsl(var(--foreground))] mb-2">Theme</p>
				<p class="text-sm text-[hsl(var(--muted-foreground))] mb-4">Wähle eine Farbpalette</p>
				<div class="flex gap-2 flex-wrap">
					{#each theme.variants as variant}
						<button
							class="px-4 py-2 text-sm font-medium rounded-lg transition-colors {theme.variant ===
							variant
								? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
								: 'bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 text-[hsl(var(--foreground))]'}"
							onclick={() => theme.setVariant(variant)}
						>
							{THEME_DEFINITIONS[variant].label}
						</button>
					{/each}
				</div>
			</div>
		</SettingsCard>
	</SettingsSection>

	<!-- Global Settings Section -->
	<GlobalSettingsSection {userSettings} />

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
</SettingsPage>
