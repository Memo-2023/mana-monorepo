<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { TimeFormat, AllDayDisplayMode, SttLanguage } from '$lib/stores/settings.svelte';
	import { getContext } from 'svelte';
	import { calendarsStore } from '$lib/stores/calendars.svelte';
	import { getDefaultCalendar } from '$lib/data/queries';
	import {
		toastStore as toast,
		GlobalSettingsSection,
		SettingsSection,
		SettingsCard,
		FilterDropdown,
		type FilterDropdownOption,
	} from '@manacore/shared-ui';
	import {
		X,
		CalendarBlank,
		Plus,
		Eye,
		Clock,
		Microphone,
		Cake,
		User,
	} from '@manacore/shared-icons';
	import { focusTrap } from '@manacore/shared-ui';
	import type { CalendarViewType, Calendar } from '@calendar/shared';

	interface Props {
		visible: boolean;
		onClose: () => void;
	}

	let { visible, onClose }: Props = $props();

	// Get calendars from layout context (live query)
	const calendarsCtx: { readonly value: Calendar[] } = getContext('calendars');

	// Calendar management state
	let editingCalendar = $state<Calendar | null>(null);
	let editName = $state('');
	let editColor = $state('');
	let editIsDefault = $state(false);
	let showNewCalendarForm = $state(false);
	let newCalendarName = $state('');
	let newCalendarColor = $state('#3b82f6');

	function startEditing(calendar: Calendar) {
		editingCalendar = calendar;
		editName = calendar.name;
		editColor = calendar.color || '#3b82f6';
		editIsDefault = calendar.isDefault || false;
	}

	function cancelEditing() {
		editingCalendar = null;
		editName = '';
		editColor = '';
		editIsDefault = false;
	}

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

	async function handleUpdateCalendar() {
		if (!editingCalendar || !editName.trim()) return;

		// If setting as default and it wasn't before, use setAsDefault
		if (editIsDefault && !editingCalendar.isDefault) {
			const defaultResult = await calendarsStore.setAsDefault(
				editingCalendar.id,
				calendarsCtx.value
			);
			if (defaultResult?.error) {
				toast.error(`Fehler: ${defaultResult.error.message}`);
				return;
			}
		}

		// Update name and color
		const result = await calendarsStore.updateCalendar(editingCalendar.id, {
			name: editName.trim(),
			color: editColor,
		});

		if (result.error) {
			toast.error(`Fehler: ${result.error.message}`);
			return;
		}

		toast.success('Kalender aktualisiert');
		cancelEditing();
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
						<div class="calendars-toolbar">
							<button
								class="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
								onclick={() => (showNewCalendarForm = true)}
							>
								<Plus size={16} />
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
										<button
											type="submit"
											class="btn btn-primary"
											disabled={!newCalendarName.trim()}
										>
											Erstellen
										</button>
									</div>
								</form>
							</div>
						{/if}

						<div class="calendar-list">
							{#each calendarsCtx.value as calendar}
								{#if editingCalendar?.id === calendar.id}
									<div class="calendar-edit-form">
										<form
											onsubmit={(e) => {
												e.preventDefault();
												handleUpdateCalendar();
											}}
										>
											<div class="edit-form-row">
												<div class="edit-form-group edit-form-group--name">
													<label for="edit-name" class="edit-label">Name</label>
													<input
														type="text"
														id="edit-name"
														class="edit-input"
														placeholder="Kalender Name"
														bind:value={editName}
													/>
												</div>

												<div class="edit-form-group edit-form-group--color">
													<label for="edit-color" class="edit-label">Farbe</label>
													<div class="edit-color-wrapper">
														<input
															type="color"
															id="edit-color"
															class="edit-color-input"
															bind:value={editColor}
														/>
														<span class="edit-color-value">{editColor}</span>
													</div>
												</div>
											</div>

											<label class="edit-checkbox">
												<input
													type="checkbox"
													bind:checked={editIsDefault}
													disabled={editingCalendar.isDefault}
												/>
												<span class="edit-checkbox-text">
													Als Standardkalender verwenden
													{#if editingCalendar.isDefault}
														<span class="edit-checkbox-hint">(aktueller Standard)</span>
													{/if}
												</span>
											</label>

											<div class="edit-form-actions">
												<button type="button" class="btn btn-ghost" onclick={cancelEditing}>
													Abbrechen
												</button>
												<button type="submit" class="btn btn-primary" disabled={!editName.trim()}>
													Speichern
												</button>
											</div>
										</form>
									</div>
								{:else}
									<div class="calendar-card">
										<div class="calendar-info">
											<span class="color-dot" style="background-color: {calendar.color}"></span>
											<span class="calendar-name">{calendar.name}</span>
											{#if calendar.isDefault}
												<span class="badge badge-primary">Standard</span>
											{/if}
										</div>
										<div class="calendar-actions">
											<button class="btn btn-ghost btn-sm" onclick={() => startEditing(calendar)}>
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
									</div>
								{/if}
							{/each}

							{#if calendarsCtx.value.length === 0}
								<div class="empty-state">
									<p>Keine Kalender vorhanden</p>
								</div>
							{/if}
						</div>
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

	/* Calendar management styles */
	.calendars-toolbar {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 0.75rem;
	}

	.new-calendar-form {
		margin-bottom: 0.75rem;
		padding: 0.75rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: var(--radius-md);
	}

	.calendar-form-row {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.calendar-form-row .input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		background: hsl(var(--color-background));
		font-size: 0.875rem;
	}

	.color-input {
		width: 40px;
		height: 36px;
		padding: 2px;
		border: 2px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		cursor: pointer;
	}

	.calendar-form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.375rem;
	}

	.calendar-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.calendar-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0.75rem;
		background: hsl(var(--color-muted) / 0.2);
		border-radius: var(--radius-md);
	}

	/* Edit form styles */
	.calendar-edit-form {
		padding: 1rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-lg);
		box-shadow: 0 2px 8px hsl(var(--color-foreground) / 0.08);
	}

	.edit-form-row {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.edit-form-group {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.edit-form-group--name {
		flex: 1;
	}

	.edit-form-group--color {
		flex-shrink: 0;
	}

	.edit-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.edit-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		background: hsl(var(--color-background));
		border: 2px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		outline: none;
		transition:
			border-color 150ms ease,
			box-shadow 150ms ease;
	}

	.edit-input:hover {
		border-color: hsl(var(--color-muted-foreground) / 0.5);
	}

	.edit-input:focus {
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.15);
	}

	.edit-color-wrapper {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0.5rem 0.25rem 0.25rem;
		background: hsl(var(--color-background));
		border: 2px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		transition: border-color 150ms ease;
	}

	.edit-color-input {
		width: 28px;
		height: 28px;
		padding: 0;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		background: transparent;
	}

	.edit-color-input::-webkit-color-swatch-wrapper {
		padding: 0;
	}

	.edit-color-input::-webkit-color-swatch {
		border: none;
		border-radius: var(--radius-sm);
	}

	.edit-color-value {
		font-size: 0.75rem;
		font-family: monospace;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
	}

	.edit-checkbox {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		margin-bottom: 0.75rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background 150ms ease;
		font-size: 0.8125rem;
	}

	.edit-checkbox:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.edit-checkbox input[type='checkbox'] {
		width: 1rem;
		height: 1rem;
		accent-color: hsl(var(--color-primary));
		cursor: pointer;
	}

	.edit-checkbox-text {
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}

	.edit-checkbox-hint {
		color: hsl(var(--color-muted-foreground));
		font-style: italic;
		margin-left: 0.25rem;
	}

	.edit-form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.375rem;
		padding-top: 0.75rem;
		border-top: 1px solid hsl(var(--color-border));
	}

	.calendar-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.color-dot {
		width: 14px;
		height: 14px;
		border-radius: var(--radius-full);
	}

	.calendar-name {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.badge {
		font-size: 0.6875rem;
		padding: 0.125rem 0.375rem;
		background: hsl(var(--color-muted));
		border-radius: var(--radius-sm);
		color: hsl(var(--color-muted-foreground));
	}

	.badge-primary {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
		font-weight: 500;
	}

	.calendar-actions {
		display: flex;
		gap: 0.375rem;
	}

	.btn {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 150ms ease;
		border: none;
	}

	.btn-ghost {
		background: transparent;
		color: hsl(var(--color-foreground));
	}

	.btn-ghost:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.btn-primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.btn-primary:hover {
		background: hsl(var(--color-primary) / 0.9);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-sm {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
	}

	.empty-state {
		text-align: center;
		padding: 1rem;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
	}

	/* Birthday age setting (indented sub-setting) */
	.birthday-age-setting {
		padding-left: 1.5rem;
		border-left: 2px solid hsl(var(--color-primary) / 0.3);
		margin-left: 0.5rem;
	}
</style>
