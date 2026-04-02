<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { TimeFormat, AllDayDisplayMode, SttLanguage } from '$lib/stores/settings.svelte';
	import { getContext } from 'svelte';
	import CalendarManagement from '$lib/components/settings/CalendarManagement.svelte';
	import {
		GlobalSettingsSection,
		SettingsSection,
		SettingsCard,
		FilterDropdown,
		type FilterDropdownOption,
	} from '@manacore/shared-ui';
	import { X, CalendarBlank, Eye, Clock, Microphone, Cake, User } from '@manacore/shared-icons';
	import { focusTrap } from '@manacore/shared-ui';
	import type { CalendarViewType, Calendar } from '@calendar/shared';

	interface Props {
		visible: boolean;
		onClose: () => void;
	}

	let { visible, onClose }: Props = $props();

	// Get calendars from layout context (live query)
	const calendarsCtx: { readonly value: Calendar[] } = getContext('calendars');

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
		week: 'Woche',
		month: 'Monat',
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

	// FilterDropdown options
	let viewOptions = $derived<FilterDropdownOption[]>(
		Object.entries(viewLabels).map(([value, label]) => ({ value, label }))
	);

	let durationDropdownOptions = $derived<FilterDropdownOption[]>(
		durationOptions.map((duration) => ({
			value: String(duration),
			label:
				duration >= 60
					? `${duration / 60} Stunde${duration > 60 ? 'n' : ''}`
					: `${duration} Minuten`,
		}))
	);

	let reminderDropdownOptions = $derived<FilterDropdownOption[]>(
		reminderOptions.map((opt) => ({
			value: String(opt.value),
			label: opt.label,
		}))
	);

	// Dynamic hour options (filtered by the other value)
	let hourStartOptions = $derived<FilterDropdownOption[]>(
		Array.from({ length: 24 }, (_, i) => i)
			.filter((hour) => hour < settingsStore.dayEndHour)
			.map((hour) => ({
				value: String(hour),
				label: `${hour.toString().padStart(2, '0')}:00`,
			}))
	);

	let hourEndOptions = $derived<FilterDropdownOption[]>(
		Array.from({ length: 24 }, (_, i) => i + 1)
			.filter((hour) => hour > settingsStore.dayStartHour)
			.map((hour) => ({
				value: String(hour),
				label: `${hour.toString().padStart(2, '0')}:00`,
			}))
	);

	// Keyboard handler
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	onMount(async () => {
		settingsStore.initialize();
		await userSettings.load();
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if visible}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={onClose}></div>

	<!-- Modal -->
	<div
		class="settings-modal"
		role="dialog"
		aria-modal="true"
		aria-label="Einstellungen"
		use:focusTrap
	>
		<!-- Header -->
		<div class="modal-header">
			<h2 class="modal-title">Einstellungen</h2>
			<button class="header-btn close-btn" onclick={onClose} title="Schließen">
				<X size={18} weight="bold" />
			</button>
		</div>

		<!-- Content -->
		<div class="modal-content">
			<!-- Meine Kalender -->
			<SettingsSection title="Meine Kalender">
				{#snippet icon()}
					<CalendarBlank size={24} />
				{/snippet}
				<SettingsCard>
					<div class="p-4">
						<CalendarManagement calendars={calendarsCtx.value} />
					</div>
				</SettingsCard>
			</SettingsSection>

			<!-- Global App Settings (synced across all apps) -->
			<GlobalSettingsSection
				{userSettings}
				appId="calendar"
				title="App-Einstellungen"
				description="Diese Einstellungen werden mit allen Mana Apps synchronisiert"
			/>

			<!-- Kalender-Ansicht -->
			<SettingsSection title="Kalender-Ansicht">
				{#snippet icon()}
					<Eye size={24} />
				{/snippet}
				<SettingsCard>
					<div class="p-4 space-y-3">
						<div class="setting-item">
							<div class="setting-info">
								<span class="setting-label">Standard-Ansicht</span>
								<span class="setting-description">Ansicht beim Öffnen des Kalenders</span>
							</div>
							<FilterDropdown
								options={viewOptions}
								value={settingsStore.defaultView}
								onChange={(v) => handleViewChange(v as CalendarViewType)}
								placeholder="Ansicht wählen"
							/>
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
									onchange={() =>
										settingsStore.set('showOnlyWeekdays', !settingsStore.showOnlyWeekdays)}
								/>
								<div class="toggle-info">
									<span class="setting-label">Nur Werktage anzeigen</span>
									<span class="setting-description"
										>Wochenenden in der Kalenderansicht ausblenden</span
									>
								</div>
							</label>
						</div>

						<div class="setting-item">
							<label class="toggle-setting">
								<input
									type="checkbox"
									checked={settingsStore.showWeekNumbers}
									onchange={() =>
										settingsStore.set('showWeekNumbers', !settingsStore.showWeekNumbers)}
								/>
								<div class="toggle-info">
									<span class="setting-label">Wochennummern anzeigen</span>
									<span class="setting-description">Kalenderwoche (KW) in der Ansicht anzeigen</span
									>
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
										<span class="hour-label">Von</span>
										<FilterDropdown
											options={hourStartOptions}
											value={String(settingsStore.dayStartHour)}
											onChange={(v) => settingsStore.set('dayStartHour', Number(v))}
											placeholder="Start"
										/>
									</div>
									<span class="hour-separator">–</span>
									<div class="hour-input-group">
										<span class="hour-label">Bis</span>
										<FilterDropdown
											options={hourEndOptions}
											value={String(settingsStore.dayEndHour)}
											onChange={(v) => settingsStore.set('dayEndHour', Number(v))}
											placeholder="Ende"
										/>
									</div>
								</div>
							</div>
						{/if}

						<div class="setting-item">
							<div class="setting-info">
								<span class="setting-label">Ganztägige Termine</span>
								<span class="setting-description"
									>Wie sollen ganztägige Termine angezeigt werden?</span
								>
							</div>
							<div class="button-group">
								<button
									class="group-button"
									class:active={settingsStore.allDayDisplayMode === 'header'}
									onclick={() =>
										settingsStore.set('allDayDisplayMode', 'header' as AllDayDisplayMode)}
								>
									In Kopfzeile
								</button>
								<button
									class="group-button"
									class:active={settingsStore.allDayDisplayMode === 'block'}
									onclick={() =>
										settingsStore.set('allDayDisplayMode', 'block' as AllDayDisplayMode)}
								>
									Als Tagesblock
								</button>
							</div>
						</div>
					</div>
				</SettingsCard>
			</SettingsSection>

			<!-- Termin-Einstellungen -->
			<SettingsSection title="Termine">
				{#snippet icon()}
					<Clock size={24} />
				{/snippet}
				<SettingsCard>
					<div class="p-4 space-y-3">
						<div class="setting-item">
							<div class="setting-info">
								<span class="setting-label">Standard-Dauer</span>
								<span class="setting-description">Voreingestellte Dauer für neue Termine</span>
							</div>
							<FilterDropdown
								options={durationDropdownOptions}
								value={String(settingsStore.defaultEventDuration)}
								onChange={(v) => handleEventDurationChange(Number(v))}
								placeholder="Dauer wählen"
							/>
						</div>

						<div class="setting-item">
							<div class="setting-info">
								<span class="setting-label">Standard-Erinnerung</span>
								<span class="setting-description">Voreingestellte Erinnerung für neue Termine</span>
							</div>
							<FilterDropdown
								options={reminderDropdownOptions}
								value={String(settingsStore.defaultReminder)}
								onChange={(v) => handleReminderChange(Number(v))}
								placeholder="Erinnerung wählen"
							/>
						</div>
					</div>
				</SettingsCard>
			</SettingsSection>

			<!-- Spracheingabe -->
			<SettingsSection title="Spracheingabe">
				{#snippet icon()}
					<Microphone size={24} />
				{/snippet}
				<SettingsCard>
					<div class="p-4 space-y-3">
						<div class="setting-item">
							<div class="setting-info">
								<span class="setting-label">Sprache der Spracherkennung</span>
								<span class="setting-description"
									>Sprache für die Transkription von Sprachaufnahmen</span
								>
							</div>
							<div class="button-group">
								<button
									class="group-button"
									class:active={settingsStore.sttLanguage === 'de'}
									onclick={() => settingsStore.set('sttLanguage', 'de' as SttLanguage)}
								>
									Deutsch
								</button>
								<button
									class="group-button"
									class:active={settingsStore.sttLanguage === 'auto'}
									onclick={() => settingsStore.set('sttLanguage', 'auto' as SttLanguage)}
								>
									Automatisch
								</button>
							</div>
						</div>
					</div>
				</SettingsCard>
			</SettingsSection>

			<!-- Geburtstage -->
			<SettingsSection title="Geburtstage">
				{#snippet icon()}
					<Cake size={24} />
				{/snippet}
				<SettingsCard>
					<div class="p-4 space-y-3">
						<div class="setting-item">
							<label class="toggle-setting">
								<input
									type="checkbox"
									checked={settingsStore.showBirthdays}
									onchange={() => settingsStore.set('showBirthdays', !settingsStore.showBirthdays)}
								/>
								<div class="toggle-info">
									<span class="setting-label">Geburtstage anzeigen</span>
									<span class="setting-description"
										>Geburtstage aus Kontakten im Kalender anzeigen</span
									>
								</div>
							</label>
						</div>

						{#if settingsStore.showBirthdays}
							<div class="setting-item birthday-age-setting">
								<label class="toggle-setting">
									<input
										type="checkbox"
										checked={settingsStore.showBirthdayAge}
										onchange={() =>
											settingsStore.set('showBirthdayAge', !settingsStore.showBirthdayAge)}
									/>
									<div class="toggle-info">
										<span class="setting-label">Alter anzeigen</span>
										<span class="setting-description"
											>Das Alter der Person bei Geburtstagen anzeigen</span
										>
									</div>
								</label>
							</div>
						{/if}
					</div>
				</SettingsCard>
			</SettingsSection>

			<!-- Konto -->
			<SettingsSection title="Konto">
				{#snippet icon()}
					<User size={24} />
				{/snippet}
				<SettingsCard>
					<div class="p-4 space-y-3">
						<div class="setting-item">
							<div class="setting-info">
								<span class="setting-label">E-Mail</span>
								<span class="setting-value">{authStore.user?.email || '-'}</span>
							</div>
						</div>

						<div class="setting-item">
							<button
								class="btn btn-ghost text-destructive"
								onclick={() => {
									authStore.signOut().then(() => goto('/login'));
									onClose();
								}}
							>
								Abmelden
							</button>
						</div>
					</div>
				</SettingsCard>
			</SettingsSection>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.3);
		z-index: 99;
	}

	:global(.dark) .modal-backdrop {
		background: rgba(0, 0, 0, 0.5);
	}

	.settings-modal {
		position: fixed;
		bottom: calc(140px + env(safe-area-inset-bottom, 0px));
		left: 50%;
		transform: translateX(-50%);
		width: calc(100% - 2rem);
		max-width: 550px;
		max-height: 70vh;
		z-index: 100;
		background: rgba(255, 255, 255, 0.98);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 1rem;
		box-shadow:
			0 25px 50px -12px rgba(0, 0, 0, 0.25),
			0 0 0 1px rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	:global(.dark) .settings-modal {
		background: rgba(30, 30, 30, 0.98);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1rem 0.75rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		flex-shrink: 0;
	}

	:global(.dark) .modal-header {
		border-bottom-color: rgba(255, 255, 255, 0.08);
	}

	.modal-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
	}

	:global(.dark) .modal-title {
		color: #f3f4f6;
	}

	.header-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: transparent;
		border: none;
		cursor: pointer;
		color: #6b7280;
		transition: all 0.15s ease;
	}

	.header-btn:hover {
		background: rgba(0, 0, 0, 0.05);
		color: #1f2937;
	}

	:global(.dark) .header-btn {
		color: #9ca3af;
	}

	:global(.dark) .header-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #f3f4f6;
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Settings section styles */
	.setting-item {
		padding: 0.75rem 0;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
	}

	.setting-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.setting-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		margin-bottom: 0.5rem;
	}

	.setting-label {
		font-weight: 500;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
	}

	.setting-description {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.setting-value {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
	}

	/* Button group */
	.button-group {
		display: flex;
		gap: 0;
	}

	.group-button {
		padding: 0.375rem 0.75rem;
		border: 2px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
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
		gap: 0.5rem;
		cursor: pointer;
	}

	.toggle-setting input[type='checkbox'] {
		width: 1rem;
		height: 1rem;
		margin-top: 0.125rem;
		accent-color: hsl(var(--color-primary));
		cursor: pointer;
	}

	.toggle-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.toggle-info .setting-label {
		margin-bottom: 0;
	}

	.text-destructive {
		color: hsl(var(--color-error));
	}

	/* Hour range settings */
	.hour-range-setting {
		padding-left: 1.5rem;
		border-left: 2px solid hsl(var(--color-primary) / 0.3);
		margin-left: 0.5rem;
	}

	.hour-range-inputs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.hour-input-group {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.hour-label {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.hour-separator {
		font-size: 1rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 1rem;
	}

	/* Birthday age setting (indented sub-setting) */
	.birthday-age-setting {
		padding-left: 1.5rem;
		border-left: 2px solid hsl(var(--color-primary) / 0.3);
		margin-left: 0.5rem;
	}
</style>
