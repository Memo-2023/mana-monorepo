<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { APP_VERSION } from '$lib/version';
	import { todoSettings, type TodoView, type KanbanCardSize } from '$lib/stores/settings.svelte';
	import { projectsStore } from '$lib/stores/projects.svelte';
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

	// Use shared priority options (without color)
	const priorityOptions = PRIORITY_OPTIONS.map((p) => ({ value: p.value, label: p.label }));

	const viewOptions = [
		{ value: 'inbox', label: 'Inbox' },
		{ value: 'today', label: 'Heute' },
		{ value: 'upcoming', label: 'Anstehend' },
		{ value: 'kanban', label: 'Kanban' },
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

	// Project options for quick add (computed)
	let projectOptions = $derived([
		{ value: null, label: 'Inbox' },
		...projectsStore.projects.map((p) => ({ value: p.id, label: p.name })),
	]);

	onMount(async () => {
		// Load user settings and projects from server (only if authenticated)
		if (authStore.isAuthenticated) {
			await Promise.all([userSettings.load(), projectsStore.fetchProjects()]);
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
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsRow label="E-Mail" description={authStore.user?.email || 'Nicht angemeldet'}>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				{/snippet}
			</SettingsRow>

			<SettingsRow label="Konto-Status" description="Dein aktueller Kontostatus" border={false}>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
						/>
					</svg>
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
			{ href: '/kanban', label: 'Kanban', icon: 'columns' },
			{ href: '/statistics', label: 'Statistiken', icon: 'chart' },
			{ href: '/tags', label: 'Tags', icon: 'tag' },
			{ href: '/network', label: 'Netzwerk', icon: 'share-2' },
			{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
			{ href: '/feedback', label: 'Feedback', icon: 'chat' },
		]}
		alwaysVisibleHrefs={['/', '/settings']}
	/>

	<!-- Task Behavior Section -->
	<SettingsSection title="Task-Verhalten">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
				/>
			</svg>
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
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
						/>
					</svg>
				{/snippet}
			</SettingsSelect>

			<SettingsTimeInput
				label="Standard-Uhrzeit"
				description="Standard-Uhrzeit für Fälligkeiten"
				value={todoSettings.defaultDueTime}
				onchange={(v: string | null) => todoSettings.set('defaultDueTime', v)}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				{/snippet}
			</SettingsTimeInput>

			<SettingsSelect
				label="Standard-Projekt"
				description="Projekt für Quick-Add"
				options={projectOptions}
				value={todoSettings.quickAddProject}
				onchange={(v: string | number | null) =>
					todoSettings.set('quickAddProject', v as string | null)}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
						/>
					</svg>
				{/snippet}
			</SettingsSelect>

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
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
						/>
					</svg>
				{/snippet}
			</SettingsNumberInput>

			<SettingsToggle
				label="Löschen bestätigen"
				description="Bestätigung vor dem Löschen von Tasks"
				isOn={userSettings.general?.confirmOnDelete ?? true}
				onToggle={(v) => userSettings.updateGeneral({ confirmOnDelete: v })}
				border={false}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>
		</SettingsCard>
	</SettingsSection>

	<!-- View & Display Section -->
	<SettingsSection title="Ansicht & Darstellung">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
				/>
			</svg>
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
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
						/>
					</svg>
				{/snippet}
			</SettingsSelect>

			<SettingsToggle
				label="Task-Zähler"
				description="Badge-Zähler in Navigation anzeigen"
				isOn={todoSettings.showTaskCounts}
				onToggle={(v) => todoSettings.set('showTaskCounts', v)}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>

			<SettingsToggle
				label="Kompakter Modus"
				description="Reduziertes Padding für mehr Tasks"
				isOn={todoSettings.compactMode}
				onToggle={(v) => todoSettings.set('compactMode', v)}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 10h16M4 14h16M4 18h16"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>

			<SettingsToggle
				label="Subtask-Fortschritt"
				description="Fortschrittsbalken für Subtasks anzeigen"
				isOn={todoSettings.showSubtaskProgress}
				onToggle={(v) => todoSettings.set('showSubtaskProgress', v)}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>

			<SettingsToggle
				label="Nach Projekt gruppieren"
				description="Tasks nach Projekt gruppieren"
				isOn={todoSettings.groupByProject}
				onToggle={(v) => todoSettings.set('groupByProject', v)}
				border={false}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>
		</SettingsCard>
	</SettingsSection>

	<!-- Kanban Section -->
	<SettingsSection title="Kanban-Board">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
				/>
			</svg>
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
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
						/>
					</svg>
				{/snippet}
			</SettingsSelect>

			<SettingsToggle
				label="Labels auf Karten"
				description="Labels auf Kanban-Karten anzeigen"
				isOn={todoSettings.showLabelsOnCards}
				onToggle={(v) => todoSettings.set('showLabelsOnCards', v)}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
						/>
					</svg>
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
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				{/snippet}
			</SettingsNumberInput>
		</SettingsCard>
	</SettingsSection>

	<!-- Notifications Section -->
	<SettingsSection title="Benachrichtigungen">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
				/>
			</svg>
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
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				{/snippet}
			</SettingsSelect>

			<SettingsToggle
				label="Tägliche Zusammenfassung"
				description="Tägliche E-Mail mit offenen Tasks"
				isOn={todoSettings.dailyDigestEnabled}
				onToggle={(v) => todoSettings.set('dailyDigestEnabled', v)}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
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
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>
		</SettingsCard>
	</SettingsSection>

	<!-- Productivity Section -->
	<SettingsSection title="Produktivität">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 10V3L4 14h7v7l9-11h-7z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsToggle
				label="Fokus-Modus"
				description="Ablenkungsfreie Ansicht für konzentriertes Arbeiten"
				isOn={todoSettings.focusMode}
				onToggle={(v) => todoSettings.set('focusMode', v)}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>

			<SettingsToggle
				label="Pomodoro-Timer"
				description="Eingebauter Pomodoro-Timer aktivieren"
				isOn={todoSettings.pomodoroEnabled}
				onToggle={(v) => todoSettings.set('pomodoroEnabled', v)}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
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
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
						/>
					</svg>
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
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>
		</SettingsCard>
	</SettingsSection>

	<!-- Keyboard Shortcuts Section -->
	<SettingsSection title="Tastenkürzel">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
				/>
			</svg>
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
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>
		</SettingsCard>
	</SettingsSection>

	<!-- About Section -->
	<SettingsSection title="Über">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsRow label="Version" border={false}>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
						/>
					</svg>
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
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					/>
				</svg>
			{/snippet}
		</SettingsDangerButton>
	</SettingsDangerZone>

	<p class="mt-8 pb-4 text-center text-xs text-gray-400 dark:text-gray-600">v{APP_VERSION}</p>
</SettingsPage>
