<script lang="ts">
	import { onMount } from 'svelte';
	import { Gear } from '@mana/shared-icons';
	import type { ThemeMode, WeekStartDay } from '@mana/shared-theme';
	import { userSettings } from '$lib/stores/user-settings.svelte';
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

	const colorSchemes = [
		{ id: 'ocean', label: 'Ozean', color: 'bg-blue-500' },
		{ id: 'nature', label: 'Natur', color: 'bg-green-500' },
		{ id: 'lume', label: 'Lume', color: 'bg-amber-500' },
		{ id: 'stone', label: 'Stein', color: 'bg-slate-500' },
	];

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
</script>

<SettingsPanel id="global">
	<SettingsSectionHeader
		icon={Gear}
		title="Allgemein"
		description="Sprache, Wochenstart & Sounds"
	/>

	<div class="rows">
		<div class="row">
			<div class="row-info">
				<p class="row-title">Anzeigesprache</p>
				<p class="row-desc">Sprache der Benutzeroberfläche</p>
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
				<p class="row-title">Farbschema</p>
				<p class="row-desc">Akzentfarbe der Oberfläche</p>
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
				<p class="row-title">Farbmodus</p>
				<p class="row-desc">Hell, Dunkel oder automatisch</p>
			</div>
			<div class="btn-group">
				{#each [{ id: 'light', label: 'Hell' }, { id: 'dark', label: 'Dunkel' }, { id: 'system', label: 'System' }] as mode}
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
				<p class="row-title">Wochenstart</p>
				<p class="row-desc">Erster Tag der Woche in Kalendern</p>
			</div>
			<div class="btn-group">
				<button
					class="choice-btn"
					class:active={userSettings.general?.weekStartsOn === 'monday'}
					onclick={() => setWeekStart('monday')}>Montag</button
				>
				<button
					class="choice-btn"
					class:active={userSettings.general?.weekStartsOn === 'sunday'}
					onclick={() => setWeekStart('sunday')}>Sonntag</button
				>
			</div>
		</div>

		<div class="row">
			<div class="row-info">
				<p class="row-title">Sounds</p>
				<p class="row-desc">Sound-Effekte in allen Apps</p>
			</div>
			<button
				class="toggle"
				class:on={userSettings.general?.soundsEnabled ?? true}
				onclick={() => setSounds(!(userSettings.general?.soundsEnabled ?? true))}
				aria-label="Sounds ein- oder ausschalten"
				aria-pressed={userSettings.general?.soundsEnabled ?? true}
			>
				<span class="toggle-knob"></span>
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
</style>
