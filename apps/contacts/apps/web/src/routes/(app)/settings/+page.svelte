<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import {
		contactsSettings,
		type ContactView,
		type ContactSortBy,
		type ContactSortOrder,
		type DateFormat,
	} from '$lib/stores/settings.svelte';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		SettingsToggle,
		SettingsSelect,
		SettingsNumberInput,
		SettingsDangerZone,
		SettingsDangerButton,
		GlobalSettingsSection,
	} from '@manacore/shared-ui';

	// Options for selects
	const viewOptions = [
		{ value: 'grid', label: 'Kacheln' },
		{ value: 'alphabet', label: 'Alphabetisch' },
		{ value: 'network', label: 'Netzwerk' },
	];

	const sortByOptions = [
		{ value: 'name', label: 'Name' },
		{ value: 'company', label: 'Firma' },
		{ value: 'created', label: 'Erstellt' },
		{ value: 'updated', label: 'Aktualisiert' },
	];

	const sortOrderOptions = [
		{ value: 'asc', label: 'Aufsteigend (A-Z)' },
		{ value: 'desc', label: 'Absteigend (Z-A)' },
	];

	const nameFormatOptions = [
		{ value: 'first-last', label: 'Vorname Nachname' },
		{ value: 'last-first', label: 'Nachname, Vorname' },
	];

	const dateFormatOptions = [
		{ value: 'dd.MM.yyyy', label: 'TT.MM.JJJJ (deutsch)' },
		{ value: 'MM/dd/yyyy', label: 'MM/TT/JJJJ (US)' },
		{ value: 'yyyy-MM-dd', label: 'JJJJ-MM-TT (ISO)' },
	];

	const duplicateSensitivityOptions = [
		{ value: 'strict', label: 'Streng' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'loose', label: 'Locker' },
	];

	// Translation function for start page labels
	const startPageLabels: Record<string, string> = {
		'nav.contacts': 'Kontakte',
		'nav.groups': 'Gruppen',
	};

	function translateLabel(key: string): string {
		return startPageLabels[key] || key;
	}

	onMount(async () => {
		if (!authStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Load user settings from server
		await userSettings.load();

		// Initialize contacts settings from localStorage
		contactsSettings.initialize();
	});

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}

	function handleResetSettings() {
		if (confirm('Alle Einstellungen auf Standardwerte zurücksetzen?')) {
			contactsSettings.reset();
		}
	}
</script>

<svelte:head>
	<title>Einstellungen - Kontakte</title>
</svelte:head>

