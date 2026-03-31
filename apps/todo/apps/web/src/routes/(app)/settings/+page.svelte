<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { APP_VERSION } from '$lib/version';
	import {
		todoSettings,
		type TodoView,
		type KanbanCardSize,
		type PageMode,
	} from '$lib/stores/settings.svelte';
	import type { TaskPriority } from '@todo/shared';
	import { PRIORITY_OPTIONS } from '@todo/shared';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		SettingsToggle,
		SettingsSelect,
		SettingsNumberInput,
		SettingsTimeInput,
		SettingsDangerZone,
		SettingsDangerButton,
		GlobalSettingsSection,
	} from '@manacore/shared-ui';
	import {
		Archive,
		Bell,
		ChartBar,
		ClipboardText,
		Clock,
		Columns,
		Envelope,
		EnvelopeSimple,
		Eye,
		Fire,
		GraduationCap,
		GridFour,
		Hash,
		House,
		Info,
		Key,
		Lightning,
		ListBullets,
		MapPin,
		Rows,
		SealCheck,
		ShieldCheck,
		SignOut,
		SortAscending,
		SquaresFour,
		Tag,
		Timer,
		Trash,
		User,
		Warning,
		WarningCircle,
	} from '@manacore/shared-icons';

	// Use shared priority options (without color)
	const priorityOptions = PRIORITY_OPTIONS.map((p) => ({ value: p.value, label: p.label }));

	const viewOptions = [
		{ value: 'inbox', label: 'Inbox' },
		{ value: 'today', label: 'Heute' },
		{ value: 'upcoming', label: 'Anstehend' },
		{ value: 'completed', label: 'Erledigt' },
	];

	const cardSizeOptions = [
		{ value: 'compact', label: 'Kompakt' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'large', label: 'Groß' },
	];

	const reminderOptions = [
		{ value: null, label: 'Keine' },
		{ value: 5, label: '5 Minuten' },
		{ value: 15, label: '15 Minuten' },
		{ value: 30, label: '30 Minuten' },
		{ value: 60, label: '1 Stunde' },
		{ value: 1440, label: '1 Tag' },
	];

	const pageModeOptions = [
		{ value: 'priority', label: 'Nach Priorität (Eisenhower)' },
		{ value: 'date', label: 'Nach Datum (Heute/Morgen)' },
		{ value: 'custom', label: 'Eigene Seiten (✏️ auf Startseite)' },
	];

	const durationOptions = [
		{ value: '5', label: '5 min' },
		{ value: '10', label: '10 min' },
		{ value: '15', label: '15 min' },
		{ value: '30', label: '30 min' },
		{ value: '45', label: '45 min' },
		{ value: '60', label: '1 Stunde' },
		{ value: '90', label: '1,5 Stunden' },
		{ value: '120', label: '2 Stunden' },
	];

	onMount(async () => {
		// Load user settings and projects from server (only if authenticated)
		if (authStore.isAuthenticated) {
			await userSettings.load();
		}

		// Initialize todo settings from localStorage
		todoSettings.initialize();
	});

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Einstellungen | Todo</title>
</svelte:head>

