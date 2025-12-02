<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';

	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}
	});

	function handleThemeChange(mode: 'light' | 'dark' | 'system') {
		theme.setMode(mode);
	}
</script>

<svelte:head>
	<title>Einstellungen | Kalender</title>
</svelte:head>

<div class="settings-page">
	<header class="page-header">
		<h1>Einstellungen</h1>
	</header>

	<section class="settings-section card">
		<h2>Erscheinungsbild</h2>

		<div class="setting-item">
			<div class="setting-info">
				<span class="setting-label">Design-Modus</span>
				<span class="setting-description">Wählen Sie zwischen hell, dunkel oder automatisch</span>
			</div>
			<div class="theme-options">
				<button
					class="theme-option"
					class:active={theme.mode === 'light'}
					onclick={() => handleThemeChange('light')}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<circle cx="12" cy="12" r="5"></circle>
						<path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
					</svg>
					Hell
				</button>
				<button
					class="theme-option"
					class:active={theme.mode === 'dark'}
					onclick={() => handleThemeChange('dark')}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
					</svg>
					Dunkel
				</button>
				<button
					class="theme-option"
					class:active={theme.mode === 'system'}
					onclick={() => handleThemeChange('system')}
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
						<line x1="8" y1="21" x2="16" y2="21"></line>
						<line x1="12" y1="17" x2="12" y2="21"></line>
					</svg>
					System
				</button>
			</div>
		</div>

		<div class="setting-item">
			<div class="setting-info">
				<span class="setting-label">Farbschema</span>
				<span class="setting-description">Wählen Sie ein Farbschema für die App</span>
			</div>
			<div class="variant-grid">
				{#each theme.variants as variant}
					<button
						class="variant-option"
						class:active={theme.variant === variant}
						onclick={() => theme.setVariant(variant)}
					>
						<span class="variant-icon">{THEME_DEFINITIONS[variant].icon}</span>
						<span class="variant-label">{THEME_DEFINITIONS[variant].label}</span>
					</button>
				{/each}
			</div>
		</div>
	</section>

	<section class="settings-section card">
		<h2>Konto</h2>

		<div class="setting-item">
			<div class="setting-info">
				<span class="setting-label">E-Mail</span>
				<span class="setting-value">{authStore.user?.email || '-'}</span>
			</div>
		</div>

		<div class="setting-item">
			<button class="btn btn-ghost text-destructive" onclick={() => authStore.signOut().then(() => goto('/login'))}>
				Abmelden
			</button>
		</div>
	</section>
</div>

<style>
	.settings-page {
		max-width: 600px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 1.5rem;
	}

	.page-header h1 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
	}

	.settings-section {
		margin-bottom: 1.5rem;
	}

	.settings-section h2 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.setting-item {
		padding: 1rem 0;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
	}

	.setting-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 0.75rem;
	}

	.setting-label {
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.setting-description {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.setting-value {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.theme-options {
		display: flex;
		gap: 0.5rem;
	}

	.theme-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 2px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.theme-option:hover {
		border-color: hsl(var(--color-primary) / 0.5);
	}

	.theme-option.active {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
	}

	.variant-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 0.5rem;
	}

	.variant-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem;
		border: 2px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		background: transparent;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.variant-option:hover {
		border-color: hsl(var(--color-primary) / 0.5);
	}

	.variant-option.active {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
	}

	.variant-icon {
		font-size: 1.5rem;
	}

	.variant-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.text-destructive {
		color: hsl(var(--color-error));
	}
</style>
