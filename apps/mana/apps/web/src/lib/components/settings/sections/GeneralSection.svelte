<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { goto } from '$app/navigation';
	import { Gear } from '@mana/shared-icons';
	import type { ThemeMode, WeekStartDay } from '@mana/shared-theme';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { onboardingStatus } from '$lib/stores/onboarding-status.svelte';
	import SettingsPanel from '../SettingsPanel.svelte';
	import SettingsSectionHeader from '../SettingsSectionHeader.svelte';

	onMount(() => {
		void userSettings.load();
	});

	const languages = [
		{ id: 'de', label: 'DE' },
		{ id: 'en', label: 'EN' },
		{ id: 'fr', label: 'FR' },
		{ id: 'es', label: 'ES' },
		{ id: 'it', label: 'IT' },
	];

	const colorSchemes = $derived([
		{ id: 'ocean', label: $_('settings.general.color_scheme_ocean'), color: 'bg-blue-500' },
		{ id: 'nature', label: $_('settings.general.color_scheme_nature'), color: 'bg-green-500' },
		{ id: 'lume', label: $_('settings.general.color_scheme_lume'), color: 'bg-amber-500' },
		{ id: 'stone', label: $_('settings.general.color_scheme_stone'), color: 'bg-slate-500' },
	]);

	async function setThemeMode(mode: ThemeMode) {
		await userSettings.updateGlobal({
			theme: { ...userSettings.globalSettings.theme, mode },
		});
	}

	async function setColorScheme(colorScheme: string) {
		await userSettings.updateGlobal({
			theme: { ...userSettings.globalSettings.theme, colorScheme },
		});
	}

	async function setLocale(locale: string) {
		await userSettings.updateGlobal({ locale });
	}

	async function setWeekStart(day: WeekStartDay) {
		await userSettings.updateGeneral({ weekStartsOn: day });
	}

	async function setSounds(enabled: boolean) {
		await userSettings.updateGeneral({ soundsEnabled: enabled });
	}

	let restartingOnboarding = $state(false);

	async function restartOnboarding() {
		if (restartingOnboarding) return;
		restartingOnboarding = true;
		try {
			await onboardingStatus.reset();
			await goto('/onboarding/name');
		} catch (err) {
			console.error('[settings] restart onboarding failed:', err);
			restartingOnboarding = false;
		}
	}
</script>