<SettingsPage title="Einstellungen" subtitle="Verwalte dein Konto und passe die App an.">
	<!-- Account Section -->
	<SettingsSection title="Konto">
		{#snippet icon()}
			<User size={20} />
		{/snippet}

		<SettingsCard>
			<SettingsRow label="E-Mail" description={authStore.user?.email || 'Nicht angemeldet'}>
				{#snippet icon()}
					<EnvelopeSimple size={20} />
				{/snippet}
			</SettingsRow>

			<SettingsRow label="Konto-Status" description="Dein aktueller Kontostatus" border={false}>
				{#snippet icon()}
					<ShieldCheck size={20} />
				{/snippet}
				<span
					class="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400"
				>
					Aktiv
				</span>
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Global Settings Section (synced across all apps) -->
	<GlobalSettingsSection
		{userSettings}
		appId="todo"
		navItems={[
			{ href: '/', label: 'Aufgaben', icon: 'list' },
			{ href: '/statistics', label: 'Statistiken', icon: 'chart' },
			{ href: '/tags', label: 'Tags', icon: 'tag' },
			{ href: '/network', label: 'Netzwerk', icon: 'share-2' },
			{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
			{ href: '/feedback', label: 'Feedback', icon: 'chat' },
		]}
		alwaysVisibleHrefs={['/', '/settings']}
	/>

	<!-- Page Layout Section -->
	<SettingsSection title="Seiten-Ansicht">
		{#snippet icon()}
			<Rows size={20} />
		{/snippet}

		<SettingsCard>
			<SettingsSelect
				label="Seiten-Modus"
				description="Wie deine Aufgaben auf den Papier-Seiten gruppiert werden"
				options={pageModeOptions}
				value={todoSettings.pageMode}
				onchange={(v: string | number | null) => todoSettings.set('pageMode', v as PageMode)}
			>
				{#snippet icon()}
					<ListBullets size={20} />
				{/snippet}
			</SettingsSelect>
		</SettingsCard>
	</SettingsSection>

	<!-- Task Behavior Section -->
	<SettingsSection title="Task-Verhalten">
		{#snippet icon()}
			<ClipboardText size={20} />
		{/snippet}

		<SettingsCard>
			<SettingsSelect
				label="Standard-Priorität"
				description="Priorität für neue Tasks"
				options={priorityOptions}
				value={todoSettings.defaultPriority}
				onchange={(v: string | number | null) =>
					todoSettings.set('defaultPriority', v as TaskPriority)}
			>
				{#snippet icon()}
					<SortAscending size={20} />
				{/snippet}
			</SettingsSelect>

			<SettingsTimeInput
				label="Standard-Uhrzeit"
				description="Standard-Uhrzeit für Fälligkeiten"
				value={todoSettings.defaultDueTime}
				onchange={(v: string | null) => todoSettings.set('defaultDueTime', v)}
			>
				{#snippet icon()}
					<Clock size={20} />
				{/snippet}
			</SettingsTimeInput>

			<SettingsNumberInput
				label="Auto-Archivierung"
				description="Erledigte Tasks nach X Tagen archivieren"
				value={todoSettings.autoArchiveCompletedDays}
				onchange={(v: number | null) => todoSettings.set('autoArchiveCompletedDays', v)}
				min={1}
				max={365}
				placeholder="Aus"
			>
				{#snippet icon()}
					<Archive size={20} />
				{/snippet}
			</SettingsNumberInput>

			<SettingsToggle
				label="Smarte Dauer"
				description="Dauer automatisch aus erledigten Tasks lernen und vorschlagen"
				isOn={todoSettings.smartDurationEnabled}
				onToggle={(v) => todoSettings.set('smartDurationEnabled', v)}
			>
				{#snippet icon()}
					<Lightning size={20} />
				{/snippet}
			</SettingsToggle>

			{#if todoSettings.smartDurationEnabled}
				<SettingsSelect
					label="Standard-Dauer"
					description="Fallback wenn keine Historie vorhanden"
					options={durationOptions}
					value={String(todoSettings.defaultTaskDuration)}
					onchange={(v) => todoSettings.set('defaultTaskDuration', Number(v))}
				>
					{#snippet icon()}
						<Clock size={20} />
					{/snippet}
				</SettingsSelect>
			{/if}

			<SettingsToggle
				label="Löschen bestätigen"
				description="Bestätigung vor dem Löschen von Tasks"
				isOn={userSettings.general?.confirmOnDelete ?? true}
				onToggle={(v) => userSettings.updateGeneral({ confirmOnDelete: v })}
				border={false}
			>
				{#snippet icon()}
					<Trash size={20} />
				{/snippet}
			</SettingsToggle>
		</SettingsCard>
	</SettingsSection>

	<!-- View & Display Section -->
	<SettingsSection title="Ansicht & Darstellung">
		{#snippet icon()}
			<SquaresFour size={20} />
		{/snippet}

		<SettingsCard>
			<SettingsSelect
				label="Startansicht"
				description="Ansicht beim Öffnen der App"
				options={viewOptions}
				value={todoSettings.defaultView}
				onchange={(v: string | number | null) => todoSettings.set('defaultView', v as TodoView)}
			>
				{#snippet icon()}
					<House size={20} />
				{/snippet}
			</SettingsSelect>

			<SettingsToggle
				label="Task-Zähler"
				description="Badge-Zähler in Navigation anzeigen"
				isOn={todoSettings.showTaskCounts}
				onToggle={(v) => todoSettings.set('showTaskCounts', v)}
			>
				{#snippet icon()}
					<Hash size={20} />
				{/snippet}
			</SettingsToggle>

			<SettingsToggle
				label="Kompakter Modus"
				description="Reduziertes Padding für mehr Tasks"
				isOn={todoSettings.compactMode}
				onToggle={(v) => todoSettings.set('compactMode', v)}
			>
				{#snippet icon()}
					<ListBullets size={20} />
				{/snippet}
			</SettingsToggle>

			<SettingsToggle
				label="Subtask-Fortschritt"
				description="Fortschrittsbalken für Subtasks anzeigen"
				isOn={todoSettings.showSubtaskProgress}
				onToggle={(v) => todoSettings.set('showSubtaskProgress', v)}
				border={false}
			>
				{#snippet icon()}
					<ChartBar size={20} />
				{/snippet}
			</SettingsToggle>
		</SettingsCard>
	</SettingsSection>

	<!-- Kanban Section -->
	<SettingsSection title="Kanban-Board">
		{#snippet icon()}
			<Columns size={20} />
		{/snippet}

		<SettingsCard>
			<SettingsSelect
				label="Kartengröße"
				description="Größe der Kanban-Karten"
				options={cardSizeOptions}
				value={todoSettings.kanbanCardSize}
				onchange={(v: string | number | null) =>
					todoSettings.set('kanbanCardSize', v as KanbanCardSize)}
			>
				{#snippet icon()}
					<GridFour size={20} />
				{/snippet}
			</SettingsSelect>

			<SettingsToggle
				label="Labels auf Karten"
				description="Labels auf Kanban-Karten anzeigen"
				isOn={todoSettings.showLabelsOnCards}
				onToggle={(v) => todoSettings.set('showLabelsOnCards', v)}
			>
				{#snippet icon()}
					<Tag size={20} />
				{/snippet}
			</SettingsToggle>

			<SettingsNumberInput
				label="WIP-Limit"
				description="Max. Tasks pro Spalte (Work in Progress)"
				value={todoSettings.wipLimitPerColumn}
				onchange={(v: number | null) => todoSettings.set('wipLimitPerColumn', v)}
				min={1}
				max={50}
				placeholder="Unbegrenzt"
				border={false}
			>
				{#snippet icon()}
					<Warning size={20} />
				{/snippet}
			</SettingsNumberInput>
		</SettingsCard>
	</SettingsSection>

	<!-- Notifications Section -->
	<SettingsSection title="Benachrichtigungen">
		{#snippet icon()}
			<Bell size={20} />
		{/snippet}

		<SettingsCard>
			<SettingsSelect
				label="Standard-Erinnerung"
				description="Erinnerung vor Fälligkeit"
				options={reminderOptions}
				value={todoSettings.defaultReminderMinutes}
				onchange={(v: string | number | null) =>
					todoSettings.set('defaultReminderMinutes', v as number | null)}
			>
				{#snippet icon()}
					<Clock size={20} />
				{/snippet}
			</SettingsSelect>

			<SettingsToggle
				label="Tägliche Zusammenfassung"
				description="Tägliche E-Mail mit offenen Tasks"
				isOn={todoSettings.dailyDigestEnabled}
				onToggle={(v) => todoSettings.set('dailyDigestEnabled', v)}
			>
				{#snippet icon()}
					<Envelope size={20} />
				{/snippet}
			</SettingsToggle>

			<SettingsToggle
				label="Überfällige Tasks"
				description="Benachrichtigung bei überfälligen Tasks"
				isOn={todoSettings.overdueNotifications}
				onToggle={(v) => todoSettings.set('overdueNotifications', v)}
				border={false}
			>
				{#snippet icon()}
					<Warning size={20} />
				{/snippet}
			</SettingsToggle>
		</SettingsCard>
	</SettingsSection>

	<!-- Productivity Section -->
	<SettingsSection title="Produktivität">
		{#snippet icon()}
			<Lightning size={20} />
		{/snippet}

		<SettingsCard>
			<SettingsToggle
				label="Fokus-Modus"
				description="Ablenkungsfreie Ansicht für konzentriertes Arbeiten"
				isOn={todoSettings.focusMode}
				onToggle={(v) => todoSettings.set('focusMode', v)}
			>
				{#snippet icon()}
					<MapPin size={20} />
				{/snippet}
			</SettingsToggle>

			<SettingsToggle
				label="Pomodoro-Timer"
				description="Eingebauter Pomodoro-Timer aktivieren"
				isOn={todoSettings.pomodoroEnabled}
				onToggle={(v) => todoSettings.set('pomodoroEnabled', v)}
			>
				{#snippet icon()}
					<Clock size={20} />
				{/snippet}
			</SettingsToggle>

			<SettingsNumberInput
				label="Tägliches Ziel"
				description="Anzahl Tasks, die du pro Tag erledigen möchtest"
				value={todoSettings.dailyGoal}
				onchange={(v: number | null) => todoSettings.set('dailyGoal', v)}
				min={1}
				max={50}
				placeholder="Kein Ziel"
			>
				{#snippet icon()}
					<SealCheck size={20} />
				{/snippet}
			</SettingsNumberInput>

			<SettingsToggle
				label="Streak anzeigen"
				description="Produktivitäts-Streak in der Sidebar anzeigen"
				isOn={todoSettings.showStreak}
				onToggle={(v) => todoSettings.set('showStreak', v)}
				border={false}
			>
				{#snippet icon()}
					<Fire size={20} />
				{/snippet}
			</SettingsToggle>
		</SettingsCard>
	</SettingsSection>

	<!-- Keyboard Shortcuts Section -->
	<SettingsSection title="Tastenkürzel">
		{#snippet icon()}
			<GraduationCap size={20} />
		{/snippet}

		<SettingsCard>
			<SettingsToggle
				label="Tastenkürzel aktivieren"
				description="Schnellzugriff mit Tastatur"
				isOn={userSettings.general?.keyboardShortcutsEnabled ?? true}
				onToggle={(v) => userSettings.updateGeneral({ keyboardShortcutsEnabled: v })}
				border={false}
			>
				{#snippet icon()}
					<Key size={20} />
				{/snippet}
			</SettingsToggle>
		</SettingsCard>
	</SettingsSection>

	<!-- About Section -->
	<SettingsSection title="Über">
		{#snippet icon()}
			<Info size={20} />
		{/snippet}

		<SettingsCard>
			<SettingsRow label="Version" border={false}>
				{#snippet icon()}
					<Tag size={20} />
				{/snippet}
				<span class="text-[hsl(var(--muted-foreground))]">1.0.0</span>
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Danger Zone -->
	<SettingsDangerZone title="Gefahrenzone">
		<SettingsDangerButton
			label="Abmelden"
			description="Von deinem Konto abmelden"
			buttonText="Abmelden"
			onclick={handleLogout}
			border={false}
		>
			{#snippet icon()}
				<SignOut size={20} />
			{/snippet}
		</SettingsDangerButton>
	</SettingsDangerZone>

	<p class="mt-8 pb-4 text-center text-xs text-gray-400 dark:text-gray-600">v{APP_VERSION}</p>
</SettingsPage>
