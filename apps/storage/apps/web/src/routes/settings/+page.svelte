<script lang="ts">
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import { APP_VERSION } from '$lib/version';
	import { filesApi } from '$lib/api/client';
	import type { StorageStats } from '$lib/api/client';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		GlobalSettingsSection,
	} from '@manacore/shared-ui';
	import { Palette, Database, Info } from '@manacore/shared-icons';

	let stats = $state<StorageStats | null>(null);
	let maxStorage = 10 * 1024 * 1024 * 1024; // 10 GB

	let usagePercent = $derived(stats ? Math.min(100, (stats.totalSize / maxStorage) * 100) : 0);

	function formatSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	onMount(async () => {
		await userSettings.load();
		const result = await filesApi.stats();
		if (result.data) stats = result.data;
	});
</script>

<svelte:head>
	<title>Einstellungen - Storage</title>
	<meta name="description" content="Passe Darstellung, Speicher und weitere Einstellungen an." />
</svelte:head>

<SettingsPage title="Einstellungen" subtitle="Passe die App an deine Vorlieben an.">
	<!-- Appearance Section -->
	<SettingsSection title="Darstellung">
		{#snippet icon()}
			<Palette />
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
							class="px-4 py-2 text-sm font-medium rounded-lg transition-colors {theme.mode === mode
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

	<!-- Storage Section -->
	<SettingsSection title="Speicher">
		{#snippet icon()}
			<Database />
		{/snippet}

		<SettingsCard>
			<div class="px-5 py-4">
				<p class="font-medium text-[hsl(var(--foreground))] mb-2">Speicherplatz</p>
				<p class="text-sm text-[hsl(var(--muted-foreground))] mb-4">
					{stats
						? `${stats.totalFiles} Dateien, ${stats.favoriteCount} Favoriten`
						: 'Wird geladen...'}
				</p>
				<div class="w-full h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden mb-2">
					<div
						class="h-full bg-[hsl(var(--primary))] rounded-full transition-all duration-500"
						style="width: {usagePercent}%"
					></div>
				</div>
				<p class="text-sm text-[hsl(var(--muted-foreground))]">
					{stats ? formatSize(stats.totalSize) : '...'} von {formatSize(maxStorage)} verwendet
				</p>
			</div>
		</SettingsCard>
	</SettingsSection>

	<!-- Global Settings Section -->
	<GlobalSettingsSection {userSettings} />

	<!-- About Section -->
	<SettingsSection title="Über">
		{#snippet icon()}
			<Info />
		{/snippet}

		<SettingsCard>
			<SettingsRow label="Version" border={false}>
				<span class="text-[hsl(var(--muted-foreground))]">1.0.0</span>
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<p class="mt-8 pb-4 text-center text-xs text-gray-400 dark:text-gray-600">v{APP_VERSION}</p>
</SettingsPage>
