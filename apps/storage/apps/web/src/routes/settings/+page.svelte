<script lang="ts">
	import { Settings } from 'lucide-svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
</script>

<svelte:head>
	<title>Einstellungen - Storage</title>
</svelte:head>

<div class="settings-page">
	<div class="page-header">
		<h1>
			<Settings size={24} />
			Einstellungen
		</h1>
	</div>

	<div class="settings-section">
		<h2>Darstellung</h2>

		<div class="setting-item">
			<div class="setting-info">
				<span class="setting-label">Farbmodus</span>
				<span class="setting-description">Wähle zwischen Hell, Dunkel oder System</span>
			</div>
			<div class="setting-control">
				<select value={theme.mode} onchange={(e) => theme.setMode((e.target as HTMLSelectElement).value as any)}>
					<option value="light">Hell</option>
					<option value="dark">Dunkel</option>
					<option value="system">System</option>
				</select>
			</div>
		</div>

		<div class="setting-item">
			<div class="setting-info">
				<span class="setting-label">Theme</span>
				<span class="setting-description">Wähle eine Farbpalette</span>
			</div>
			<div class="setting-control">
				<select value={theme.variant} onchange={(e) => theme.setVariant((e.target as HTMLSelectElement).value as any)}>
					{#each theme.variants as variant}
						<option value={variant}>{THEME_DEFINITIONS[variant].label}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<div class="settings-section">
		<h2>Speicher</h2>

		<div class="setting-item">
			<div class="setting-info">
				<span class="setting-label">Speicherplatz</span>
				<span class="setting-description">Dein genutzter Speicherplatz</span>
			</div>
			<div class="storage-bar">
				<div class="storage-used" style="width: 25%"></div>
			</div>
			<span class="storage-text">2.5 GB von 10 GB verwendet</span>
		</div>
	</div>

	<div class="settings-section">
		<h2>Über</h2>

		<div class="setting-item">
			<div class="setting-info">
				<span class="setting-label">Version</span>
				<span class="setting-description">Storage App v1.0.0</span>
			</div>
		</div>
	</div>
</div>

<style>
	.settings-page {
		min-height: 100%;
		max-width: 600px;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: rgb(var(--color-text-primary));
	}

	.settings-section {
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: rgb(var(--color-surface-elevated));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-xl);
	}

	.settings-section h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1rem;
		font-weight: 600;
		color: rgb(var(--color-text-primary));
	}

	.setting-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem 0;
		border-bottom: 1px solid rgb(var(--color-border));
	}

	.setting-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.setting-item:first-of-type {
		padding-top: 0;
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.setting-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(var(--color-text-primary));
	}

	.setting-description {
		font-size: 0.75rem;
		color: rgb(var(--color-text-secondary));
	}

	.setting-control select {
		padding: 0.5rem 0.75rem;
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		color: rgb(var(--color-text-primary));
		cursor: pointer;
	}

	.setting-control select:focus {
		outline: none;
		border-color: rgb(var(--color-primary));
	}

	.storage-bar {
		width: 100%;
		height: 8px;
		background: rgb(var(--color-surface));
		border-radius: 4px;
		overflow: hidden;
		margin-top: 0.5rem;
	}

	.storage-used {
		height: 100%;
		background: rgb(var(--color-primary));
		border-radius: 4px;
	}

	.storage-text {
		font-size: 0.75rem;
		color: rgb(var(--color-text-secondary));
	}
</style>
