<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { TimeFormat, AllDayDisplayMode } from '$lib/stores/settings.svelte';
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
	import { APP_VERSION } from '$lib/version';
	import type { CalendarViewType, Calendar } from '@calendar/shared';
	import {
		CalendarBlank,
		Plus,
		ArrowsClockwise,
		UsersThree,
		Eye,
		Clock,
		Cake,
		User,
		Microphone,
	} from '@manacore/shared-icons';

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
			toast.error(`${$_('common.error')}: ${result.error.message}`);
			return;
		}

		toast.success($_('settings.calendarCreated'));
		newCalendarName = '';
		showNewCalendarForm = false;
	}

	async function handleDeleteCalendar(calendar: Calendar) {
		if (!confirm($_('settings.confirmDeleteCalendar', { values: { name: calendar.name } }))) {
			return;
		}

		const result = await calendarsStore.deleteCalendar(calendar.id);

		if (result.error) {
			toast.error(`${$_('common.error')}: ${result.error.message}`);
			return;
		}

		toast.success($_('settings.calendarDeleted'));
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
				toast.error(`${$_('common.error')}: ${defaultResult.error.message}`);
				return;
			}
		}

		// Update name and color
		const result = await calendarsStore.updateCalendar(editingCalendar.id, {
			name: editName.trim(),
			color: editColor,
		});

		if (result.error) {
			toast.error(`${$_('common.error')}: ${result.error.message}`);
			return;
		}

		toast.success($_('settings.calendarUpdated'));
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
	let viewLabels = $derived<Record<CalendarViewType, string>>({
		week: $_('settings.viewWeek'),
		month: $_('settings.viewMonth'),
		agenda: $_('settings.viewAgenda'),
	});

	// Duration options in minutes
	const durationOptions = [15, 30, 45, 60, 90, 120];

	// Reminder options in minutes
	let reminderOptions = $derived([
		{ value: 0, label: $_('settings.reminderNone') },
		{ value: 5, label: $_('settings.reminderMinutes', { values: { count: 5 } }) },
		{ value: 10, label: $_('settings.reminderMinutes', { values: { count: 10 } }) },
		{ value: 15, label: $_('settings.reminderMinutes', { values: { count: 15 } }) },
		{ value: 30, label: $_('settings.reminderMinutes', { values: { count: 30 } }) },
		{ value: 60, label: $_('settings.reminderHour') },
		{ value: 1440, label: $_('settings.reminderDay') },
	]);

	// FilterDropdown options
	let viewOptions = $derived<FilterDropdownOption[]>(
		Object.entries(viewLabels).map(([value, label]) => ({ value, label }))
	);

	let durationDropdownOptions = $derived<FilterDropdownOption[]>(
		durationOptions.map((duration) => ({
			value: String(duration),
			label:
				duration >= 60
					? $_('settings.durationHours', { values: { count: duration / 60 } })
					: $_('settings.durationMinutes', { values: { count: duration } }),
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
</script>

<svelte:head>
	<title>{$_('nav.settings')} | {$_('app.name')}</title>
</svelte:head>

<div class="settings-page">
	<header class="page-header">
		<h1>{$_('nav.settings')}</h1>
	</header>

	<!-- Meine Kalender -->
	<SettingsSection title={$_('settings.myCalendars')}>
		{#snippet icon()}
			<CalendarBlank size={24} />
		{/snippet}
		<SettingsCard>
			<div class="p-5">
				<div class="calendars-toolbar">
					<button
						class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
						onclick={() => (showNewCalendarForm = true)}
					>
						<Plus size={16} />
						{$_('settings.newCalendar')}
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
									placeholder={$_('settings.calendarName')}
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
									{$_('common.cancel')}
								</button>
								<button type="submit" class="btn btn-primary" disabled={!newCalendarName.trim()}>
									{$_('common.create')}
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
											<label for="edit-name" class="edit-label">{$_('settings.name')}</label>
											<input
												type="text"
												id="edit-name"
												class="edit-input"
												placeholder={$_('settings.calendarName')}
												bind:value={editName}
											/>
										</div>

										<div class="edit-form-group edit-form-group--color">
											<label for="edit-color" class="edit-label">{$_('settings.color')}</label>
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
											{$_('settings.setAsDefault')}
											{#if editingCalendar.isDefault}
												<span class="edit-checkbox-hint">({$_('settings.currentDefault')})</span>
											{/if}
										</span>
									</label>

									<div class="edit-form-actions">
										<button type="button" class="btn btn-ghost" onclick={cancelEditing}>
											{$_('common.cancel')}
										</button>
										<button type="submit" class="btn btn-primary" disabled={!editName.trim()}>
											{$_('common.save')}
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
										<span class="badge badge-primary">{$_('settings.default')}</span>
									{/if}
								</div>
								<div class="calendar-actions">
									<button class="btn btn-ghost btn-sm" onclick={() => startEditing(calendar)}>
										{$_('common.edit')}
									</button>
									{#if !calendar.isDefault}
										<button
											class="btn btn-ghost btn-sm text-destructive"
											onclick={() => handleDeleteCalendar(calendar)}
										>
											{$_('common.delete')}
										</button>
									{/if}
								</div>
							</div>
						{/if}
					{/each}

					{#if calendarsCtx.value.length === 0}
						<div class="empty-state">
							<p>{$_('settings.noCalendars')}</p>
						</div>
					{/if}
				</div>
			</div>
		</SettingsCard>
	</SettingsSection>

	<!-- Externe Kalender -->
	<SettingsSection title={$_('settings.externalCalendars')}>
		{#snippet icon()}
			<ArrowsClockwise size={24} />
		{/snippet}
		<SettingsCard>
			<div class="flex flex-col gap-3">
				<p class="text-sm text-muted-foreground">
					{$_('settings.externalCalendarsDesc')}
				</p>
				<a
					href="/settings/sync"
					class="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors self-start"
				>
					{$_('settings.manageSync')}
				</a>
			</div>
		</SettingsCard>
	</SettingsSection>

	<!-- Kalender-Freigaben -->
	<SettingsSection title={$_('settings.shares')}>
		{#snippet icon()}
			<UsersThree size={24} />
		{/snippet}
		<SettingsCard>
			<div class="flex flex-col gap-3">
				<p class="text-sm text-muted-foreground">
					{$_('settings.sharesDesc')}
				</p>
				<a
					href="/settings/sharing"
					class="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors self-start"
				>
					{$_('settings.manageShares')}
				</a>
			</div>
		</SettingsCard>
	</SettingsSection>

	<!-- Global App Settings (synced across all apps) -->
	<GlobalSettingsSection
		{userSettings}
		appId="calendar"
		title={$_('settings.appSettings')}
		description={$_('settings.appSettingsDesc')}
	/>

	<!-- Kalender-Ansicht -->
	<SettingsSection title={$_('settings.calendarView')}>
		{#snippet icon()}
			<Eye size={24} />
		{/snippet}
		<SettingsCard>
			<div class="p-5 space-y-4">
				<div class="setting-item">
					<div class="setting-info">
						<span class="setting-label">{$_('settings.defaultView')}</span>
						<span class="setting-description">{$_('settings.defaultViewDesc')}</span>
					</div>
					<FilterDropdown
						options={viewOptions}
						value={settingsStore.defaultView}
						onChange={(v) => handleViewChange(v as CalendarViewType)}
						placeholder={$_('settings.selectView')}
					/>
				</div>

				<div class="setting-item">
					<div class="setting-info">
						<span class="setting-label">{$_('settings.timeFormat')}</span>
						<span class="setting-description">{$_('settings.timeFormatDesc')}</span>
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
							<span class="setting-label">{$_('settings.weekdaysOnly')}</span>
							<span class="setting-description">{$_('settings.weekdaysOnlyDesc')}</span>
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
							<span class="setting-label">{$_('settings.showWeekNumbers')}</span>
							<span class="setting-description">{$_('settings.showWeekNumbersDesc')}</span>
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
							<span class="setting-label">{$_('settings.filterHours')}</span>
							<span class="setting-description">{$_('settings.filterHoursDesc')}</span>
						</div>
					</label>
				</div>

				{#if settingsStore.filterHoursEnabled}
					<div class="setting-item hour-range-setting">
						<div class="setting-info">
							<span class="setting-label">{$_('settings.visibleHours')}</span>
							<span class="setting-description">{$_('settings.visibleHoursDesc')}</span>
						</div>
						<div class="hour-range-inputs">
							<div class="hour-input-group">
								<span class="hour-label">{$_('settings.hoursFrom')}</span>
								<FilterDropdown
									options={hourStartOptions}
									value={String(settingsStore.dayStartHour)}
									onChange={(v) => settingsStore.set('dayStartHour', Number(v))}
									placeholder={$_('event.start')}
								/>
							</div>
							<span class="hour-separator">–</span>
							<div class="hour-input-group">
								<span class="hour-label">{$_('settings.hoursTo')}</span>
								<FilterDropdown
									options={hourEndOptions}
									value={String(settingsStore.dayEndHour)}
									onChange={(v) => settingsStore.set('dayEndHour', Number(v))}
									placeholder={$_('event.end')}
								/>
							</div>
						</div>
					</div>
				{/if}

				<div class="setting-item">
					<div class="setting-info">
						<span class="setting-label">{$_('settings.allDayEvents')}</span>
						<span class="setting-description">{$_('settings.allDayEventsDesc')}</span>
					</div>
					<div class="button-group">
						<button
							class="group-button"
							class:active={settingsStore.allDayDisplayMode === 'header'}
							onclick={() => settingsStore.set('allDayDisplayMode', 'header' as AllDayDisplayMode)}
						>
							{$_('settings.allDayInHeader')}
						</button>
						<button
							class="group-button"
							class:active={settingsStore.allDayDisplayMode === 'block'}
							onclick={() => settingsStore.set('allDayDisplayMode', 'block' as AllDayDisplayMode)}
						>
							{$_('settings.allDayAsBlock')}
						</button>
					</div>
				</div>
			</div>
		</SettingsCard>
	</SettingsSection>

	<!-- Termin-Einstellungen -->
	<SettingsSection title={$_('settings.events')}>
		{#snippet icon()}
			<Clock size={24} />
		{/snippet}
		<SettingsCard>
			<div class="p-5 space-y-4">
				<div class="setting-item">
					<div class="setting-info">
						<span class="setting-label">{$_('settings.defaultDuration')}</span>
						<span class="setting-description">{$_('settings.defaultDurationDesc')}</span>
					</div>
					<FilterDropdown
						options={durationDropdownOptions}
						value={String(settingsStore.defaultEventDuration)}
						onChange={(v) => handleEventDurationChange(Number(v))}
						placeholder={$_('settings.selectDuration')}
					/>
				</div>

				<div class="setting-item">
					<div class="setting-info">
						<span class="setting-label">Smarte Dauer</span>
						<span class="setting-description"
							>Dauer automatisch aus vergangenen Terminen lernen</span
						>
					</div>
					<label class="toggle-wrapper">
						<input
							type="checkbox"
							checked={settingsStore.smartDurationEnabled}
							onchange={() =>
								settingsStore.set('smartDurationEnabled', !settingsStore.smartDurationEnabled)}
						/>
					</label>
				</div>

				<div class="setting-item">
					<div class="setting-info">
						<span class="setting-label">{$_('settings.defaultReminder')}</span>
						<span class="setting-description">{$_('settings.defaultReminderDesc')}</span>
					</div>
					<FilterDropdown
						options={reminderDropdownOptions}
						value={String(settingsStore.defaultReminder)}
						onChange={(v) => handleReminderChange(Number(v))}
						placeholder={$_('settings.selectReminder')}
					/>
				</div>
			</div>
		</SettingsCard>
	</SettingsSection>

	<!-- Geburtstage -->
	<SettingsSection title={$_('settings.birthdays')}>
		{#snippet icon()}
			<Cake size={24} />
		{/snippet}
		<SettingsCard>
			<div class="p-5 space-y-4">
				<div class="setting-item">
					<label class="toggle-setting">
						<input
							type="checkbox"
							checked={settingsStore.showBirthdays}
							onchange={() => settingsStore.set('showBirthdays', !settingsStore.showBirthdays)}
						/>
						<div class="toggle-info">
							<span class="setting-label">{$_('settings.showBirthdays')}</span>
							<span class="setting-description">{$_('settings.showBirthdaysDesc')}</span>
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
								<span class="setting-label">{$_('settings.showAge')}</span>
								<span class="setting-description">{$_('settings.showAgeDesc')}</span>
							</div>
						</label>
					</div>
				{/if}
			</div>
		</SettingsCard>
	</SettingsSection>

	<!-- Konto -->
	<SettingsSection title={$_('settings.account')}>
		{#snippet icon()}
			<User size={24} />
		{/snippet}
		<SettingsCard>
			<div class="p-5 space-y-4">
				<div class="setting-item">
					<div class="setting-info">
						<span class="setting-label">{$_('auth.email')}</span>
						<span class="setting-value">{authStore.user?.email || '-'}</span>
					</div>
				</div>

				<div class="setting-item">
					<button
						class="btn btn-ghost text-destructive"
						onclick={() => authStore.signOut().then(() => goto('/login'))}
					>
						{$_('auth.logout')}
					</button>
				</div>
			</div>
		</SettingsCard>
	</SettingsSection>

	<p class="mt-8 pb-4 text-center text-xs text-gray-400 dark:text-gray-600">v{APP_VERSION}</p>
</div>

<style>
	.settings-page {
		max-width: 600px;
		margin: 0 auto;
		padding-bottom: 2rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.page-header {
		margin-bottom: 0;
	}

	.page-header h1 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
	}

	.calendars-toolbar {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 1rem;
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

	.hour-label {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.hour-separator {
		font-size: 1.25rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 1.25rem;
	}

	/* Calendar management styles */
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

	/* Edit form styles */
	.calendar-edit-form {
		padding: 1.25rem;
		background: hsl(var(--color-card));
		border: 1px solid hsl(var(--color-border));
		border-radius: var(--radius-lg);
		box-shadow: 0 2px 8px hsl(var(--color-foreground) / 0.08);
	}

	.edit-form-row {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.edit-form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.edit-form-group--name {
		flex: 1;
	}

	.edit-form-group--color {
		flex-shrink: 0;
	}

	.edit-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.edit-input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		font-size: 0.9375rem;
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

	.edit-input::placeholder {
		color: hsl(var(--color-muted-foreground) / 0.7);
	}

	.edit-color-wrapper {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.375rem 0.625rem 0.375rem 0.375rem;
		background: hsl(var(--color-background));
		border: 2px solid hsl(var(--color-border));
		border-radius: var(--radius-md);
		transition: border-color 150ms ease;
	}

	.edit-color-wrapper:hover {
		border-color: hsl(var(--color-muted-foreground) / 0.5);
	}

	.edit-color-wrapper:focus-within {
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.15);
	}

	.edit-color-input {
		width: 32px;
		height: 32px;
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

	.edit-color-input::-moz-color-swatch {
		border: none;
		border-radius: var(--radius-sm);
	}

	.edit-color-value {
		font-size: 0.8125rem;
		font-family: monospace;
		color: hsl(var(--color-muted-foreground));
		text-transform: uppercase;
	}

	.edit-checkbox {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		margin-bottom: 1rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background 150ms ease;
	}

	.edit-checkbox:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.edit-checkbox input[type='checkbox'] {
		width: 1.125rem;
		height: 1.125rem;
		accent-color: hsl(var(--color-primary));
		cursor: pointer;
	}

	.edit-checkbox input[type='checkbox']:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.edit-checkbox-text {
		font-size: 0.875rem;
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
		gap: 0.5rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--color-border));
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

	.badge-primary {
		background: hsl(var(--color-primary) / 0.15);
		color: hsl(var(--color-primary));
		font-weight: 500;
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

	/* Birthday age setting (indented sub-setting) */
	.birthday-age-setting {
		padding-left: 2rem;
		border-left: 2px solid hsl(var(--color-primary) / 0.3);
		margin-left: 0.5rem;
	}
</style>