<SettingsPanel id="global">
	<SettingsSectionHeader
		icon={Gear}
		title={$_('settings.general.title')}
		description={$_('settings.general.description')}
	/>

	<div class="rows">
		<div class="row">
			<div class="row-info">
				<p class="row-title">{$_('settings.general.language_title')}</p>
				<p class="row-desc">{$_('settings.general.language_description')}</p>
			</div>
			<div class="btn-group">
				{#each languages as lang}
					<button
						class="choice-btn"
						class:active={userSettings.globalSettings.locale === lang.id}
						onclick={() => setLocale(lang.id)}>{lang.label}</button
					>
				{/each}
			</div>
		</div>

		<div class="row">
			<div class="row-info">
				<p class="row-title">{$_('settings.general.color_scheme_title')}</p>
				<p class="row-desc">{$_('settings.general.color_scheme_description')}</p>
			</div>
			<div class="color-group">
				{#each colorSchemes as scheme}
					<button
						class="color-swatch {scheme.color}"
						class:selected={userSettings.globalSettings.theme.colorScheme === scheme.id}
						onclick={() => setColorScheme(scheme.id)}
						title={scheme.label}
					></button>
				{/each}
			</div>
		</div>

		<div class="row">
			<div class="row-info">
				<p class="row-title">{$_('settings.general.color_mode_title')}</p>
				<p class="row-desc">{$_('settings.general.color_mode_description')}</p>
			</div>
			<div class="btn-group">
				{#each [{ id: 'light', label: $_('settings.general.color_mode_light') }, { id: 'dark', label: $_('settings.general.color_mode_dark') }, { id: 'system', label: $_('settings.general.color_mode_system') }] as mode}
					<button
						class="choice-btn"
						class:active={userSettings.globalSettings.theme.mode === mode.id}
						onclick={() => setThemeMode(mode.id as ThemeMode)}>{mode.label}</button
					>
				{/each}
			</div>
		</div>

		<div class="row">
			<div class="row-info">
				<p class="row-title">{$_('settings.general.week_start_title')}</p>
				<p class="row-desc">{$_('settings.general.week_start_description')}</p>
			</div>
			<div class="btn-group">
				<button
					class="choice-btn"
					class:active={userSettings.general?.weekStartsOn === 'monday'}
					onclick={() => setWeekStart('monday')}>{$_('settings.general.week_start_monday')}</button
				>
				<button
					class="choice-btn"
					class:active={userSettings.general?.weekStartsOn === 'sunday'}
					onclick={() => setWeekStart('sunday')}>{$_('settings.general.week_start_sunday')}</button
				>
			</div>
		</div>

		<div class="row">
			<div class="row-info">
				<p class="row-title">{$_('settings.general.sounds_title')}</p>
				<p class="row-desc">{$_('settings.general.sounds_description')}</p>
			</div>
			<button
				class="toggle"
				class:on={userSettings.general?.soundsEnabled ?? true}
				onclick={() => setSounds(!(userSettings.general?.soundsEnabled ?? true))}
				aria-label={$_('settings.general.sounds_aria')}
				aria-pressed={userSettings.general?.soundsEnabled ?? true}
			>
				<span class="toggle-knob"></span>
			</button>
		</div>

		<div class="row">
			<div class="row-info">
				<p class="row-title">{$_('settings.general.onboarding_title')}</p>
				<p class="row-desc">{$_('settings.general.onboarding_description')}</p>
			</div>
			<button
				type="button"
				class="restart-btn"
				onclick={restartOnboarding}
				disabled={restartingOnboarding}
			>
				{restartingOnboarding
					? $_('settings.general.onboarding_starting')
					: $_('settings.general.onboarding_start')}
			</button>
		</div>
	</div>
</SettingsPanel>

<style>
	.rows {
		display: flex;
		flex-direction: column;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.row:last-child {
		border-bottom: none;
	}

	.row-info {
		min-width: 0;
		flex: 1;
	}

	.row-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
	}

	.row-desc {
		margin: 0;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.btn-group {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.choice-btn {
		padding: 0.375rem 0.625rem;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 0.5rem;
		border: none;
		cursor: pointer;
		transition: all 0.15s;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.choice-btn:hover {
		opacity: 0.8;
	}

	.choice-btn.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.color-group {
		display: flex;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.color-swatch {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		border: none;
		cursor: pointer;
		transition: transform 0.15s;
	}

	.color-swatch:hover {
		transform: scale(1.1);
	}

	.color-swatch.selected {
		box-shadow:
			0 0 0 2px hsl(var(--color-card)),
			0 0 0 4px hsl(var(--color-primary));
	}

	.toggle {
		position: relative;
		width: 2.75rem;
		height: 1.5rem;
		border-radius: 9999px;
		border: none;
		cursor: pointer;
		transition: background 0.2s;
		background: hsl(var(--color-muted));
		flex-shrink: 0;
	}

	.toggle.on {
		background: hsl(var(--color-primary));
	}

	.toggle-knob {
		position: absolute;
		top: 0.125rem;
		left: 0.125rem;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background: white;
		transition: transform 0.2s;
		box-shadow: 0 1px 3px hsl(0 0% 0% / 0.15);
	}

	.toggle.on .toggle-knob {
		transform: translateX(1.25rem);
	}

	.restart-btn {
		padding: 0.375rem 0.875rem;
		border: 1px solid hsl(var(--color-border));
		background: hsl(var(--color-surface, var(--color-background)));
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: 0.5rem;
		cursor: pointer;
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}

	.restart-btn:hover:not(:disabled) {
		background: hsl(var(--color-muted) / 0.3);
		border-color: hsl(var(--color-primary) / 0.4);
	}

	.restart-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
