<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { theme } from '$lib/stores/theme';
	import { setLocale, supportedLocales, type SupportedLocale } from '$lib/i18n';
	import { THEME_DEFINITIONS, DEFAULT_THEME_VARIANTS } from '@manacore/shared-theme';
	import { APP_VERSION } from '$lib/version';
	import { Moon, Sun } from '@manacore/shared-icons';

	let selectedLocale = $state<SupportedLocale>('de');

	function handleLocaleChange(e: Event) {
		const locale = (e.target as HTMLSelectElement).value as SupportedLocale;
		selectedLocale = locale;
		setLocale(locale);
	}
</script>

<svelte:head>
	<title>{$_('settings.title')} | Photos</title>
</svelte:head>

<div class="settings-page">
	<header class="page-header">
		<h1 class="text-2xl font-bold">{$_('settings.title')}</h1>
	</header>

	<div class="settings-list">
		<!-- Theme -->
		<div class="setting-item">
			<div class="setting-label">
				<span class="font-medium">{$_('settings.theme')}</span>
			</div>
			<div class="setting-control">
				<div class="theme-buttons">
					<button
						class="theme-btn"
						class:active={theme.mode === 'light'}
						onclick={() => theme.setMode('light')}
					>
						<Sun size={20} />
						Light
					</button>
					<button
						class="theme-btn"
						class:active={theme.mode === 'dark'}
						onclick={() => theme.setMode('dark')}
					>
						<Moon size={20} />
						Dark
					</button>
					<button
						class="theme-btn"
						class:active={theme.mode === 'system'}
						onclick={() => theme.setMode('system')}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect width="20" height="14" x="2" y="3" rx="2" />
							<line x1="8" x2="16" y1="21" y2="21" />
							<line x1="12" x2="12" y1="17" y2="21" />
						</svg>
						System
					</button>
				</div>
			</div>
		</div>

		<!-- Theme Variant -->
		<div class="setting-item">
			<div class="setting-label">
				<span class="font-medium">Theme Variant</span>
			</div>
			<div class="setting-control">
				<div class="variant-grid">
					{#each DEFAULT_THEME_VARIANTS as variant}
						<button
							class="variant-btn"
							class:active={theme.variant === variant}
							onclick={() => theme.setVariant(variant)}
						>
							<span class="variant-icon">{THEME_DEFINITIONS[variant].icon}</span>
							<span class="variant-label">{THEME_DEFINITIONS[variant].label}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Language -->
		<div class="setting-item">
			<div class="setting-label">
				<span class="font-medium">{$_('settings.language')}</span>
			</div>
			<div class="setting-control">
				<select class="select" value={selectedLocale} onchange={handleLocaleChange}>
					{#each supportedLocales as locale}
						<option value={locale}>
							{locale === 'de' ? 'Deutsch' : 'English'}
						</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<p class="mt-8 pb-4 text-center text-xs text-gray-400 dark:text-gray-600">v{APP_VERSION}</p>
</div>

<style>
	.settings-page {
		max-width: 600px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.settings-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.setting-item {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background: var(--color-card);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
	}

	.theme-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.theme-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-foreground);
		cursor: pointer;
		transition: all 150ms;
	}

	.theme-btn:hover {
		background: var(--color-accent);
	}

	.theme-btn.active {
		border-color: var(--color-primary);
		background: var(--color-primary);
		color: var(--color-primary-foreground);
	}

	.variant-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 0.5rem;
	}

	.variant-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		cursor: pointer;
		transition: all 150ms;
	}

	.variant-btn:hover {
		background: var(--color-accent);
	}

	.variant-btn.active {
		border-color: var(--color-primary);
		background: var(--color-accent);
	}

	.variant-icon {
		font-size: 1.25rem;
	}

	.variant-label {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
	}

	.select {
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-background);
		color: var(--color-foreground);
		min-width: 150px;
	}
</style>
