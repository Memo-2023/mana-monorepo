<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import type { TimeFormat, AllDayDisplayMode } from '$lib/stores/settings.svelte';
	import { getContext } from 'svelte';
	import CalendarManagement from '$lib/components/settings/CalendarManagement.svelte';
	import {
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

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}
		settingsStore.initialize();
		await userSettings.load();
	});

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
				<CalendarManagement calendars={calendarsCtx.value} />
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

	/* Birthday age setting (indented sub-setting) */
	.birthday-age-setting {
		padding-left: 2rem;
		border-left: 2px solid hsl(var(--color-primary) / 0.3);
		margin-left: 0.5rem;
	}
</style>
