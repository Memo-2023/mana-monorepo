<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme';
	import { settingsStore, type WeekStartDay, type TimeFormat } from '$lib/stores/settings.svelte';
	import { setLocale, supportedLocales, type SupportedLocale } from '$lib/i18n';
	import { THEME_DEFINITIONS } from '@manacore/shared-theme';
	import type { CalendarViewType } from '@calendar/shared';

	// Get current locale from svelte-i18n
	import { locale } from 'svelte-i18n';

	onMount(() => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}
		settingsStore.initialize();
	});

	function handleThemeChange(mode: 'light' | 'dark' | 'system') {
		theme.setMode(mode);
	}

	function handleLocaleChange(newLocale: SupportedLocale) {
		setLocale(newLocale);
	}

	function handleViewChange(view: CalendarViewType) {
		settingsStore.set('defaultView', view);
	}

	function handleWeekStartChange(day: WeekStartDay) {
		settingsStore.set('weekStartsOn', day);
	}

	function handleTimeFormatChange(format: TimeFormat) {
		settingsStore.set('timeFormat', format);
	}

	function handleEventDurationChange(duration: number) {
		settingsStore.set('defaultEventDuration', duration);
	}

	function handleReminderChange(minutes: number) {
		settingsStore.set('defaultReminder', minutes);
	}

	// Language labels
	const localeLabels: Record<SupportedLocale, string> = {
		de: 'Deutsch',
		en: 'English',
		fr: 'Français',
		es: 'Español',
		it: 'Italiano',
	};

	// View labels
	const viewLabels: Record<CalendarViewType, string> = {
		day: 'Tag',
		'5day': '5 Tage',
		week: 'Woche',
		'10day': '10 Tage',
		'14day': '14 Tage',
		month: 'Monat',
		year: 'Jahr',
		agenda: 'Agenda',
	};

	// Duration options in minutes
	const durationOptions = [15, 30, 45, 60, 90, 120];

	// Reminder options in minutes
	const reminderOptions = [
		{ value: 0, label: 'Keine' },
		{ value: 5, label: '5 Minuten' },
		{ value: 10, label: '10 Minuten' },
		{ value: 15, label: '15 Minuten' },
		{ value: 30, label: '30 Minuten' },
		{ value: 60, label: '1 Stunde' },
		{ value: 1440, label: '1 Tag' },
	];
</script>

<svelte:head>
	<title>Einstellungen | Kalender</title>
</svelte:head>