<SettingsPage title="Einstellungen" subtitle="Passe die App an deine Vorlieben an.">
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
	<GlobalSettingsSection {userSettings} appId="contacts" t={translateLabel} />

	<!-- Display Settings Section -->
	<SettingsSection title="Anzeige">
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
				label="Standard-Ansicht"
				description="Ansicht beim Öffnen der App"
				options={viewOptions}
				value={contactsSettings.defaultView}
				onchange={(v: string | number | null) =>
					contactsSettings.set('defaultView', v as ContactView)}
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
			</SettingsSelect>

			<SettingsSelect
				label="Sortierung"
				description="Standard-Sortierung der Kontakte"
				options={sortByOptions}
				value={contactsSettings.sortBy}
				onchange={(v: string | number | null) => contactsSettings.set('sortBy', v as ContactSortBy)}
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

			<SettingsSelect
				label="Sortierreihenfolge"
				description="Aufsteigende oder absteigende Sortierung"
				options={sortOrderOptions}
				value={contactsSettings.sortOrder}
				onchange={(v: string | number | null) =>
					contactsSettings.set('sortOrder', v as ContactSortOrder)}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
						/>
					</svg>
				{/snippet}
			</SettingsSelect>

			<SettingsToggle
				label="Fotos anzeigen"
				description="Kontaktfotos in der Liste anzeigen"
				isOn={contactsSettings.showPhotos}
				onToggle={(v) => contactsSettings.set('showPhotos', v)}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>

			<SettingsToggle
				label="Firma anzeigen"
				description="Firmenname in der Kontaktliste anzeigen"
				isOn={contactsSettings.showCompany}
				onToggle={(v) => contactsSettings.set('showCompany', v)}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>

			<SettingsNumberInput
				label="Kontakte pro Seite"
				description="Anzahl der Kontakte pro Seite"
				value={contactsSettings.contactsPerPage}
				onchange={(v: number | null) => contactsSettings.set('contactsPerPage', v ?? 50)}
				min={10}
				max={200}
				border={false}
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
			</SettingsNumberInput>
		</SettingsCard>
	</SettingsSection>

	<!-- Contact Format Section -->
	<SettingsSection title="Kontakt-Darstellung">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsSelect
				label="Namensformat"
				description="Reihenfolge von Vor- und Nachname"
				options={nameFormatOptions}
				value={contactsSettings.nameFormat}
				onchange={(v: string | number | null) =>
					contactsSettings.set('nameFormat', v as 'first-last' | 'last-first')}
			>
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
			</SettingsSelect>

			<SettingsSelect
				label="Datumsformat"
				description="Format für Geburtstage und andere Daten"
				options={dateFormatOptions}
				value={contactsSettings.dateFormat}
				onchange={(v: string | number | null) =>
					contactsSettings.set('dateFormat', v as DateFormat)}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				{/snippet}
			</SettingsSelect>

			<SettingsToggle
				label="Geburtstags-Erinnerungen"
				description="Benachrichtigungen bei bevorstehenden Geburtstagen"
				isOn={contactsSettings.showBirthdayReminders}
				onToggle={(v) => contactsSettings.set('showBirthdayReminders', v)}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>

			<SettingsNumberInput
				label="Erinnerung X Tage vorher"
				description="Tage vor dem Geburtstag erinnern"
				value={contactsSettings.birthdayReminderDays}
				onchange={(v: number | null) => contactsSettings.set('birthdayReminderDays', v ?? 7)}
				min={1}
				max={30}
				border={false}
			>
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
			</SettingsNumberInput>
		</SettingsCard>
	</SettingsSection>

	<!-- Import/Export Section -->
	<SettingsSection title="Daten">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsRow
				label="Kontakte importieren"
				description="Aus Datei oder Google importieren"
				href="/data?tab=import"
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
						/>
					</svg>
				{/snippet}
			</SettingsRow>

			<SettingsRow
				label="Kontakte exportieren"
				description="Als vCard oder CSV herunterladen"
				href="/data?tab=export"
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
						/>
					</svg>
				{/snippet}
			</SettingsRow>

			<SettingsRow
				label="Archiv"
				description="Archivierte Kontakte anzeigen und verwalten"
				href="/archive"
				border={false}
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
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Duplicates Section -->
	<SettingsSection title="Duplikate">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsToggle
				label="Automatische Erkennung"
				description="Duplikate automatisch beim Import erkennen"
				isOn={contactsSettings.autoDetectDuplicates}
				onToggle={(v) => contactsSettings.set('autoDetectDuplicates', v)}
			>
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
			</SettingsToggle>

			<SettingsSelect
				label="Erkennungs-Empfindlichkeit"
				description="Wie streng sollen Duplikate erkannt werden?"
				options={duplicateSensitivityOptions}
				value={contactsSettings.duplicateSensitivity}
				onchange={(v: string | number | null) =>
					contactsSettings.set('duplicateSensitivity', v as 'strict' | 'normal' | 'loose')}
				border={false}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
						/>
					</svg>
				{/snippet}
			</SettingsSelect>
		</SettingsCard>
	</SettingsSection>

	<!-- Privacy Section -->
	<SettingsSection title="Datenschutz">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsToggle
				label="Datenschutz-Modus"
				description="Kontaktfotos und sensible Daten unkenntlich machen"
				isOn={contactsSettings.privacyMode}
				onToggle={(v) => contactsSettings.set('privacyMode', v)}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>

			<SettingsToggle
				label="Teilen bestätigen"
				description="Bestätigung vor dem Teilen von Kontakten"
				isOn={contactsSettings.confirmBeforeSharing}
				onToggle={(v) => contactsSettings.set('confirmBeforeSharing', v)}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
						/>
					</svg>
				{/snippet}
			</SettingsToggle>

			<SettingsToggle
				label="Löschen bestätigen"
				description="Bestätigung vor dem Löschen von Kontakten"
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
			label="Einstellungen zurücksetzen"
			description="Alle App-Einstellungen auf Standardwerte zurücksetzen"
			buttonText="Zurücksetzen"
			onclick={handleResetSettings}
		>
			{#snippet icon()}
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
			{/snippet}
		</SettingsDangerButton>

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
</SettingsPage>
