<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { TimeFormat, AllDayDisplayMode } from '$lib/stores/settings.svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { toast } from '$lib/stores/toast';
	import { GlobalSettingsSection } from '@manacore/shared-ui';
	import type { CalendarViewType, Calendar } from '@calendar/shared';

	// Calendar management state
	let editingCalendar = $state<Calendar | null>(null);
	let showNewCalendarForm = $state(false);
	let newCalendarName = $state('');
	let newCalendarColor = $state('#3b82f6');

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}
		settingsStore.initialize();
		await userSettings.load();
	});

	// Calendar management functions
	async function handleCreateCalendar() {
		if (!newCalendarName.trim()) return;

		const result = await calendarsStore.createCalendar({
			name: newCalendarName.trim(),
			color: newCalendarColor,
		});

		if (result.error) {
			toast.error(`Fehler: ${result.error.message}`);
			return;
		}

		toast.success('Kalender erstellt');
		newCalendarName = '';
		showNewCalendarForm = false;
	}

	async function handleDeleteCalendar(calendar: Calendar) {
		if (!confirm(`Möchten Sie "${calendar.name}" wirklich löschen?`)) {
			return;
		}

		const result = await calendarsStore.deleteCalendar(calendar.id);

		if (result.error) {
			toast.error(`Fehler: ${result.error.message}`);
			return;
		}

		toast.success('Kalender gelöscht');
	}

	async function handleUpdateCalendar(calendar: Calendar, name: string, color: string) {
		const result = await calendarsStore.updateCalendar(calendar.id, { name, color });

		if (result.error) {
			toast.error(`Fehler: ${result.error.message}`);
			return;
		}

		toast.success('Kalender aktualisiert');
		editingCalendar = null;
	}

	function handleViewChange(view: CalendarViewType) {
		settingsStore.set('defaultView', view);
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

	<!-- Meine Kalender -->
	<section class="settings-section card">
		<div class="calendars-header">
			<h2>Meine Kalender</h2>
			<button class="btn btn-primary btn-sm" onclick={() => (showNewCalendarForm = true)}>
				Neuer Kalender
			</button>
		</div>

		{#if showNewCalendarForm}
			<div class="new-calendar-form">
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleCreateCalendar();
					}}
				>
					<div class="calendar-form-row">
						<input
							type="text"
							class="input"
							placeholder="Kalender Name"
							bind:value={newCalendarName}
						/>
						<input type="color" class="color-input" bind:value={newCalendarColor} />
					</div>
					<div class="calendar-form-actions">
						<button
							type="button"
							class="btn btn-ghost"
							onclick={() => (showNewCalendarForm = false)}
						>
							Abbrechen
						</button>
						<button type="submit" class="btn btn-primary" disabled={!newCalendarName.trim()}>
							Erstellen
						</button>
					</div>
				</form>
			</div>
		{/if}

		<div class="calendar-list">
			{#each calendarsStore.calendars as calendar}
				<div class="calendar-card">
					{#if editingCalendar?.id === calendar.id}
						<form
							onsubmit={(e) => {
								e.preventDefault();
								const form = e.target as HTMLFormElement;
								const name = (form.elements.namedItem('name') as HTMLInputElement).value;
								const color = (form.elements.namedItem('color') as HTMLInputElement).value;
								handleUpdateCalendar(calendar, name, color);
							}}
						>
							<div class="calendar-form-row">
								<input type="text" name="name" class="input" value={calendar.name} />
								<input type="color" name="color" class="color-input" value={calendar.color} />
							</div>
							<div class="calendar-form-actions">
								<button
									type="button"
									class="btn btn-ghost"
									onclick={() => (editingCalendar = null)}
								>
									Abbrechen
								</button>
								<button type="submit" class="btn btn-primary"> Speichern </button>
							</div>
						</form>
					{:else}
						<div class="calendar-info">
							<span class="color-dot" style="background-color: {calendar.color}"></span>
							<span class="calendar-name">{calendar.name}</span>
							{#if calendar.isDefault}
								<span class="badge">Standard</span>
							{/if}
						</div>
						<div class="calendar-actions">
							<button class="btn btn-ghost btn-sm" onclick={() => (editingCalendar = calendar)}>
								Bearbeiten
							</button>
							{#if !calendar.isDefault}
								<button
									class="btn btn-ghost btn-sm text-destructive"
									onclick={() => handleDeleteCalendar(calendar)}
								>
									Löschen
								</button>
							{/if}
						</div>
					{/if}
				</div>
			{/each}

			{#if calendarsStore.calendars.length === 0}
				<div class="empty-state">
					<p>Keine Kalender vorhanden</p>
				</div>
			{/if}
		</div>
	</section>

	<!-- Global App Settings (synced across all apps) -->
	<section class="settings-section">
		<GlobalSettingsSection
			{userSettings}
			appId="calendar"
			title="App-Einstellungen"
			description="Diese Einstellungen werden mit allen Mana Apps synchronisiert"
		/>
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

		<div class="setting-item">
			<label class="toggle-setting">
				<input
					type="checkbox"
					checked={settingsStore.filterHoursEnabled}
					onchange={() =>
						settingsStore.set('filterHoursEnabled', !settingsStore.filterHoursEnabled)}
				/>
				<div class="toggle-info">
					<span class="setting-label">Stunden filtern</span>
					<span class="setting-description"
						>Nur bestimmte Stunden in der Tages-/Wochenansicht anzeigen</span
					>
				</div>
			</label>
		</div>

		{#if settingsStore.filterHoursEnabled}
			<div class="setting-item hour-range-setting">
				<div class="setting-info">
					<span class="setting-label">Sichtbare Stunden</span>
					<span class="setting-description"
						>Zeitbereich der in der Kalenderansicht angezeigt wird</span
					>
				</div>
				<div class="hour-range-inputs">
					<div class="hour-input-group">
						<label for="start-hour">Von</label>
						<select
							id="start-hour"
							class="select-input hour-select"
							value={settingsStore.dayStartHour}
							onchange={(e) => settingsStore.set('dayStartHour', Number(e.currentTarget.value))}
						>
							{#each Array.from({ length: 24 }, (_, i) => i) as hour}
								{#if hour < settingsStore.dayEndHour}
									<option value={hour}>{hour.toString().padStart(2, '0')}:00</option>
								{/if}
							{/each}
						</select>
					</div>
					<span class="hour-separator">–</span>
					<div class="hour-input-group">
						<label for="end-hour">Bis</label>
						<select
							id="end-hour"
							class="select-input hour-select"
							value={settingsStore.dayEndHour}
							onchange={(e) => settingsStore.set('dayEndHour', Number(e.currentTarget.value))}
						>
							{#each Array.from({ length: 24 }, (_, i) => i + 1) as hour}
								{#if hour > settingsStore.dayStartHour}
									<option value={hour}>{hour.toString().padStart(2, '0')}:00</option>
								{/if}
							{/each}
						</select>
					</div>
				</div>
			</div>
		{/if}

		<div class="setting-item">
			<div class="setting-info">
				<span class="setting-label">Ganztägige Termine</span>
				<span class="setting-description">Wie sollen ganztägige Termine angezeigt werden?</span>
			</div>
			<div class="button-group">
				<button
					class="group-button"
					class:active={settingsStore.allDayDisplayMode === 'header'}
					onclick={() => settingsStore.set('allDayDisplayMode', 'header' as AllDayDisplayMode)}
				>
					In Kopfzeile
				</button>
				<button
					class="group-button"
					class:active={settingsStore.allDayDisplayMode === 'block'}
					onclick={() => settingsStore.set('allDayDisplayMode', 'block' as AllDayDisplayMode)}
				>
					Als Tagesblock
				</button>
			</div>
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
						{duration >= 60
							? `${duration / 60} Stunde${duration > 60 ? 'n' : ''}`
							: `${duration} Minuten`}
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
			<button
				class="btn btn-ghost text-destructive"
				onclick={() => authStore.signOut().then(() => goto('/login'))}
			>
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

	/* Hour range settings */
	.hour-range-setting {
		padding-left: 2rem;
		border-left: 2px solid hsl(var(--color-primary) / 0.3);
		margin-left: 0.5rem;
	}

	.hour-range-inputs {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.hour-input-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.hour-input-group label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.hour-select {
		width: 100px;
	}

	.hour-separator {
		font-size: 1.25rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 1.25rem;
	}

	/* Calendar management styles */
	.calendars-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid hsl(var(--color-border));
	}

	.calendars-header h2 {
		margin: 0;
		padding: 0;
		border: none;
	}

	.new-calendar-form {
		margin-bottom: 1rem;
		padding: 1rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: var(--radius-md);
	}

	.calendar-form-row {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.calendar-form-row .input {
		flex: 1;
	}

	.color-input {
		width: 48px;
		height: 42px;
		padding: 4px;
		border: 2px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		cursor: pointer;
	}

	.calendar-form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.calendar-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.calendar-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		background: hsl(var(--color-muted) / 0.2);
		border-radius: var(--radius-md);
	}

	.calendar-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.color-dot {
		width: 16px;
		height: 16px;
		border-radius: var(--radius-full);
	}

	.calendar-name {
		font-weight: 500;
	}

	.badge {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		background: hsl(var(--color-muted));
		border-radius: var(--radius-sm);
		color: hsl(var(--color-muted-foreground));
	}

	.calendar-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-sm {
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
	}

	.empty-state {
		text-align: center;
		padding: 1.5rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