<div class="settings-page">
	<header class="page-header">
		<h1>Einstellungen</h1>
	</header>

	<!-- Sprache -->
	<section class="settings-section card">
		<h2>Sprache</h2>

		<div class="setting-item">
			<div class="setting-info">
				<span class="setting-label">Anzeigesprache</span>
				<span class="setting-description">Sprache für die Benutzeroberfläche</span>
			</div>
			<div class="locale-options">
				{#each supportedLocales as loc}
					<button
						class="locale-option"
						class:active={$locale === loc}
						onclick={() => handleLocaleChange(loc)}
					>
						{localeLabels[loc]}
					</button>
				{/each}
			</div>
		</div>
	</section>

	<!-- Erscheinungsbild -->
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
					<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
					<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
					</svg>
					Dunkel
				</button>
				<button
					class="theme-option"
					class:active={theme.mode === 'system'}
					onclick={() => handleThemeChange('system')}
				>
					<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

	<!-- Kalender-Ansicht -->
	<section class="settings-section card">
		<h2>Kalender-Ansicht</h2>

		<div class="setting-item">
			<div class="setting-info">
				<span class="setting-label">Standard-Ansicht</span>
				<span class="setting-description">Ansicht beim Öffnen des Kalenders</span>
			</div>
			<select
				class="select-input"
				value={settingsStore.defaultView}
				onchange={(e) => handleViewChange(e.currentTarget.value as CalendarViewType)}
			>
				{#each Object.entries(viewLabels) as [value, label]}
					<option {value}>{label}</option>
				{/each}
			</select>
		</div>

		<div class="setting-item">
			<div class="setting-info">
				<span class="setting-label">Wochenstart</span>
				<span class="setting-description">Erster Tag der Woche</span>
			</div>
			<div class="button-group">
				<button
					class="group-button"
					class:active={settingsStore.weekStartsOn === 1}
					onclick={() => handleWeekStartChange(1)}
				>
					Montag
				</button>
				<button
					class="group-button"
					class:active={settingsStore.weekStartsOn === 0}
					onclick={() => handleWeekStartChange(0)}
				>
					Sonntag
				</button>
			</div>
		</div>

		<div class="setting-item">
			<div class="setting-info">
				<span class="setting-label">Zeitformat</span>
				<span class="setting-description">Anzeige der Uhrzeiten</span>
			</div>
			<div class="button-group">
				<button
					class="group-button"
					class:active={settingsStore.timeFormat === '24h'}
					onclick={() => handleTimeFormatChange('24h')}
				>
					24h (14:00)
				</button>
				<button
					class="group-button"
					class:active={settingsStore.timeFormat === '12h'}
					onclick={() => handleTimeFormatChange('12h')}
				>
					12h (2:00 PM)
				</button>
			</div>
		</div>

		<div class="setting-item">
			<label class="toggle-setting">
				<input
					type="checkbox"
					checked={settingsStore.showOnlyWeekdays}
					onchange={() => settingsStore.set('showOnlyWeekdays', !settingsStore.showOnlyWeekdays)}
				/>
				<div class="toggle-info">
					<span class="setting-label">Nur Werktage anzeigen</span>
					<span class="setting-description">Wochenenden in der Kalenderansicht ausblenden</span>
				</div>
			</label>
		</div>

		<div class="setting-item">
			<label class="toggle-setting">
				<input
					type="checkbox"
					checked={settingsStore.showWeekNumbers}
					onchange={() => settingsStore.set('showWeekNumbers', !settingsStore.showWeekNumbers)}
				/>
				<div class="toggle-info">
					<span class="setting-label">Wochennummern anzeigen</span>
					<span class="setting-description">Kalenderwoche (KW) in der Ansicht anzeigen</span>
				</div>
			</label>
		</div>
	</section>

	<!-- Termin-Einstellungen -->
	<section class="settings-section card">
		<h2>Termine</h2>

		<div class="setting-item">
			<div class="setting-info">
				<span class="setting-label">Standard-Dauer</span>
				<span class="setting-description">Voreingestellte Dauer für neue Termine</span>
			</div>
			<select
				class="select-input"
				value={settingsStore.defaultEventDuration}
				onchange={(e) => handleEventDurationChange(Number(e.currentTarget.value))}
			>
				{#each durationOptions as duration}
					<option value={duration}>
						{duration >= 60 ? `${duration / 60} Stunde${duration > 60 ? 'n' : ''}` : `${duration} Minuten`}
					</option>
				{/each}
			</select>
		</div>

		<div class="setting-item">
			<div class="setting-info">
				<span class="setting-label">Standard-Erinnerung</span>
				<span class="setting-description">Voreingestellte Erinnerung für neue Termine</span>
			</div>
			<select
				class="select-input"
				value={settingsStore.defaultReminder}
				onchange={(e) => handleReminderChange(Number(e.currentTarget.value))}
			>
				{#each reminderOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>
	</section>

	<!-- Konto -->
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
		padding-bottom: 2rem;
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

	/* Language options */
	.locale-options {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.locale-option {
		padding: 0.5rem 1rem;
		border: 2px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.locale-option:hover {
		border-color: hsl(var(--color-primary) / 0.5);
	}

	.locale-option.active {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
	}

	/* Theme options */
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

	.theme-option .icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	/* Variant grid */
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

	/* Select input */
	.select-input {
		width: 100%;
		max-width: 250px;
		padding: 0.5rem 0.75rem;
		border: 2px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		background: hsl(var(--color-background));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		cursor: pointer;
	}

	.select-input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
	}

	/* Button group */
	.button-group {
		display: flex;
		gap: 0;
	}

	.group-button {
		padding: 0.5rem 1rem;
		border: 2px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.group-button:first-child {
		border-radius: var(--radius-md) 0 0 var(--radius-md);
	}

	.group-button:last-child {
		border-radius: 0 var(--radius-md) var(--radius-md) 0;
		border-left: none;
	}

	.group-button:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.group-button.active {
		border-color: hsl(var(--color-primary));
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
	}

	/* Toggle setting */
	.toggle-setting {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		cursor: pointer;
	}

	.toggle-setting input[type='checkbox'] {
		width: 1.25rem;
		height: 1.25rem;
		margin-top: 0.125rem;
		accent-color: hsl(var(--color-primary));
		cursor: pointer;
	}

	.toggle-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.toggle-info .setting-label {
		margin-bottom: 0;
	}

	.text-destructive {
		color: hsl(var(--color-error));
	}
</style>
